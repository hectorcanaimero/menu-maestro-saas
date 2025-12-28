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
import type { ExtraGroup } from '@/types/extras';
import { cn } from '@/lib/utils';

interface SortableGroupCardProps {
  group: ExtraGroup;
  children: React.ReactNode;
}

function SortableGroupCard({ group, children }: SortableGroupCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

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
        className="absolute -left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover/sortable:opacity-100 transition-opacity z-10"
      >
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

interface ExtraGroupsSortableProps {
  groups: ExtraGroup[];
  onReorder: (groups: { id: string; display_order: number }[]) => void;
  renderGroup: (group: ExtraGroup) => React.ReactNode;
}

/**
 * ExtraGroupsSortable Component
 *
 * Provides drag & drop functionality for reordering extra groups
 * Uses @dnd-kit for accessible and smooth drag interactions
 */
export function ExtraGroupsSortable({
  groups,
  onReorder,
  renderGroup,
}: ExtraGroupsSortableProps) {
  const [items, setItems] = useState(groups);

  // Update items when groups prop changes (sorted by display_order)
  useEffect(() => {
    setItems([...groups].sort((a, b) => a.display_order - b.display_order));
  }, [groups]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
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
      display_order: index * 10, // Space them out by 10
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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((group) => (
            <SortableGroupCard key={group.id} group={group}>
              {renderGroup(group)}
            </SortableGroupCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
