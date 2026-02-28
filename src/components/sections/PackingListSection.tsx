import { useState, useMemo } from 'react';
import type { PackingItem } from '../../types';
import { PackageIcon, CheckIcon } from '../ui/Icon';

interface PackingListSectionProps {
  items: PackingItem[];
}

export function PackingListSection({ items }: PackingListSectionProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() =>
    new Set(items.filter((i) => i.checked).map((i) => i.id))
  );

  const groupedItems = useMemo(() => {
    const groups: Record<string, PackingItem[]> = {};
    items.forEach((item) => {
      (groups[item.category] ??= []).push(item);
    });
    return groups;
  }, [items]);

  const categories = Object.keys(groupedItems).sort();
  const total = items.length;
  const checked = checkedItems.size;
  const progress = total > 0 ? (checked / total) * 100 : 0;

  const toggleItem = (id: string) =>
    setCheckedItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  return (
    <div className="bg-bg-card rounded-xl card-shadow p-5 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PackageIcon className="w-4 h-4 text-accent-rust" />
          <h3 className="font-serif font-semibold text-text-primary"
            style={{ fontFamily: 'var(--font-family-serif)' }}>
            Packing List
          </h3>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          progress === 100
            ? 'bg-accent-sage/15 text-accent-forest'
            : 'bg-bg-secondary text-text-secondary'
        }`}>
          {checked}/{total} packed
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-bg-secondary rounded-full overflow-hidden mb-5">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%`, background: '#c17f59' }}
        />
      </div>

      {/* Categories */}
      <div className="space-y-5">
        {categories.map((category) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">
              {category}
            </p>
            <div className="space-y-1.5">
              {groupedItems[category].map((item) => (
                <PackingItemRow
                  key={item.id}
                  item={item}
                  checked={checkedItems.has(item.id)}
                  onToggle={() => toggleItem(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackingItemRow({ item, checked, onToggle }: {
  item: PackingItem; checked: boolean; onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors select-none
        ${checked ? 'bg-accent-sage/8' : 'hover:bg-bg-secondary/60'}`}
    >
      {/* Custom checkbox */}
      <span className={`flex-shrink-0 w-4 h-4 rounded border transition-colors flex items-center justify-center
        ${checked ? 'bg-accent-rust border-accent-rust' : 'border-border bg-bg-card'}`}>
        {checked && <CheckIcon className="w-3 h-3 text-white" />}
      </span>

      <span className={`flex-1 text-sm transition-all ${checked ? 'text-text-muted line-through' : 'text-text-primary'}`}>
        {item.name}
        {item.quantity && item.quantity > 1 && (
          <span className="text-text-muted ml-1">×{item.quantity}</span>
        )}
      </span>

      {item.essential && !checked && (
        <span className="text-xs px-1.5 py-0.5 rounded bg-accent-terracotta/15 text-accent-rust font-medium flex-shrink-0">
          Essential
        </span>
      )}
    </div>
  );
}
