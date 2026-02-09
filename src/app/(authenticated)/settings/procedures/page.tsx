'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Pencil, Trash2, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getProcedures, deleteProcedure, Procedure } from "@/app/actions/procedures"
import { ProcedureModal } from "@/components/settings/procedure-modal"
import { notify } from "@/lib/notify"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Link from "next/link"

export default function ProceduresPage() {
    const { user } = useAuth()
    const [procedures, setProcedures] = useState<Procedure[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingProcedure, setEditingProcedure] = useState<Procedure | null>(null)

    const fetchProcedures = async () => {
        if (!user?.clinic_id) return
        try {
            setLoading(true)
            const data = await getProcedures(user.clinic_id)
            setProcedures(data)
        } catch (error) {
            console.error(error)
            notify.error("Erro ao carregar procedimentos")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProcedures()
    }, [user?.clinic_id])

    const handleEdit = (proc: Procedure) => {
        setEditingProcedure(proc)
        setIsModalOpen(true)
    }

    const handleAddNew = () => {
        setEditingProcedure(null)
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este procedimento?")) return
        try {
            await deleteProcedure(id)
            notify.success("Procedimento excluído com sucesso!")
            fetchProcedures()
        } catch (error) {
            notify.error("Erro ao excluir procedimento")
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/settings">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Procedimentos</h1>
                    <p className="text-muted-foreground">Gerencie o catálogo de procedimentos e valores.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Lista de Procedimentos</CardTitle>
                        <CardDescription>
                            Procedimentos disponíveis para agendamento.
                        </CardDescription>
                    </div>
                    <Button onClick={handleAddNew}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Procedimento
                    </Button>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                    ) : procedures.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhum procedimento cadastrado.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Valor (R$)</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {procedures.map((proc) => (
                                    <TableRow key={proc.id}>
                                        <TableCell className="font-medium">{proc.nome}</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proc.valor)}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(proc)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(proc.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ProcedureModal
                isOpen={isModalOpen}
                onOpenChange={setIsModalOpen}
                procedure={editingProcedure}
                onSuccess={fetchProcedures}
            />
        </div>
    )
}
