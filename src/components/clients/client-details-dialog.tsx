"use client"

import { useState, useRef } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Calendar, Mail, MapPin, Phone, User, FileText, Briefcase, CreditCard, Edit2, Save, X, Play, Pause, Sparkles, CalendarDays, Loader2 } from "lucide-react"
import { type Patient, updatePatient, pauseWhatsAppPatient, resumeWhatsAppPatient } from "@/app/actions/get-patients"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClientDetailsDialogProps {
    patient: Patient | null
    isOpen: boolean
    onClose: () => void
    onUpdate?: () => void
}

export function ClientDetailsDialog({ patient, isOpen, onClose, onUpdate }: ClientDetailsDialogProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const formRef = useRef<HTMLFormElement>(null)

    if (!patient) return null

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const formData = new FormData(formRef.current!)
            const updates: Partial<Patient> = {
                nome: formData.get('nome') as string,
                telefone: formData.get('telefone') as string,
                email: formData.get('email') as string,
                cpf: formData.get('cpf') as string,
                convenio: formData.get('convenio') as string,
                prontuario: formData.get('prontuario') as string,
                profissao: formData.get('profissao') as string,
                endereco_logradouro: formData.get('endereco_logradouro') as string,
                endereco_numero: formData.get('endereco_numero') as string,
            }

            const result = await updatePatient(Number(patient.id), updates)

            if (result.success) {
                toast.success("Dados do paciente atualizados.")
                setIsEditing(false)
                onUpdate?.()
            } else {
                throw new Error(result.error)
            }
        } catch (error: any) {
            toast.error("Falha ao atualizar dados: " + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleTogglePause = async () => {
        setActionLoading('pause')
        try {
            const patientId = Number(patient.id)
            if (patient.atendimento_ia === 'pause') {
                await resumeWhatsAppPatient(patientId)
                toast.success("IA retomada com sucesso.")
            } else {
                await pauseWhatsAppPatient(patientId)
                toast.success("IA pausada com sucesso.")
            }
            onUpdate?.()
        } catch (error) {
            toast.error("Falha ao alterar status da IA.")
        } finally {
            setActionLoading(null)
        }
    }

    // Placeholder for summarize (reuse logic from page if possible or reimplement)
    const handleSummarize = () => {
        toast.info("Funcionalidade de resumo será implementada aqui.")
    }

    // Placeholder for appointment
    const handleNewAppointment = () => {
        toast.info("Funcionalidade de agendamento será implementada aqui.")
    }

    const initials = patient.nome
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/50 shadow-2xl">
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b bg-muted/30 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-primary/20">
                                <AvatarFallback className="text-lg bg-primary/10 text-yellow-600 dark:text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    {isEditing ? (
                                        <Input
                                            defaultValue={patient.nome}
                                            name="nome"
                                            form="edit-form"
                                            className="h-8 text-lg font-bold w-[300px]"
                                        />
                                    ) : (
                                        patient.nome
                                    )}
                                    {patient.atendimento_ia && (
                                        <Badge
                                            variant={patient.atendimento_ia === 'pause' ? 'secondary' : 'default'}
                                            className={`text-xs ml-2 ${patient.atendimento_ia === 'reativada' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}`}
                                        >
                                            {patient.atendimento_ia === 'pause' ? 'IA Pausada' : patient.atendimento_ia === 'reativada' ? 'IA Reativada' : 'IA Ativa'}
                                        </Badge>
                                    )}
                                </DialogTitle>
                                <DialogDescription className="text-muted-foreground flex items-center gap-2 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {isEditing ? (
                                        <Input
                                            defaultValue={patient.telefone || ""}
                                            name="telefone"
                                            form="edit-form"
                                            className="h-6 w-[150px] text-xs"
                                        />
                                    ) : (
                                        patient.telefone || "Sem telefone"
                                    )}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Actions Toolbar */}
                            {!isEditing && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleTogglePause}
                                        disabled={!!actionLoading}
                                        className={patient.atendimento_ia === 'pause' ? "text-green-600 hover:text-green-700 bg-green-50" : "text-amber-600 hover:text-amber-700 bg-amber-50"}
                                    >
                                        {actionLoading === 'pause' ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : patient.atendimento_ia === 'pause' ? (
                                            <>
                                                <Play className="h-4 w-4 mr-2" /> Retomar IA
                                            </>
                                        ) : (
                                            <>
                                                <Pause className="h-4 w-4 mr-2" /> Pausar IA
                                            </>
                                        )}
                                    </Button>

                                    <Button variant="outline" size="sm" onClick={handleSummarize}>
                                        <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                                        Resumir
                                    </Button>

                                    <Button variant="outline" size="sm" onClick={handleNewAppointment}>
                                        <CalendarDays className="h-4 w-4 mr-2 text-blue-500" />
                                        Agendar
                                    </Button>

                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Editar
                                    </Button>
                                </>
                            )}

                            {isEditing && (
                                <>
                                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isLoading}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancelar
                                    </Button>
                                    <Button size="sm" onClick={handleSave} disabled={isLoading}>
                                        {isLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Save className="h-4 w-4 mr-2" />
                                        )}
                                        Salvar
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                            <form id="edit-form" ref={formRef} className="p-6 space-y-8">
                                <div className="grid grid-cols-2 gap-8">
                                    {/* Personal Info */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2 text-yellow-600 dark:text-primary">
                                            <User className="h-4 w-4" />
                                            Dados Pessoais
                                        </h3>
                                        <div className="grid gap-4 pl-6 border-l-2 border-muted">
                                            <div className="grid gap-2">
                                                <Label>Email</Label>
                                                {isEditing ? (
                                                    <Input defaultValue={patient.email || ""} name="email" />
                                                ) : (
                                                    <div className="text-sm">{patient.email || "-"}</div>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>CPF</Label>
                                                {isEditing ? (
                                                    <Input defaultValue={patient.cpf || ""} name="cpf" />
                                                ) : (
                                                    <div className="text-sm">{patient.cpf || "-"}</div>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Profissão</Label>
                                                {isEditing ? (
                                                    <Input defaultValue={patient.profissao || ""} name="profissao" />
                                                ) : (
                                                    <div className="text-sm">{patient.profissao || "-"}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Clinical Info & Address */}
                                    <div className="space-y-8">
                                        <div className="space-y-4">
                                            <h3 className="font-semibold flex items-center gap-2 text-yellow-600 dark:text-primary">
                                                <FileText className="h-4 w-4" />
                                                Dados Clínicos
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4 pl-6 border-l-2 border-muted">
                                                <div className="grid gap-2">
                                                    <Label>Convênio</Label>
                                                    {isEditing ? (
                                                        <Input defaultValue={patient.convenio || ""} name="convenio" />
                                                    ) : (
                                                        <div className="text-sm">
                                                            <Badge variant="outline">{patient.convenio || "Particular"}</Badge>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Prontuário</Label>
                                                    {isEditing ? (
                                                        <Input defaultValue={patient.prontuario || ""} name="prontuario" />
                                                    ) : (
                                                        <div className="text-sm font-mono">{patient.prontuario || "-"}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="font-semibold flex items-center gap-2 text-yellow-600 dark:text-primary">
                                                <MapPin className="h-4 w-4" />
                                                Endereço
                                            </h3>
                                            <div className="grid grid-cols-3 gap-4 pl-6 border-l-2 border-muted">
                                                <div className="col-span-2 grid gap-2">
                                                    <Label>Logradouro</Label>
                                                    {isEditing ? (
                                                        <Input defaultValue={patient.endereco_logradouro || ""} name="endereco_logradouro" />
                                                    ) : (
                                                        <div className="text-sm truncate" title={patient.endereco_logradouro || ""}>
                                                            {patient.endereco_logradouro || "-"}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="grid gap-2">
                                                    <Label>Número</Label>
                                                    {isEditing ? (
                                                        <Input defaultValue={patient.endereco_numero || ""} name="endereco_numero" />
                                                    ) : (
                                                        <div className="text-sm">{patient.endereco_numero || "-"}</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* History Tab (Simplified for now, can be expanded) */}
                                <div>
                                    <h3 className="font-semibold mb-4 flex items-center gap-2 text-yellow-600 dark:text-primary">
                                        <Calendar className="h-4 w-4" />
                                        Histórico Recente
                                    </h3>
                                    <div className="bg-muted/20 rounded-lg p-4 text-center text-muted-foreground text-sm border border-dashed">
                                        Histórico de consultas será carregado aqui.
                                    </div>
                                </div>
                            </form>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
