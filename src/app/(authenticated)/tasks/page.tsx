"use client"

import { useState } from "react"
import { Plus, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Task {
    id: string
    title: string
    completed: boolean
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([
        { id: "1", title: "Revisar novos leads", completed: false },
        { id: "2", title: "Atualizar status dos clientes", completed: true },
        { id: "3", title: "Preparar relatório semanal", completed: false },
    ])
    const [newTask, setNewTask] = useState("")

    const addTask = () => {
        if (!newTask.trim()) return
        const task: Task = {
            id: Date.now().toString(),
            title: newTask,
            completed: false,
        }
        setTasks([task, ...tasks])
        setNewTask("")
    }

    const toggleTask = (id: string) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t))
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            addTask()
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Minhas Tarefas</h1>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Adicionar Nova Tarefa</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="O que precisa ser feito?"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <Button onClick={addTask}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 max-w-2xl">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        className={cn(
                            "flex items-center gap-3 rounded-lg border p-4 transition-all hover:bg-accent",
                            task.completed && "bg-muted/50 opacity-70"
                        )}
                    >
                        <button
                            onClick={() => toggleTask(task.id)}
                            className="text-primary hover:text-primary/80"
                        >
                            {task.completed ? (
                                <CheckCircle2 className="h-6 w-6" />
                            ) : (
                                <Circle className="h-6 w-6" />
                            )}
                        </button>
                        <span
                            className={cn(
                                "flex-1 font-medium",
                                task.completed && "line-through text-muted-foreground"
                            )}
                        >
                            {task.title}
                        </span>
                    </div>
                ))}
                {tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        Nenhuma tarefa pendente.
                    </div>
                )}
            </div>
        </div>
    )
}
