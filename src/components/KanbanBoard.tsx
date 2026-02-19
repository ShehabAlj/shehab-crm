"use client";

import { useState, useEffect } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import confetti from "canvas-confetti";
import { Lead } from "@/lib/googleSheets";
import { LeadCard } from "./LeadCard";

type Status = 'New' | 'In Talk' | 'Working' | 'Testing' | 'Done';

const COLUMNS: { id: string; title: string, statuses: Status[] }[] = [
  { id: 'pipeline', title: 'Lead Pipeline', statuses: ['New', 'In Talk'] },
  { id: 'sprints', title: 'Active Sprints', statuses: ['Working'] },
  { id: 'qa', title: 'Quality Assurance', statuses: ['Testing'] },
  { id: 'delivered', title: 'Delivered', statuses: ['Done'] },
];

function SortableItem({ lead, isSyncing }: { lead: Lead; isSyncing?: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id, data: { ...lead } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="mb-4 touch-none">
       <LeadCard {...lead} isSyncing={isSyncing} />
    </div>
  );
}

function KanbanColumn({ 
    column, 
    items, 
    activeId, 
    syncingIds 
}: { 
    column: typeof COLUMNS[0], 
    items: Lead[], 
    activeId: string | null,
    syncingIds: Set<string>
}) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    const totalValue = items.reduce((sum, lead) => sum + (lead.value || 0), 0);

    return (
        <div ref={setNodeRef} className="flex flex-col gap-4 h-full">
             <div className={`glass-panel rounded-xl p-4 flex flex-col gap-1 border-t border-zinc-200 dark:border-white/10 relative overflow-hidden group transition-all duration-300 ${isOver ? 'ring-2 ring-blue-500 ring-opacity-50 border-blue-500/50 bg-blue-500/5' : ''}`}>
                  <div className={`absolute inset-0 bg-gradient-to-b from-black/5 dark:from-white/5 to-transparent opacity-0 transition-opacity duration-500 ${activeId ? 'group-hover:opacity-10' : ''}`}></div>
                  
                  <div className="flex items-center justify-between relative z-10">
                    <h3 className="text-sm font-semibold text-zinc-700 dark:text-[#E5E5E5] uppercase tracking-wider">{column.title}</h3>
                    <span className="text-[10px] font-mono text-zinc-500 bg-black/5 dark:bg-black/20 px-2 py-1 rounded-full">{items.length}</span>
                  </div>
                  <div className="relative z-10">
                     <span className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight drop-shadow-sm dark:drop-shadow-lg filter">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-normal mr-1 align-top">OMR</span>
                        {totalValue.toLocaleString()}
                     </span>
                  </div>
              </div>

              <div className={`flex flex-col gap-2 min-h-[150px] flex-1 rounded-xl p-2 transition-all ${isOver ? 'bg-zinc-100/50 dark:bg-white/5' : ''}`}>
                <SortableContext 
                    id={column.id} 
                    items={items.map(l => l.id)} 
                    strategy={verticalListSortingStrategy}
                >
                    {items.map((lead) => (
                        <SortableItem key={lead.id} lead={lead} isSyncing={syncingIds.has(lead.id)} />
                    ))}
                </SortableContext>
                {items.length === 0 && (
                      <div className="h-32 flex items-center justify-center text-zinc-400 dark:text-zinc-600 text-xs uppercase tracking-widest opacity-50 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                          Drop Here
                      </div>
                  )}
              </div>
        </div>
    );
}

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [items, setItems] = useState<Lead[]>(initialLeads);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [syncingIds, setSyncingIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with external data updates (e.g. from polling or other users)
  // BUT ignore if we are currently dragging or syncing to prevent overwrite
  useEffect(() => {
    if (activeId === null && syncingIds.size === 0) {
        setItems(initialLeads);
    }
  }, [initialLeads, activeId, syncingIds.size]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5, 
        },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const normalizeId = (id: string) => id.trim().toLowerCase();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeLead = items.find(l => l.id === active.id);
    
    setActiveId(null);

    // Logging for debugging
    console.log("Drag End Details:", { 
        activeId: active.id, 
        overId: over?.id, 
        activeLeadStatus: activeLead?.status,
        isOverColumn: over ? COLUMNS.some(c => c.id === over.id) : false
    });

    // If dropped outside or same place
    if (!over || !activeLead) return;

    const overId = over.id as string;
    
    // Determine target column
    // Priority 1: Direct Column Drop (thanks to useDroppable on KanbanColumn)
    let targetColumnId = COLUMNS.find(c => c.id === overId)?.id;

    // Priority 2: Dropped on another Item (fallback)
    if (!targetColumnId) {
        const overItem = items.find(l => l.id === overId);
        if (overItem) {
            const col = COLUMNS.find(c => c.statuses.includes(overItem.status));
            if (col) targetColumnId = col.id;
        }
    }

    // Resolve Target Column Object
    const targetColumn = COLUMNS.find(c => normalizeId(c.id) === normalizeId(targetColumnId || ''));
    
    if (targetColumn) {
        const newStatus = targetColumn.statuses[0];
        console.log("Valid Drop Target:", { targetColumnId: targetColumn.id, newStatus });

        // --- DIFFERENT COLUMN ---
        if (!targetColumn.statuses.includes(activeLead.status)) {
            const originalItems = [...items]; // Backup for revert

            // 1. Optimistic Update (Status Change)
            setItems(prev => {
                 return prev.map(item => 
                    item.id === activeLead.id ? { ...item, status: newStatus } : item
                );
            });

            // 2. Set Syncing State
            setSyncingIds(prev => new Set(prev).add(activeLead.id));

            if (newStatus === 'Done') {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#007AFF', '#5E5CE6', '#ffffff']
                });
            }

            // 3. Perform Sync
            try {
                // Prioritize Supabase Update via API
                const res = await fetch('/api/leads', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: activeLead.id, status: newStatus }),
                });

                if (!res.ok) throw new Error("Sync failed");
                console.log("Supabase update successful");

            } catch (error) {
                console.error("Failed to update status", error);
                // 4. Revert on Failure
                setItems(originalItems);
            } finally {
                // 5. Clear Syncing State
                setSyncingIds(prev => {
                    const next = new Set(prev);
                    next.delete(activeLead.id);
                    return next;
                });
            }
        } 
    } else {
        console.warn("Touchdown failed - No valid target column for ID:", overId);
    }
  };

  if (!mounted) return null;

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 h-full items-start">
        {COLUMNS.map((column) => {
          const columnLeads = items.filter(l => column.statuses.includes(l.status));
          return (
             <KanbanColumn 
                key={column.id} 
                column={column} 
                items={columnLeads} 
                activeId={activeId}
                syncingIds={syncingIds}
             />
          );
        })}
      </div>

      <DragOverlay>
        {activeId ? (
           <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
             <LeadCard {...items.find(l => l.id === activeId)!} />
           </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
