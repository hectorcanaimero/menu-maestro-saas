import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { ProductExtra } from '@/types/extras';
import { cn } from '@/lib/utils';

interface SortableExtraCardProps {
  extra: ProductExtra;
  children: React.ReactNode;
}

function SortableExtraCard({ extra, children }: SortableExtraCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: extra.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group/sortable',
        isDragging && 'z-50 opacity-50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover/sortable:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  );
}

interface ProductExtrasSortableProps {
  extras: ProductExtra[];
  onReorder: (extras: { id: string; display_order: number }[]) => void;
  renderExtra: (extra: ProductExtra) => React.ReactNode;
}

/**
 * ProductExtrasSortable Component
 *
 * Provides drag & drop functionality for reordering product extras within a group
 * Uses @dnd-kit for accessible and smooth drag interactions
 */
export function ProductExtrasSortable({
  extras,
  onReorder,
  renderExtra,
}: ProductExtrasSortableProps) {
  const [items, setItems] = useState(extras);

  // Update items when extras prop changes (sorted by display_order)
  useEffect(() => {
    setItems([...extras].sort((a, b) => a.display_order - b.display_order));
  }, [extras]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    // Calculate new display_order values
    const updates = newItems.map((item, index) => ({
      id: item.id,
      display_order: index * 10,
    }));

    onReorder(updates);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((extra) => (
            <SortableExtraCard key={extra.id} extra={extra}>
              {renderExtra(extra)}
            </SortableExtraCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
