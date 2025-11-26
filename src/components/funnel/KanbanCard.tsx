import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Task {
    id: string
    title: string
    clientName: string
    value: string
    tags: string[]
}

interface KanbanCardProps {
    task: Task
}

export function KanbanCard({ task }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id, data: { type: "Task", task } })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-muted rounded-xl border-2 border-primary/50 h-[150px]"
            />
        )
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-sm font-medium">{task.clientName}</CardTitle>
                        <span className="text-xs font-bold text-muted-foreground">{task.value}</span>
                    </div>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">{task.title}</p>
                    <div className="flex flex-wrap gap-1">
                        {task.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1 py-0">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
