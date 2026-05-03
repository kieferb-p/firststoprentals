#!/usr/bin/env python3
"""
Fix rentals.json by matching new items (277-445) to their correct entries
in FirstStop_PriceList.csv, then applying correct day/week/month prices.
"""

import json
import csv
import re
import difflib

# ============================================================
# Load the price list CSV (source of truth)
# ============================================================

price_list = {}   # normalized_name -> daily_rate
with open('public/data/FirstStop_PriceList.csv') as f:
    reader = csv.reader(f)
    next(reader)   # skip header row
    for row in reader:
        item_name = row[0].strip() if len(row) > 0 else ''
        price_val = row[1].strip() if len(row) > 1 else ''
        
        # Skip category separators (all caps, no price)
        if not item_name or not price_val:
            continue
        try:
            daily = float(price_val.replace('$', ''))
            norm = re.sub(r'[\s\-\(\)\"\'\.,]+', '', item_name).lower()
            price_list[norm] = item_name
        except:
            pass

print(f"Loaded {len(price_list)} items from price list CSV")

# Print a sample for verification
print("Sample entries:")
for i, (norm, name) in enumerate(list(price_list.items())[:10]):
    print(f"   {norm} -> {name}")

# ============================================================
# Load existing rentals.json
# ============================================================

with open('src/data/rentals.json') as f:
    items = json.load(f)

items_by_id = {item['id']: item for item in items}

# Separate existing and new
new_items = [item for item in items if int(item['id'].split('-')[0]) >= 277]
existing_items = [item for item in items if int(item['id'].split('-')[0]) < 277]

# ============================================================
# Build a fuzzy matching function
# ============================================================

def normalize_for_match(name):
    """Normalize for fuzzy matching - aggressive."""
    n = name.lower().strip()
    n = re.sub(r'[\s\-\(\)\"\'\.,]+', ' ', n)
    n = re.sub(r'\s+', ' ', n).strip()
    return n

def fuzzy_match(new_name, candidate_names):
    """Find the best match using multiple strategies."""
    norm_new = normalize_for_match(new_name)
    
    best_ratio = 0
    best_item = None
    
    for name in candidate_names:
        norm_ex = normalize_for_match(name)
        
        # Strategy 1: exact normalized match
        if norm_new == norm_ex:
            return name, 1.0
        
        # Strategy 2: one contains the other
        if norm_new in norm_ex or norm_ex in norm_new:
            return name, 0.9
        
        # Strategy 3: word overlap
        new_words = set(norm_new.split())
        ex_words = set(norm_ex.split())
        if new_words and ex_words:
            overlap = len(new_words & ex_words)
            total = len(new_words | ex_words)
            if total > 0 and overlap / total > 0.7:
                return name, 0.8
        
        # Strategy 4: character-level similarity
        ratio = difflib.SequenceMatcher(None, norm_new, norm_ex).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_item = name
    
    return best_item, best_ratio

# ============================================================
# Build a direct CSV-based lookup for new items
# ============================================================

# The CSV has abbreviated names like "Albrake", "Ch Hoist", "Mag Drill"
# These are the exact names used in the new items.
# Let's create a mapping from CSV names to prices.

csv_to_price = {}
for norm_key, csv_name in price_list.items():
    csv_to_price[csv_name] = norm_key

# For each new item, try to match against CSV entries first
print()
print("=" * 80)
print("MATCHING NEW ITEMS TO PRICE LIST CSV")
print("=" * 80)

# Build a fuzzy match against CSV entries
def fuzzy_match_csv(new_name, csv_names):
    """Match new item name against CSV names."""
    norm_new = normalize_for_match(new_name)
    
    best_ratio = 0
    best_name = None
    
    for csv_name in csv_names:
        norm_csv = normalize_for_match(csv_name)
        
        if norm_new == norm_csv:
            return csv_name, 1.0
        
        if norm_new in norm_csv or norm_csv in norm_new:
            return csv_name, 0.9
        
        new_words = set(norm_new.split())
        csv_words = set(norm_csv.split())
        if new_words and csv_words:
            overlap = len(new_words & csv_words)
            total = len(new_words | csv_words)
            if total > 0 and overlap / total > 0.7:
                return csv_name, 0.8
        
        ratio = difflib.SequenceMatcher(None, norm_new, norm_csv).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_name = csv_name
    
    return best_name, best_ratio

csv_names = list(price_list.values())
matches_found = 0
matches_failed = 0
match_details = []

for new_item in new_items:
    new_id = new_item['id']
    new_name = new_item['name']
    
    # Strategy 1: Try exact match against CSV
    norm_new = normalize_for_match(new_name)
    for norm_key, csv_name in price_list.items():
        norm_csv = normalize_for_match(csv_name)
        if norm_new == norm_csv:
            daily = float(re.sub(r'[^0-9.]', '', str(price_list[norm_key])))
            # Hmm, we need to get the price differently
            break
    
    # Strategy 2: Fuzzy match against CSV
    csv_match, csv_ratio = fuzzy_match_csv(new_name, csv_names)
    
    if csv_match and csv_ratio > 0.5:
        # Get the price from CSV
        norm_key = normalize_for_match(csv_match)
        # Find the actual price
        for row in open('public/data/FirstStop_PriceList.csv'):
            parts = row.strip().split(',')
            if len(parts) >= 2 and parts[0].strip() == csv_match:
                daily = float(parts[1].replace('$', ''))
                new_item['dayPrice'] = str(daily)
                new_item['weekPrice'] = str(round(daily * 4, 2))
                new_item['monthPrice'] = str(round(daily * 12, 2))
                match_details.append((new_id, new_name, csv_match, daily, 'CSV'))
                matches_found += 1
                break
        else:
            match_details.append((new_id, new_name, 'NO MATCH', 0, f'FAIL (ratio={csv_ratio:.0%})'))
            matches_failed += 1
    else:
        match_details.append((new_id, new_name, 'NO MATCH', 0, f'FAIL (ratio={csv_ratio:.0%})'))
        matches_failed += 1

# ============================================================
# Print detailed results
# ============================================================

print()
print("MATCH RESULTS:")
for new_id, new_name, match_name, price, method in match_details:
    status = "OK" if method not in ('FAIL', 'NO MATCH') else "FAIL"
    print(f"   [{status:4s}] {new_id:40s} | {new_name:30s} -> {match_name:30s} | {method}")

print()
print(f"Matches found: {matches_found}")
print(f"Matches failed: {matches_failed}")

# ============================================================
# Write updated rentals.json
# ============================================================

with open('src/data/rentals.json', 'w') as f:
    json.dump(items, f, indent=2)

print(f"\nWrote updated src/data/rentals.json ({len(items)} items)")

# ============================================================
# Verify: check remaining $25/$100/$300 items
# ============================================================

remaining = [item for item in items 
             if int(item['id'].split('-')[0]) >= 277
             and float(item['dayPrice']) == 25.0 
             and float(item['weekPrice']) == 100.0 
             and float(item['monthPrice']) == 300.0]

print(f"\nRemaining new items with $25/$100/$300: {len(remaining)}")
if remaining:
    print("Still problematic:")
    for item in remaining:
        print(f"   {item['id']:40s} | {item['name']}")

# ============================================================
# Also fix the CSV items with placeholder prices
# ============================================================

print()
print("=" * 80)
print("FIXING CSV PLACEHOLDER PRICES")
print("=" * 80)

with open('public/data/rentals_clean.csv', 'r') as f:
    reader = csv.DictReader(f)
    csv_rows = list(reader)

placeholder_count = 0
for i, row in enumerate(csv_rows):
    try:
        day = float(row['Day ($)'])
        week = float(row['Week ($)'])
        month = float(row['Month ($)'])
        if day == 25.0 and week == 100.0 and month == 300.0:
            csv_match, csv_ratio = fuzzy_match_csv(row['Name'], csv_names)
            if csv_match:
                for r in open('public/data/FirstStop_PriceList.csv'):
                    parts = r.strip().split(',')
                    if len(parts) >= 2 and parts[0].strip() == csv_match:
                        daily = float(parts[1].replace('$', ''))
                        row['Day ($)'] = str(daily)
                        row['Week ($)'] = str(round(daily * 4, 2))
                        row['Month ($)'] = str(round(daily * 12, 2))
                        print(f"  FIXED: {row['Name'][:50]:50s} | $25/$100/$300 -> ${daily}/${round(daily*4,2)}/${round(daily*12,2)}")
                        placeholder_count += 1
                        break
            else:
                print(f"  NO FIX:   {row['Name'][:50]:50s} | No CSV match")
                placeholder_count += 1
    except:
        pass

print(f"\nFixed {placeholder_count} CSV items")

with open('public/data/rentals_clean.csv', 'w', newline='') as f:
    fieldnames = ['Category', 'Name', 'Image URL', 'Day ($)', 'Week ($)', 'Month ($)', 'Notes']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in csv_rows:
        writer.writerow(row)

print("Wrote updated public/data/rentals_clean.csv")
