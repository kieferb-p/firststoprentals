import { type EquipmentItem } from '../types/equipment';

export function EquipmentCard({ item }: { item: EquipmentItem }) {
  const dayVal = item.dayPrice !== '' ? `$${item.dayPrice}` : '\u2014';
  const weekVal = item.weekPrice !== '' ? `$${item.weekPrice}` : '\u2014';
  const monthVal = item.monthPrice !== '' ? `$${item.monthPrice}` : '\u2014';

  return (
         <div className="bg-[var(--section-medium)] rounded-[10px] overflow-hidden border border-[var(--border)]">
            <div className="relative h-48 sm:h-56 md:h-64 bg-[var(--section-dark)] overflow-hidden">
               {item.imageUrl ? (
                   <img
                     src={item.imageUrl}
                     alt={item.name}
                     className="w-full h-full object-cover"
                     onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                      }}
                  />
               ) : null}
               <div className="absolute top-3 left-3 bg-[var(--section-dark)]/90 text-white text-xs sm:text-sm px-3 py-1.5 rounded-full">
                   {item.category}
               </div>
           </div>
           <div className="p-4 sm:p-5">
              <h3 className="text-[var(--text-h)] font-semibold mb-1 text-base sm:text-lg">{item.name}</h3>
              {item.notes && <p className="text-sm sm:text-base text-[var(--text)] mb-3 line-clamp-2">{item.notes}</p>}
              <div className="flex gap-2 pt-3 border-t border-[var(--border)] text-xs sm:text-sm">
                  <div className="flex-1 text-center"><div className="text-[var(--text)] uppercase text-xs sm:text-sm">Day</div><div className="text-[var(--text-h)] font-bold text-sm sm:text-base mt-0.5">{dayVal}</div></div>
                  <div className="flex-1 text-center border-l border-[var(--border)]"><div className="text-[var(--text)] uppercase text-xs sm:text-sm">Week</div><div className="text-[var(--text-h)] font-bold text-sm sm:text-base mt-0.5">{weekVal}</div></div>
                  <div className="flex-1 text-center border-l border-[var(--border)]"><div className="text-[var(--text)] uppercase text-xs sm:text-sm">Month</div><div className="text-[var(--text-h)] font-bold text-sm sm:text-base mt-0.5">{monthVal}</div></div>
              </div>
          </div>
      </div>
  );
}
