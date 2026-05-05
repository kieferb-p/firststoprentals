import { useState, useEffect, useMemo } from 'react';
import type { EquipmentItem } from '../types/equipment';
import equipmentData from '../data/rentals.json';

const SHOP_FRONT_FILENAME = '106098159_1620016738173554_713309936695896525_o.jpg';

function isPlaceholderImage(url: string) {
  return !url || url.includes(SHOP_FRONT_FILENAME);
}

type Duration = 'day' | 'week' | 'month';

function priceFor(item: { dayPrice: string; weekPrice: string; monthPrice: string }, duration: Duration): number {
  const val = duration === 'day' ? item.dayPrice : duration === 'week' ? item.weekPrice : item.monthPrice;
  return parseFloat(val) || 0;
}

function fmt(price: string) {
  return price !== '' ? `$${parseFloat(price).toFixed(2).replace(/\.00$/, '')}` : '—';
}

function fmtNum(n: number) {
  return n > 0 ? `$${n.toFixed(2)}` : '—';
}

export function EquipmentDetailPage() {
  const [imgFailed, setImgFailed] = useState(false);
  const [duration, setDuration] = useState<Duration>('day');
  const [selectedAddons, setSelectedAddons] = useState<Set<string>>(new Set());

  const item = useMemo<EquipmentItem | null>(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    return (equipmentData as EquipmentItem[]).find((i) => i.id === id) ?? null;
  }, []);

  useEffect(() => {
    if (item) document.title = `${item.name} — First Stop Rentals`;
  }, [item]);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!item) {
    return (
      <div className="text-center py-32">
        <p className="text-[var(--text)] text-xl mb-6">Item not found.</p>
        <a href="/equipment" className="text-[var(--accent)] underline text-lg">Back to equipment list</a>
      </div>
    );
  }

  const showPlaceholder = isPlaceholderImage(item.imageUrl) || imgFailed;
  const basePrice = priceFor(item, duration);
  const selectedAttachments = (item.attachments ?? []).filter((a) => selectedAddons.has(a.id));
  const addonsTotal = selectedAttachments.reduce((sum, a) => sum + priceFor(a, duration), 0);
  const total = basePrice + addonsTotal;

  return (
    <>
      {/* Banner */}
      <div className="text-center py-10 bg-[var(--section-dark)] border-b-4 border-[var(--accent)] mb-10">
        <p className="text-[var(--accent)] uppercase tracking-[3px] text-sm font-bold mb-3">First Stop Rentals</p>
        <h1 className="text-4xl md:text-5xl font-medium text-[var(--text-h)] uppercase tracking-tight">{item.name}</h1>
        <p className="text-[var(--text)] mt-4 text-xl">{item.category}</p>
      </div>

      <div className="mx-auto max-w-6xl pt-10 sm:pt-14 px-4">
        {/* Back link */}
        <a
          href="/equipment"
          className="inline-flex items-center gap-2 text-[var(--text)] hover:text-[var(--text-h)] transition mb-10 text-lg font-semibold"
        >
          ← Back to Equipment List
        </a>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Image */}
          <div className="bg-[var(--section-dark)] rounded-[10px] overflow-hidden flex items-center justify-center aspect-square max-h-[480px]">
            {showPlaceholder ? (
              <img src="/no_image.svg" alt="" className="w-full h-full object-contain p-10" />
            ) : (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
              />
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-7">
            {item.notes && (
              <p className="text-[var(--text)] text-lg leading-relaxed">{item.notes}</p>
            )}

            {/* Duration picker */}
            <div>
              <div className="text-sm uppercase tracking-widest text-[var(--text)] mb-3">Rental Period</div>
              <div className="flex gap-2">
                {(['day', 'week', 'month'] as Duration[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`flex-1 py-3 rounded-[8px] text-base font-semibold transition border ${
                      duration === d
                        ? 'bg-[var(--accent)] border-[var(--accent)] text-white'
                        : 'bg-[var(--section-dark)] border-[var(--border)] text-[var(--text)] hover:border-[var(--text-h)]'
                    }`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-3">
              {([
                { label: 'Day', val: fmt(item.dayPrice) },
                { label: 'Week', val: fmt(item.weekPrice) },
                { label: 'Month', val: fmt(item.monthPrice) },
              ] as const).map(({ label, val }) => (
                <div key={label} className="bg-[var(--section-dark)] rounded-[8px] p-4 text-center">
                  <div className="text-[var(--text)] text-sm uppercase tracking-wide mb-2">{label}</div>
                  <div className="text-[var(--text-h)] font-bold text-xl">{val}</div>
                </div>
              ))}
            </div>

            {/* Add-ons */}
            {item.attachments && item.attachments.length > 0 && (
              <div>
                <div className="text-sm uppercase tracking-widest text-[var(--text)] mb-3">Attachments & Add-ons</div>
                <div className="flex flex-col gap-2">
                  {item.attachments.map((att) => (
                    <label
                      key={att.id}
                      className={`flex items-center justify-between gap-4 px-4 py-4 rounded-[8px] cursor-pointer transition border ${
                        selectedAddons.has(att.id)
                          ? 'bg-[var(--accent-bg)] border-[var(--accent)]'
                          : 'bg-[var(--section-dark)] border-[var(--border)] hover:border-[var(--text-h)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedAddons.has(att.id)}
                          onChange={() => toggleAddon(att.id)}
                          className="accent-[var(--accent)] w-5 h-5"
                        />
                        <span className="text-[var(--text-h)] text-base font-medium">{att.name}</span>
                      </div>
                      <span className="text-[var(--text-h)] font-semibold text-base shrink-0">
                        {fmt(duration === 'day' ? att.dayPrice : duration === 'week' ? att.weekPrice : att.monthPrice)}/
                        {duration === 'day' ? 'day' : duration === 'week' ? 'wk' : 'mo'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Running estimate */}
            {basePrice > 0 && (
              <div className="bg-[var(--section-dark)] rounded-[10px] p-5 border border-[var(--border)]">
                <div className="text-sm uppercase tracking-widest text-[var(--text)] mb-4">Estimate</div>
                <div className="flex flex-col gap-3 text-base">
                  <div className="flex justify-between">
                    <span className="text-[var(--text)] truncate mr-4">{item.name}</span>
                    <span className="text-[var(--text-h)] font-semibold shrink-0">{fmtNum(basePrice)}</span>
                  </div>
                  {selectedAttachments.map((a) => (
                    <div key={a.id} className="flex justify-between">
                      <span className="text-[var(--text)] truncate mr-4">{a.name}</span>
                      <span className="text-[var(--text-h)] font-semibold shrink-0">{fmtNum(priceFor(a, duration))}</span>
                    </div>
                  ))}
                  <div className="border-t border-[var(--border)] pt-3 mt-1 flex justify-between font-bold text-lg">
                    <span className="text-[var(--text-h)]">Total / {duration}</span>
                    <span className="text-[var(--text-h)]">{fmtNum(total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-4 mt-10 border-t border-[var(--border)] pt-6">
        <p className="text-xs text-[var(--text)] opacity-50">
          All images are the property of their respective owners. First Stop Tool &amp; Equipment Rentals Ltd. makes no claim of copyright ownership over any product images displayed on this site.
        </p>
      </div>
    </>
  );
}
