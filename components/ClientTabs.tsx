'use client'

import { DndContext, closestCenter, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ClientWithAll } from '@/lib/types'

function SortableTab({ client, isActive, onClick }: {
  client: ClientWithAll; isActive: boolean; onClick: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: client.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`tab${isActive ? ' active' : ''}`}
      onClick={onClick}
      title="Arrastrá para reordenar"
    >
      {client.emoji} {client.name}
    </button>
  )
}

interface Props {
  clients: ClientWithAll[]
  activeId: string | null
  onTabClick: (id: string) => void
  onReorder: (newOrder: string[]) => void
  onAddClient: () => void
}

export default function ClientTabs({ clients, activeId, onTabClick, onReorder, onAddClient }: Props) {
  // activationConstraint prevents drag from firing on a simple click
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = clients.findIndex(c => c.id === active.id)
      const newIndex = clients.findIndex(c => c.id === over.id)
      const newOrder = arrayMove(clients, oldIndex, newIndex).map(c => c.id)
      onReorder(newOrder)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={clients.map(c => c.id)} strategy={horizontalListSortingStrategy}>
        <div className="tabs">
          {clients.map(c => (
            <SortableTab
              key={c.id}
              client={c}
              isActive={c.id === activeId}
              onClick={() => onTabClick(c.id)}
            />
          ))}
          <button className="new-client-btn" onClick={onAddClient}>+ Nuevo cliente</button>
        </div>
      </SortableContext>
    </DndContext>
  )
}
