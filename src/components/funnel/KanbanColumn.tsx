import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useDroppable } from "@dnd-kit/core"
import { KanbanCard } from "./KanbanCard"
import { cn } from "@/lib/utils"

interface Column {
    id: string
    title: string
    tasks: any[]
}

interface KanbanColumnProps {
    column: Column
}

export function KanbanColumn({ column }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: column.id,
        data: { type: "Column", column },
    })

    return (
        <div className="flex flex-col gap-4 min-w-[300px] bg-muted/50 p-4 rounded-xl h-full max-h-[calc(100vh-12rem)]">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    {column.title}
                </h3>
                <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-full">
                    {column.tasks.length}
                </span>
            </div>

            <div ref={setNodeRef} className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                    {column.tasks.map((task) => (
                        <KanbanCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}
