import Fuse from 'fuse.js';
import { useState, useEffect, useMemo } from 'react';
import type { EquipmentItem } from '../types/equipment';

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
    'Automotive': 'Lifting, drilling, and automotive tools.',
    'Carpenter Tools': 'Saws, levels, fasteners, and finishing tools.',
    'Compaction': 'Plate compactors and tampers for all fill depths.',
    'Compressors': 'Air compressors, sandblasters, and chipper systems.',
    'Concrete Equipment': 'Saws, mixers, vibrators, and finishing tools.',
    'Fastening': 'Nailers, staplers, and screw guns.',
    'Flooring': 'Sanders, edgers, tile tools, and cleaning equipment.',
    'Generators/Welders': 'Portable power generation from 2kW to 9kW.',
    'Heaters': 'Electric, propane, and diesel heaters for every job.',
    'Lawn & Garden': 'Aerators, tillers, brush cutters, and mowers.',
    'Loaders': 'Skid steers, mini excavators, attachments, and buckets.',
    'Material Handling': 'Lifts, jacks, boom lifts, and dollies.',
    'Paint Equipment': 'Ladders, sprayers, scaffolding, and steamer.',
    'Plumbing': 'Pipe cutters, threaders, thawers, and snakes.',
    'Pressure Washers': 'Electric and gas washers from 1500 to 3600 PSI.',
    'Saws': 'Chain, chop, mitre, reciprocating, and concrete saws.',
    'Scaffolding': 'Sections, ends, braces, planks, and accessories.',
    'Water Pumps': 'Diaphragm, trash, and submersible pumps.',
};

interface Props {
  equipmentData: EquipmentItem[];
}

export function EquipmentSearch({ equipmentData }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

   // Hide static SSR content immediately on mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const staticGrid = document.getElementById('static-equipment-grid');
    const staticCategories = document.getElementById('static-category-grid');
    if (staticGrid) staticGrid.style.display = 'none';
    if (staticCategories) staticCategories.style.display = 'none';
    }, []);

  const categories = useMemo(() => {
    const catMap = new Map<string, EquipmentItem[]>();
    equipmentData.forEach((item) => {
      if (!catMap.has(item.category)) catMap.set(item.category, []);
      catMap.get(item.category)!.push(item);
     });
    return [...catMap.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    }, [equipmentData]);

  const fuse = useMemo(() => {
    return new Fuse(equipmentData, {
      keys: ['name', 'category', 'notes'],
      threshold: 0.4,
      includeScore: true,
      ignoreLocation: true,
      useExtendedSearch: true,
     });
    }, [equipmentData]);

  const filteredItems = useMemo(() => {
    let results = searchTerm.trim()
       ? fuse.search(searchTerm).map((r) => r.item)
       : equipmentData;
    if (selectedCategory) results = results.filter((item) => item.category === selectedCategory);
    return results;
    }, [equipmentData, selectedCategory, searchTerm, fuse]);

  const showCategories = !selectedCategory && !searchTerm;
  const isFilterActive = !!(searchTerm || selectedCategory);
  const totalItems = equipmentData.length;

  if (!mounted) return null;

  return (
     <div>
       {/* Search bar */}
       <div className="relative mb-8 overflow-hidden rounded-[10px] border-2 border-[var(--accent)]">
         <div className="bg-[var(--section-dark)] p-6 md:p-8">
           <h3 className="text-[var(--accent)] uppercase tracking-[3px] text-sm sm:text-base font-bold mb-4 text-center">
             Find Your Equipment
           </h3>
           <div className="flex flex-col sm:flex-col gap-4">
             <div className="flex-1">
               <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedCategory('');
                 }}
                className="w-full px-5 py-4 bg-[var(--section-medium)] border border-[var(--border)] rounded-[10px] text-[var(--text)] placeholder-gray-500 text-base  focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-bg)] focus:outline-none transition"
                placeholder={`Search ${totalItems}+ items...`}
               />
             </div>
             <div className="sm:w-full sm:my-4">
               <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSearchTerm('');
                 }}
                className="w-full px-5 py-6 bg-[var(--section-medium)] border border-[var(--border)] rounded-[10px] text-[var(--text)] text-base sm:text-lg focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-bg)] focus:outline-none transition cursor-pointer"
               >
                 <option value="">All Categories</option>
                 {categories.map(([cat]) => (
                   <option key={cat} value={cat}>
                     {cat}
                   </option>
                 ))}
               </select>
             </div>
           </div>
         </div>

         {isFilterActive && (
           <div className="flex flex-wrap gap-3 mt-3 text-[var(--text)] items-center px-6 pb-6">
             <span>
               {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}
             </span>
             {selectedCategory && (
               <button
                onClick={() => setSelectedCategory('')}
                className="bg-[var(--section-medium)] text-[var(--text)] px-4 py-2 rounded-full hover:bg-white hover:text-[var(--bg)] transition"
                >
                 <>&#10005; {selectedCategory}</>
               </button>
             )}
             {searchTerm && (
               <button
                onClick={() => setSearchTerm('')}
                className="bg-[var(--section-medium)] text-[var(--text)] px-4 py-2 rounded-full hover:bg-white hover:text-[var(--bg)] transition"
                >
                 <>&#10005; Clear search</>
               </button>
             )}
           </div>
         )}
       </div>

       {/* Category grid — desktop only (hidden on mobile) */}
       {showCategories && (
         <div>
           <div className="grid-cols-1 lg:grid-cols-3 xxl:grid-cols-4 gap-5 hidden md:grid">
             {categories.map(([cat, items]) => (
               <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="border border-[var(--border)] rounded-[10px] overflow-hidden bg-[var(--section-medium)] hover:border-[var(--text-h)] transition duration-300 cursor-pointer text-left"
                >
                 <div className="p-5">
                   <h3 className="text-[var(--text-h)] text-lg font-bold uppercase tracking-wide mb-4">{cat}</h3>
                   <p className="text-[var(--text)]  mt-1 flex w-full">
                     {CATEGORY_DESCRIPTIONS[cat] || `${items.length} tools available`}
                   </p>
                   <div className="text-[var(--text)] text-sm  mt-3">
                     {items.length} item{items.length !== 1 ? 's' : ''}
                   </div>
                 </div>
               </button>
             ))}
           </div>
         </div>
       )}

       {/* Results grid — shown when search or category is active */}
       {isFilterActive && (
         <div className="mb-6">
           <h2 className="text-2xl sm:text-3xl text-[var(--text-h)] font-bold mb-6">
             {selectedCategory ? selectedCategory : 'Search Results'}
           </h2>
           {filteredItems.length > 0 ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
               {filteredItems.map((item) => (
                 <EquipmentCard key={item.id} item={item} />
               ))}
             </div>
           ) : (
             <div className="text-center py-20">
               <div className="text-xl sm:text-2xl text-[var(--text-h)] mb-2">No equipment found</div>
               <p className="text-[var(--text)] mb-4 text-base">Try adjusting your search terms.</p>
               <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                 }}
                className="bg-[var(--text-h)] text-[var(--bg)] px-6 py-3 rounded-full hover:bg-gray-200 transition text-base"
                >
                 Clear all filters
               </button>
             </div>
           )}
         </div>
       )}
     </div>
   );
 }

 const EquipmentCard = ({ item }: { item: EquipmentItem }) => {
   const dayVal = item.dayPrice !== '' ? `$${item.dayPrice}` : '\u2014';
   const weekVal = item.weekPrice !== '' ? `$${item.weekPrice}` : '\u2014';
   const monthVal = item.monthPrice !== '' ? `$${item.monthPrice}` : '\u2014';

   return (
      <div className="bg-[var(--section-medium)] rounded-[10px] overflow-hidden border border-[var(--border)]">
        <div className="relative h-48 sm:h-56 md:h-64 bg-[var(--section-dark)] overflow-hidden">
          <img
           src={item.imageUrl}
           alt={item.name}
           className="w-full h-full object-cover"
           onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute top-3 left-3 bg-[var(--section-dark)]/90 text-white text-xs sm:text-sm px-3 py-1.5 rounded-full">
            {item.category}
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <h3 className="text-[var(--text-h)] font-semibold mb-1 text-base sm:text-lg">{item.name}</h3>
          {item.notes && (
            <p className="text-sm sm:text-base text-[var(--text)] mb-3 line-clamp-2">{item.notes}</p>
          )}
          <div className="flex gap-2 pt-3 border-t border-[var(--border)] text-xs sm:text-sm">
            <div className="flex-1 text-center">
              <div className="text-[var(--text)] uppercase text-xs sm:text-sm">Day</div>
              <div className="text-[var(--text-h)] font-bold text-sm sm:text-base mt-0.5">{dayVal}</div>
            </div>
            <div className="flex-1 text-center border-l border-[var(--border)]">
              <div className="text-[var(--text)] uppercase text-xs sm:text-sm">Week</div>
              <div className="text-[var(--text-h)] font-bold text-sm sm:text-base mt-0.5">{weekVal}</div>
            </div>
            <div className="flex-1 text-center border-l border-[var(--border)]">
              <div className="text-[var(--text)] uppercase text-xs sm:text-sm">Month</div>
              <div className="text-[var(--text-h)] font-bold text-sm sm:text-base mt-0.5">{monthVal}</div>
            </div>
          </div>
        </div>
      </div>
   );
 };
