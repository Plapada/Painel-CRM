"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import {
    Kanban,
    KanbanBoard as Board,
    KanbanColumn,
    KanbanColumnContent,
    KanbanColumnHandle,
    KanbanItem,
    KanbanItemHandle,
    KanbanOverlay,
    type KanbanMoveEvent,
} from "@/components/ui/kanban";
import { Badge } from "@/components/ui/badge-2";
import { Button } from "@/components/ui/button-1";
import { GripVertical, Plus, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Task {
    id: string;
    title: string;
    clientName: string;
    tags: string[];
    etapa_funil: string;
    [key: string]: any;
}

const initialColumns: Record<string, Task[]> = {
    new: [],
    contacted: [],
    scheduled: [],
    done: [],
};

const columnTitles: Record<string, string> = {
    new: "Novos Leads",
    contacted: "Em Contato",
    scheduled: "Agendado",
    done: "Concluído",
};

export function KanbanBoard() {
    const [columns, setColumns] = useState<Record<string, Task[]>>(initialColumns);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchKanbanData();

        const channel = supabase
            .channel("kanban-updates")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "dados_cliente" },
                () => {
                    fetchKanbanData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    async function fetchKanbanData() {
        const sessionStr = localStorage.getItem("crm_session");
        let clinicId = "457e67c0-55ca-456d-8762-cc94df166e6d"; // Fallback ID

        if (sessionStr) {
            const session = JSON.parse(sessionStr);
            if (session.clinic_id) clinicId = session.clinic_id;
        }

        const { data, error } = await supabase
            .from("dados_cliente")
            .select("*")
            .eq("clinic_id", clinicId);

        if (error) {
            console.error("Error fetching kanban data:", error);
            return;
        }

        const newCols: Record<string, Task[]> = {
            new: [],
            contacted: [],
            scheduled: [],
            done: [],
        };

        // Track processed IDs to prevent duplicates
        const processedIds = new Set<string>();
        const duplicateCounter: Record<string, number> = {};

        data.forEach((client: any) => {
            let clientId = client.id.toString();

            // If duplicate found, append counter to make unique
            if (processedIds.has(clientId)) {
                console.warn(`Duplicate client ID found: ${clientId}`);
                duplicateCounter[clientId] = (duplicateCounter[clientId] || 1) + 1;
                clientId = `${clientId}_dup${duplicateCounter[clientId]}`;
            }

            let statusId = "new";
            const dbStatus = (
                client.etapa_funil ||
                client.atendimento_ia ||
                ""
            ).toLowerCase();

            if (dbStatus.includes("contato") || dbStatus.includes("iniciado"))
                statusId = "contacted";
            else if (dbStatus.includes("agendado")) statusId = "scheduled";
            else if (dbStatus.includes("concluído") || dbStatus.includes("fechou"))
                statusId = "done";
            else statusId = "new";

            if (newCols[statusId]) {
                newCols[statusId].push({
                    id: clientId,
                    title: client.nomewpp || client.telefone || "Sem Nome",
                    clientName: client.telefone || "",
                    tags: client.atendimento_ia ? [client.atendimento_ia] : [],
                    etapa_funil: statusId,
                    ...client,
                });
                processedIds.add(clientId);
            }
        });

        setColumns(newCols);
        setLoading(false);
    }

    const handleMove = useCallback(
        async ({ activeContainer, overContainer, activeIndex, overIndex, event }: KanbanMoveEvent) => {
            const activeId = event.active.id as string;

            console.log("Kanban Move Event:", {
                activeId,
                activeContainer,
                overContainer,
                activeIndex,
                overIndex
            });

            // Optimistic update
            setColumns((prev) => {
                const activeItems = [...prev[activeContainer]];
                const overItems = [...prev[overContainer]];
                const [movedItem] = activeItems.splice(activeIndex, 1);

                // Update the item's internal status
                movedItem.etapa_funil = overContainer;

                overItems.splice(overIndex, 0, movedItem);

                return {
                    ...prev,
                    [activeContainer]: activeItems,
                    [overContainer]: overItems,
                };
            });

            // Update Supabase
            if (activeContainer !== overContainer) {
                try {
                    console.log(`Updating client ${activeId} to stage: ${overContainer}`);

                    const { data, error } = await supabase
                        .from("dados_cliente")
                        .update({ etapa_funil: overContainer })
                        .eq("id", activeId)
                        .select();

                    if (error) {
                        console.error("Error updating task status:", {
                            message: error.message,
                            details: error.details,
                            hint: error.hint,
                            code: error.code
                        });
                        alert("Erro ao atualizar o status do cliente. Recarregando...");
                        fetchKanbanData(); // Re-fetch to sync state
                    } else {
                        console.log("Successfully updated client status:", data);
                    }
                } catch (error) {
                    console.error("Exception updating task status:", error);
                    alert("Erro ao atualizar o status do cliente. Recarregando...");
                    fetchKanbanData();
                }
            }
        },
        []
    );

    if (loading) {
        return <div className="p-4">Carregando funil...</div>;
    }

    return (
        <Kanban
            value={columns}
            onValueChange={setColumns}
            getItemValue={(item) => item.id}
            onMove={handleMove}
            className="h-full w-full"
        >
            <Board>
                {Object.entries(columns).map(([columnId, tasks]) => (
                    <KanbanColumn key={columnId} value={columnId} className="h-full min-w-[300px]">
                        <div className="flex items-center justify-between p-3 font-medium">
                            <div className="flex items-center gap-2">
                                <KanbanColumnHandle className="cursor-grab">
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </KanbanColumnHandle>
                                <span className="text-sm font-semibold text-foreground">
                                    {columnTitles[columnId]}
                                </span>
                                <Badge variant="secondary" size="xs" className="rounded-full px-2">
                                    {tasks.length}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Plus className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        <KanbanColumnContent value={columnId} className="h-full p-2 bg-muted/30 rounded-lg border border-border/50">
                            {tasks.map((task) => (
                                <KanbanItem key={task.id} value={task.id} className="bg-card rounded-md border shadow-sm">
                                    <KanbanItemHandle className="cursor-grab active:cursor-grabbing w-full h-full p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex items-center justify-between w-full">
                                                    <span className="font-medium text-sm">{task.title}</span>
                                                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                                                </div>
                                                <span className="text-xs text-muted-foreground">{task.clientName}</span>

                                                {task.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {task.tags.map((tag, i) => (
                                                            <Badge key={i} variant="outline" size="xs" className="text-[10px] h-5">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                                            <div className="flex items-center -space-x-2">
                                                <Avatar className="h-5 w-5 border-2 border-background">
                                                    <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                                        {task.title.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(task.created_at || Date.now()).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </KanbanItemHandle>
                                </KanbanItem>
                            ))}
                        </KanbanColumnContent>
                    </KanbanColumn>
                ))}
            </Board>

            <KanbanOverlay>
                {({ value, variant }) => {
                    if (variant === 'column') return null; // Optional: Custom column drag preview

                    // Find the task for the overlay
                    let task: Task | undefined;
                    for (const col of Object.values(columns)) {
                        task = col.find(t => t.id === value);
                        if (task) break;
                    }

                    if (!task) return null;

                    return (
                        <div className="bg-card rounded-md border shadow-xl p-3 w-[var(--radix-item-width)] cursor-grabbing">
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex flex-col gap-1 w-full">
                                    <div className="flex items-center justify-between w-full">
                                        <span className="font-medium text-sm">{task.title}</span>
                                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                    <span className="text-xs text-muted-foreground">{task.clientName}</span>

                                    {task.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {task.tags.map((tag, i) => (
                                                <Badge key={i} variant="outline" size="xs" className="text-[10px] h-5">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }}
            </KanbanOverlay>
        </Kanban>
    );
}
