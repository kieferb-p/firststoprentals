import { type EquipmentItem } from '../types/equipment';

export function EquipmentCard({ item, onClick }: { item: EquipmentItem; onClick?: () => void }) {
  const dayVal = item.dayPrice !== '' ? `$${item.dayPrice}` : '—';

  return (
    <button
      onClick={onClick}
      className="group bg-[var(--section-medium)] rounded-[10px] overflow-hidden border border-[var(--border)] hover:border-[var(--text-h)] transition duration-200 text-left w-full cursor-pointer"
    >
      <div className="relative h-40 w-full sm:h-32 bg-[var(--section-dark)] overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="group-hover:scale-105 transition duration-300"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
      </div>
      <div className="p-2.5 sm:p-3">
        <div className="text-[var(--text-h)] font-semibold text-xs sm:text-sm leading-tight mb-1.5 line-clamp-2">{item.name}</div>
        <div className="flex items-baseline justify-between">
          <span className="text-[var(--text)] text-xs">Day</span>
          <span className="text-[var(--text-h)] font-bold text-sm">{dayVal}</span>
        </div>
      </div>
    </button>
  );
}
