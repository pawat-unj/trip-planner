import { useState, useMemo } from 'react';
import type { PackingItem } from '../../types';
import { Card, CardHeader, CardTitle, Badge } from '../ui';

interface PackingListSectionProps {
  items: PackingItem[];
}

export function PackingListSection({ items }: PackingListSectionProps) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(() => {
    // Initialize from items that are already checked
    return new Set(items.filter((item) => item.checked).map((item) => item.id));
  });

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, PackingItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  const categories = Object.keys(groupedItems).sort();

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Calculate progress
  const totalItems = items.length;
  const checkedCount = checkedItems.size;
  const progress = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            <span className="flex items-center gap-2">
              <span>🎒</span>
              Packing List
            </span>
          </CardTitle>
          <Badge variant={progress === 100 ? 'sage' : 'default'}>
            {checkedCount}/{totalItems} packed
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 bg-bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-sage transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-3">
              {category}
            </h4>
            <div className="space-y-2">
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
    </Card>
  );
}

interface PackingItemRowProps {
  item: PackingItem;
  checked: boolean;
  onToggle: () => void;
}

function PackingItemRow({ item, checked, onToggle }: PackingItemRowProps) {
  return (
    <label
      className={`
        flex items-center gap-3 p-3 rounded-lg cursor-pointer
        transition-colors duration-200
        ${checked ? 'bg-accent-sage/10' : 'bg-bg-secondary hover:bg-bg-secondary/70'}
      `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="
          w-5 h-5 rounded border-2 border-border
          text-accent-sage focus:ring-accent-sage focus:ring-offset-0
          cursor-pointer
        "
      />
      <span
        className={`
          flex-1 transition-all duration-200
          ${checked ? 'text-text-muted line-through' : 'text-text-primary'}
        `}
      >
        {item.name}
        {item.quantity && item.quantity > 1 && (
          <span className="text-text-secondary ml-1">×{item.quantity}</span>
        )}
      </span>
      {item.essential && !checked && (
        <Badge variant="terracotta" size="sm">Essential</Badge>
      )}
    </label>
  );
}
