import { KanbanBoard } from "@/components/funnel/KanbanBoard"

export default function FunnelPage() {
    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Funil de Vendas</h1>
            <div className="flex-1 overflow-hidden">
                <KanbanBoard />
            </div>
        </div>
    )
}
