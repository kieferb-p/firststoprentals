#!/usr/bin/env python3
import csv
import re

def normalize(name):
    return re.sub(r'[\W_]+', ' ', name.lower()).strip()

def is_scaffolding(name):
    n = name.lower()
    return any(k in n for k in ['scaffold', 'scaff', 'banana clip', 'boom and', 
                                  'caster', 'leveler', 'rail system', 'plank ext',
                                  'outrigger'])

def parse_price(cell):
    return float(re.sub(r'[^0-9.]', '', cell))

# Read existing clean CSV
existing = []
with open('public/data/rentals_clean.csv') as f:
    reader = csv.DictReader(f)
    for row in reader:
        existing.append(dict(row))

print(f"Loaded {len(existing)} rows")

# Build a lookup of normalized names -> indices
lookup = {}
for i, row in enumerate(existing):
    lookup[normalize(row['Name'])] = i

# Read source CSV
new_rows = []
with open('public/data/Sheet1-Table 1.csv') as f:
    reader = csv.reader(f)
    next(reader)
    for row in reader:
        row = [c.strip() for c in row]
        for col_name, col_price in [(0, 1), (4, 5), (8, 9), (12, 13)]:
            name = row[col_name] if col_name < len(row) else ''
            price_cell = row[col_price] if col_price < len(row) else ''
            if name and price_cell:
                try:
                    price_val = float(re.sub(r'[^0-9.]', '', price_cell))
                    if price_val > 0:
                        norm = normalize(name)
                        if norm in lookup:
                             idx = lookup[norm]
                             existing_name = existing[idx]['Name']
                             is_scaf = is_scaffolding(existing_name)
                             if is_scaf:
                                day = round(price_val / 4, 2)
                                week = price_val
                                month = round(price_val * 4, 2)
                             else:
                                day = price_val
                                week = round(price_val * 4, 2)
                                month = round(price_val * 12, 2)
                             existing[idx]['Day ($)'] = f"{day:.2f}"
                             existing[idx]['Week ($)'] = f"{week:.2f}"
                             existing[idx]['Month ($)'] = f"{month:.2f}"
                        else:
                            new_rows.append((name, price_val))
                except ValueError:
                    pass

# Write updated CSV
fieldnames = ['Category', 'Name', 'Image URL', 'Day ($)', 'Week ($)', 'Month ($)', 'Notes']
with open('public/data/rentals_clean.csv', 'w', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    for row in existing:
        writer.writerow(row)
    for name, price in new_rows:
        is_scaf = is_scaffolding(name)
        if is_scaf:
            day = round(price / 4, 2)
            week = price
            month = round(price * 4, 2)
        else:
            day = price
            week = round(price * 4, 2)
            month = round(price * 12, 2)
        writer.writerow({
             'Category': 'New',
             'Name': name,
             'Image URL': '',
             'Day ($)': f"{day:.2f}",
             'Week ($)': f"{week:.2f}",
             'Month ($)': f"{month:.2f}",
             'Notes': '',
         })

print(f"Updated {len(existing)} rows, wrote CSV")
