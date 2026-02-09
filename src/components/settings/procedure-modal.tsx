'use client'

import { useState, useEffect } from "react"
import { Procedure, createProcedure, updateProcedure } from "@/app/actions/procedures"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"
import { notify } from "@/lib/notify"

interface ProcedureModalProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    procedure?: Procedure | null
    onSuccess: () => void
}

export function ProcedureModal({ isOpen, onOpenChange, procedure, onSuccess }: ProcedureModalProps) {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")
    const [value, setValue] = useState("")

    useEffect(() => {
        if (procedure) {
            setName(procedure.nome)
            setValue(procedure.valor.toString())
        } else {
            setName("")
            setValue("")
        }
    }, [procedure, isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user?.clinic_id) return

        try {
            setLoading(true)
            const numericValue = parseFloat(value.replace(',', '.')) || 0

            if (procedure) {
                await updateProcedure(procedure.id, {
                    nome: name,
                    valor: numericValue
                })
                notify.success("Procedimento atualizado com sucesso!")
            } else {
                await createProcedure({
                    concessionaria_id: user.clinic_id,
                    nome: name,
                    valor: numericValue,
                    ativo: true
                })
                notify.success("Procedimento criado com sucesso!")
            }

            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error(error)
            notify.error("Tente novamente mais tarde.", "Erro ao salvar procedimento")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{procedure ? "Editar Procedimento" : "Novo Procedimento"}</DialogTitle>
                    <DialogDescription>
                        {procedure ? "Edite os detalhes do procedimento." : "Adicione um novo procedimento ao catálogo."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Procedimento</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Consulta, Exame X..."
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="value">Valor (R$)</Label>
                        <Input
                            id="value"
                            type="number"
                            step="0.01"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="0.00"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
