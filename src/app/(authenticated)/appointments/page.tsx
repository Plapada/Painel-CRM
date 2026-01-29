"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    User,
    Calendar as CalendarIcon,
    Clock,
    Phone,
    MapPin,
    FileText,
    ExternalLink,
    Search,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    PlayCircle,
    CheckSquare,
    MessageCircle,
    Plus,
    Trash2
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { ptBR } from "date-fns/locale"

// --- Types ---
type AppointmentStatus =
    | 'pendente'
    | 'confirmado'
    | 'confirmada' // Compatibility
    | 'faltou'
    | 'compareceu'
    | 'atrasado'
    | 'em_atendimento'
    | 'finalizado'

interface Appointment {
    id: number
    data_inicio: string
    nome_cliente: string
    telefone_cliente?: string
    email_cliente?: string
    tipo_consulta: string
    status: AppointmentStatus
    convenio?: string
    observacoes?: string
    clinic_id: string
}

const STATUS_CONFIG: Record<AppointmentStatus, { label: string, color: string, icon: any }> = {
    'pendente': { label: 'Pendente', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
    'confirmado': { label: 'Confirmado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: CheckCircle2 },
    'confirmada': { label: 'Confirmada', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: CheckCircle2 },
    'compareceu': { label: 'Compareceu', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: MapPin },
    'em_atendimento': { label: 'Em Atendimento', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: PlayCircle },
    'finalizado': { label: 'Finalizado', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: CheckSquare },
    'atrasado': { label: 'Atrasado', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle },
    'faltou': { label: 'Faltou', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
}

export default function AppointmentsPage() {
    const { user } = useAuth()
    const router = useRouter()

    // State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [loading, setLoading] = useState(true)

    // New Appointment State
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newAppointment, setNewAppointment] = useState({
        nome_cliente: '',
        telefone_cliente: '',
        email_cliente: '',
        tipo_consulta: '',
        data_inicio: new Date().toISOString().split('T')[0],
        hora_inicio: '09:00',
        observacoes: '',
        convenio: ''
    })

    // History State
    const [history, setHistory] = useState<Appointment[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Fetch Appointments
    useEffect(() => {
        if (user?.clinic_id) {
            fetchAppointments()
        }
    }, [user?.clinic_id, selectedDate])

    async function fetchAppointments() {
        if (!user?.clinic_id) return
        setLoading(true)

        // Filter by selected date (entire day)
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
            .from('consultas')
            .select('*')
            .eq('clinic_id', user.clinic_id)
            .gte('data_inicio', startOfDay.toISOString())
            .lte('data_inicio', endOfDay.toISOString())
            .order('data_inicio', { ascending: true })

        if (!error && data) {
            setAppointments(data as Appointment[])
        }
        setLoading(false)
    }

    // Handlers
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date)
            setSelectedAppointment(null)
        }
    }

    const handlePrevDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(selectedDate.getDate() - 1)
        setSelectedDate(newDate)
    }

    const handleNextDay = () => {
        const newDate = new Date(selectedDate)
        newDate.setDate(selectedDate.getDate() + 1)
        setSelectedDate(newDate)
    }

    const handleStatusUpdate = (newStatus: AppointmentStatus) => {
        if (!selectedAppointment) return

        // Local update only (Requires Save)
        const updatedApp = { ...selectedAppointment, status: newStatus }
        setSelectedAppointment(updatedApp)
        // We do NOT update the main list 'appointments' instantly to reflect "unsaved" state if desired, 
        // but for UI consistency let's update it so the user sees the change in the list too (optimistic), 
        // essentially treating the list as the "draft" state until refresh.
        // Or better: keep main list as "Source of Truth"? 
        // User wants "Save" button to commit. 
        // Let's update local selectedAppointment only? No, user expects visual feedback.
        // We will update local state. The "Save" will flush to DB.

        // Update local list visual confirmation
        setAppointments(prev => prev.map(app => app.id === updatedApp.id ? updatedApp : app))

        // Removed DB update from here
    }

    const handleSaveDetails = async () => {
        if (!selectedAppointment) return
        setIsSaving(true)

        try {
            const { error } = await supabase
                .from('consultas')
                .update({
                    status: selectedAppointment.status,
                    observacoes: selectedAppointment.observacoes
                })
                .eq('id', selectedAppointment.id)

            if (error) throw error

            // Success feedback could be a toast, for now just silent or console
            console.log("Appointment saved successfully")
            alert("Alterações salvas com sucesso!")

            // Refresh history if we are in that tab? Not strictly needed for status change.
        } catch (error) {
            console.error("Error saving appointment:", error)
            alert("Erro ao salvar alterações.")
        } finally {
            setIsSaving(false)
        }
    }

    const fetchPatientHistory = async () => {
        if (!selectedAppointment?.clinic_id || !selectedAppointment?.nome_cliente) return
        setLoadingHistory(true)

        try {
            const { data, error } = await supabase
                .from('consultas')
                .select('*')
                .eq('clinic_id', selectedAppointment.clinic_id)
                .eq('nome_cliente', selectedAppointment.nome_cliente)
                .neq('id', selectedAppointment.id) // Exclude current
                .order('data_inicio', { ascending: false })

            if (error) throw error
            setHistory(data as Appointment[])
        } catch (error) {
            console.error("Error fetching history:", error)
        } finally {
            setLoadingHistory(false)
        }
    }

    const handleCancelAppointment = async () => {
        if (!selectedAppointment) return

        const confirmed = window.confirm(
            `Deseja realmente CANCELAR o agendamento de ${selectedAppointment.nome_cliente}?\n\nEsta ação irá alterar o status para "Cancelada".`
        )
        if (!confirmed) return

        try {
            const { error } = await supabase
                .from('consultas')
                .update({ status: 'cancelada' })
                .eq('id', selectedAppointment.id)

            if (error) throw error

            // Update local state
            const updated = { ...selectedAppointment, status: 'cancelada' as AppointmentStatus }
            setSelectedAppointment(updated)
            setAppointments(prev => prev.map(app => app.id === updated.id ? updated : app))
            alert("Agendamento cancelado com sucesso.")
        } catch (error) {
            console.error("Error canceling appointment:", error)
            alert("Erro ao cancelar agendamento.")
        }
    }

    const handleDeleteAppointment = async () => {
        if (!selectedAppointment) return

        const confirmed = window.confirm(
            `Deseja realmente EXCLUIR o agendamento de ${selectedAppointment.nome_cliente}?\n\n⚠️ Esta ação é IRREVERSÍVEL e removerá o registro permanentemente.`
        )
        if (!confirmed) return

        try {
            const { error } = await supabase
                .from('consultas')
                .delete()
                .eq('id', selectedAppointment.id)

            if (error) throw error

            // Remove from local state
            setAppointments(prev => prev.filter(app => app.id !== selectedAppointment.id))
            setSelectedAppointment(null)
            alert("Agendamento excluído com sucesso.")
        } catch (error) {
            console.error("Error deleting appointment:", error)
            alert("Erro ao excluir agendamento.")
        }
    }


    const handleCreateAppointment = async () => {
        if (!user?.clinic_id || !newAppointment.nome_cliente) {
            alert("Nome do cliente é obrigatório.")
            return
        }
        setIsCreating(true)

        try {
            const startDateTime = new Date(`${newAppointment.data_inicio}T${newAppointment.hora_inicio}:00`)
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000) // Default 30 min duration

            const payload = {
                clinic_id: user.clinic_id,
                nome_cliente: newAppointment.nome_cliente,
                telefone_cliente: newAppointment.telefone_cliente,
                email_cliente: newAppointment.email_cliente,
                tipo_consulta: newAppointment.tipo_consulta || 'Consulta',
                data_inicio: startDateTime.toISOString(),
                data_fim: endDateTime.toISOString(), // Standardizing on data_fim based on schema request
                status: 'pendente',
                observacoes: newAppointment.observacoes,
                convenio: newAppointment.convenio
            }

            const { error } = await supabase
                .from('consultas')
                .insert([payload])

            if (error) throw error

            // Success
            fetchAppointments()
            setShowCreateModal(false)
            setNewAppointment({
                nome_cliente: '',
                telefone_cliente: '',
                email_cliente: '',
                tipo_consulta: '',
                data_inicio: new Date().toISOString().split('T')[0],
                hora_inicio: '09:00',
                observacoes: '',
                convenio: ''
            })

        } catch (error) {
            console.error("Error creating appointment:", error)
            alert("Erro ao criar agendamento.")
        } finally {
            setIsCreating(false)
        }
    }

    const openWhatsApp = (phone: string | undefined) => {
        if (!phone) return
        const cleanPhone = phone.replace(/\D/g, '')
        window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }

    // -- Render --
    return (
        <div className="flex h-[calc(100vh-2rem)] gap-4 p-4 overflow-hidden relative">
            {/* LEFT PANEL - LIST */}
            <Card className="w-1/3 min-w-[350px] flex flex-col border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-2 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Agenda</h2>
                        <Button onClick={() => setShowCreateModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6">
                            <Plus className="w-4 h-4 mr-2" /> Novo
                        </Button>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <Button variant="ghost" size="icon" onClick={handlePrevDay}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="text-center">
                            <h2 className="text-lg font-bold capitalize text-foreground">
                                {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {selectedDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleNextDay}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                        <div className="flex flex-col">
                            {loading ? (
                                <div className="p-8 text-center text-muted-foreground">Carregando...</div>
                            ) : appointments.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">Nenhum agendamento para hoje.</div>
                            ) : (
                                appointments.map((apt) => {
                                    const statusStyle = STATUS_CONFIG[apt.status] || STATUS_CONFIG['pendente']
                                    const isSelected = selectedAppointment?.id === apt.id
                                    const time = new Date(apt.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                                    return (
                                        <div
                                            key={apt.id}
                                            onClick={() => setSelectedAppointment(apt)}
                                            className={cn(
                                                "flex items-center gap-3 p-4 border-b cursor-pointer transition-all hover:bg-accent/50",
                                                isSelected && "bg-accent border-l-4 border-l-primary"
                                            )}
                                        >
                                            <div className="font-mono text-lg font-bold text-foreground w-14">
                                                {time}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-foreground truncate">{apt.nome_cliente}</p>
                                                    {apt.status && (
                                                        <div className={cn("w-2 h-2 rounded-full", statusStyle.color.split(' ')[0].replace('bg-', 'bg-'))} />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                    <span className="truncate">{apt.tipo_consulta || "Consulta"}</span>
                                                    {apt.convenio && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="font-medium text-primary">{apt.convenio}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* RIGHT PANEL - DETAIL */}
            <Card className="flex-1 flex flex-col border-0 shadow-lg overflow-hidden bg-card">
                {selectedAppointment ? (
                    <div className="flex flex-col h-full">
                        {/* Header Tabs */}
                        <div className="border-b px-6 pt-4 bg-muted/20">
                            <Tabs defaultValue="detalhes" className="w-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-foreground">
                                            {new Date(selectedAppointment.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </h1>
                                        <p className="text-muted-foreground capitalize">
                                            {selectedAppointment.tipo_consulta || "Consulta Geral"}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <TabsList>
                                            <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                                            <TabsTrigger value="clinico" onClick={fetchPatientHistory}>Prontuário</TabsTrigger>
                                        </TabsList>
                                    </div>
                                </div>

                                <TabsContent value="detalhes" className="mt-0 h-[calc(100vh-14rem)] overflow-y-auto">
                                    <div className="flex gap-6 py-6">
                                        {/* Main Info Column */}
                                        <div className="flex-1 space-y-6">
                                            {/* Patient Search / Name */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Paciente</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        value={selectedAppointment.nome_cliente}
                                                        readOnly
                                                        className="pl-9 font-semibold text-lg h-12 bg-accent/20 border-accent"
                                                    />
                                                </div>
                                            </div>

                                            {/* Contact Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Celular</label>
                                                    <div className="flex gap-2">
                                                        <Input value={selectedAppointment.telefone_cliente || ''} readOnly />
                                                        <Button
                                                            size="icon"
                                                            className="bg-green-600 hover:bg-green-700 text-white shrink-0"
                                                            onClick={() => openWhatsApp(selectedAppointment.telefone_cliente)}
                                                            title="Abrir WhatsApp"
                                                        >
                                                            <MessageCircle className="h-5 w-5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                                    <Input value={selectedAppointment.email_cliente || ''} readOnly placeholder="Não informado" />
                                                </div>
                                            </div>

                                            {/* Insurance Info */}
                                            <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-sm font-medium text-foreground">Convênio</span>
                                                    <Badge variant="outline" className="border-orange-200 text-orange-700 bg-white/50">{selectedAppointment.convenio || "Particular"}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">Clique para ver detalhes da carteirinha</p>
                                            </div>

                                            {/* Obs */}
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground">Observações</label>
                                                <Input
                                                    value={selectedAppointment.observacoes || ''}
                                                    onChange={(e) => {
                                                        // Update local state ONLY
                                                        const updated = { ...selectedAppointment, observacoes: e.target.value }
                                                        setSelectedAppointment(updated)
                                                        // Update list too prevent jumpiness
                                                        setAppointments(prev => prev.map(app => app.id === updated.id ? updated : app))
                                                    }}
                                                    placeholder="Adicione observações..."
                                                    className="bg-muted/30 min-h-[50px]"
                                                />
                                                <p className="text-[10px] text-muted-foreground text-right">* Clique em Salvar para registrar.</p>
                                            </div>
                                        </div>

                                        {/* Actions / Status Column */}
                                        <div className="w-72 space-y-6 border-l pl-6">
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Status do Atendimento</h3>

                                                <div className="space-y-2">
                                                    {(Object.keys(STATUS_CONFIG) as AppointmentStatus[]).map((statusKey) => {
                                                        const config = STATUS_CONFIG[statusKey]
                                                        const Icon = config.icon
                                                        const isActive = selectedAppointment.status === statusKey

                                                        return (
                                                            <button
                                                                key={statusKey}
                                                                onClick={() => handleStatusUpdate(statusKey)}
                                                                className={cn(
                                                                    "w-full flex items-center justify-between p-3 rounded-lg text-sm font-medium transition-all border",
                                                                    isActive
                                                                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                                                                        : "border-transparent hover:bg-muted text-muted-foreground"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <div className={cn(
                                                                        "p-1.5 rounded-full bg-muted",
                                                                        isActive && "bg-primary text-white"
                                                                    )}>
                                                                        <Icon className="h-4 w-4" />
                                                                    </div>
                                                                    <span>{config.label}</span>
                                                                </div>
                                                                {isActive && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>

                                            <div className="pt-6 border-t space-y-3">
                                                <Button
                                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg"
                                                    onClick={handleSaveDetails}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                                                </Button>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                                        onClick={handleCancelAppointment}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" />
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                                                        onClick={handleDeleteAppointment}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Excluir
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="clinico" className="h-[calc(100vh-14rem)] overflow-y-auto mt-0">
                                    <div className="p-6 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold text-lg">Histórico do Paciente</h3>
                                            <Badge variant="outline">{history.length} consultas encontradas</Badge>
                                        </div>

                                        {loadingHistory ? (
                                            <div className="py-8 text-center text-muted-foreground">Carregando histórico...</div>
                                        ) : history.length > 0 ? (
                                            <div className="space-y-4">
                                                {history.map((hist) => (
                                                    <Card key={hist.id} className="border bg-gray-50/50 dark:bg-white/5">
                                                        <CardContent className="p-4 flex items-center justify-between">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-foreground">
                                                                        {new Date(hist.data_inicio).toLocaleDateString('pt-BR')}
                                                                    </span>
                                                                    <span className="text-xs text-muted-foreground">
                                                                        {new Date(hist.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-medium">{hist.tipo_consulta || 'Consulta'}</p>
                                                                {hist.observacoes && (
                                                                    <p className="text-xs text-muted-foreground max-w-md truncate">
                                                                        Obs: {hist.observacoes}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2">
                                                                <Badge
                                                                    className={cn(
                                                                        STATUS_CONFIG[hist.status].color,
                                                                        "text-[10px] uppercase pointer-events-none"
                                                                    )}
                                                                >
                                                                    {STATUS_CONFIG[hist.status].label}
                                                                </Badge>
                                                                {/* Potential 'Ver' button here if we want deep linking */}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                                                <FileText className="h-10 w-10 mb-2 opacity-20" />
                                                <p>Nenhum histórico encontrado para este paciente.</p>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5">
                        <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold mb-2">Selecione um Agendamento</h3>
                        <p className="max-w-xs text-center text-sm opacity-70">
                            Clique em um horário na lista à esquerda para ver detalhes e gerenciar o atendimento.
                        </p>
                    </div>
                )}
            </Card>

            {/* CREATE APPOINTMENT MODAL OVERLAY */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl border-0 ring-1 ring-white/10">
                        <CardHeader>
                            <CardTitle className="text-xl">Novo Agendamento</CardTitle>
                            <CardDescription>Preencha os dados para criar um novo agendamento.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Nome do Paciente</label>
                                <Input
                                    value={newAppointment.nome_cliente}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, nome_cliente: e.target.value })}
                                    placeholder="Ex: Maria Silva"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Telefone</label>
                                    <Input
                                        value={newAppointment.telefone_cliente}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, telefone_cliente: e.target.value })}
                                        placeholder="(11) 99999-9999"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo</label>
                                    <Input
                                        value={newAppointment.tipo_consulta}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, tipo_consulta: e.target.value })}
                                        placeholder="Ex: Consulta, Retorno"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Data</label>
                                    <Input
                                        type="date"
                                        value={newAppointment.data_inicio}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, data_inicio: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Hora</label>
                                    <Input
                                        type="time"
                                        value={newAppointment.hora_inicio}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, hora_inicio: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Convênio</label>
                                <Input
                                    value={newAppointment.convenio}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, convenio: e.target.value })}
                                    placeholder="Particular, Unimed..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Observações</label>
                                <Input
                                    value={newAppointment.observacoes}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, observacoes: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 bg-muted/20 py-4">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                            <Button onClick={handleCreateAppointment} disabled={isCreating}>
                                {isCreating ? 'Criando...' : 'Agendar'}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div>
    )
}
