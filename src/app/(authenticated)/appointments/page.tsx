"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { notify } from "@/lib/notify"
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
import { Calendar as MiniCalendar } from "@/components/ui/calendar-rac"
import { parseDate, CalendarDate } from "@internationalized/date"
import { DateValue } from "react-aria-components"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Check } from "lucide-react"

// --- Types ---
type AppointmentStatus =
    | 'pendente'
    | 'confirmado'
    // 'confirmada' removed as duplicate requested
    | 'faltou'
    | 'compareceu'
    | 'atrasado'
    | 'em_atendimento'
    | 'finalizado'
    | 'cancelada' // Keeping for existing data if any

interface Appointment {
    id: number
    data_inicio: string
    nome_cliente: string
    telefone_cliente?: string
    celular_cliente?: string // Added
    email_cliente?: string
    tipo_consulta: string
    status: AppointmentStatus
    convenio?: string
    observacoes?: string
    clinic_id: string
    prontuario?: string // Added
    realizou_procedimento?: boolean // Added
    codigo_procedimento?: string // Added
}

const STATUS_CONFIG: Record<AppointmentStatus | 'confirmada', { label: string, color: string, icon: any }> = {
    'pendente': { label: 'Pendente', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', icon: Clock },
    'confirmado': { label: 'Confirmado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: CheckCircle2 },
    'confirmada': { label: 'Confirmado', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: CheckCircle2 }, // Legacy support
    'compareceu': { label: 'Compareceu', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: MapPin },
    'em_atendimento': { label: 'Em Atendimento', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: PlayCircle },
    'finalizado': { label: 'Finalizado', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', icon: CheckSquare },
    'atrasado': { label: 'Atrasado', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle },
    'faltou': { label: 'Faltou', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
    'cancelada': { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
}

export default function AppointmentsPage() {
    const { user } = useAuth()
    const router = useRouter()

    // State
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [loading, setLoading] = useState(true)
    const [bookedDays, setBookedDays] = useState<Set<string>>(new Set())

    // New Appointment State
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [newAppointment, setNewAppointment] = useState<{
        nome_cliente: string
        telefone_cliente: string
        celular_cliente: string
        email_cliente: string
        tipo_consulta: string
        data_inicio: string
        hora_inicio: string
        observacoes: string
        convenio: string
        prontuario: string
        realizou_procedimento: boolean
        codigo_procedimento: string
    }>({
        nome_cliente: '',
        telefone_cliente: '',
        celular_cliente: '',
        email_cliente: '',
        tipo_consulta: 'Particular', // Default to Particular
        data_inicio: new Date().toISOString().split('T')[0],
        hora_inicio: '09:00',
        observacoes: '',
        convenio: '',
        prontuario: '',
        realizou_procedimento: false,
        codigo_procedimento: ''
    })

    // Patient Search State
    const [openCombobox, setOpenCombobox] = useState(false)
    const [patientSuggestions, setPatientSuggestions] = useState<any[]>([])

    // Edit Patient State
    const [showEditPatientModal, setShowEditPatientModal] = useState(false)
    const [editingPatient, setEditingPatient] = useState<Appointment | null>(null)

    // History State
    const [history, setHistory] = useState<Appointment[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    // Fetch Appointments
    useEffect(() => {
        if (user?.clinic_id) {
            fetchAppointments()
            fetchMonthBookings()
        }
    }, [user?.clinic_id, selectedDate])

    async function fetchMonthBookings() {
        if (!user?.clinic_id) return

        // Simple optimization: fetch +/- 40 days from selected date to cover view
        const targetDate = new Date(selectedDate)
        const startDate = new Date(targetDate)
        startDate.setDate(startDate.getDate() - 40)
        const endDate = new Date(targetDate)
        endDate.setDate(endDate.getDate() + 40)

        const { data, error } = await supabase
            .from('consultas')
            .select('data_inicio')
            .eq('clinic_id', user.clinic_id)
            .gte('data_inicio', startDate.toISOString())
            .lte('data_inicio', endDate.toISOString())

        if (!error && data) {
            const days = new Set<string>(data.map(d => d.data_inicio.split('T')[0]))
            setBookedDays(days)
        }
    }

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
    const handleDateSelect = (date: DateValue) => {
        // Convert RAC DateValue to JS Date
        const jsDate = new Date(date.year, date.month - 1, date.day)
        setSelectedDate(jsDate)
        setSelectedAppointment(null)
    }

    const getCalendarValue = (date: Date): CalendarDate => {
        return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
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
            notify.success("Alterações salvas com sucesso!")

            // Refresh history if we are in that tab? Not strictly needed for status change.
        } catch (error) {
            console.error("Error saving appointment:", error)
            notify.error("Erro ao salvar alterações.")
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
            notify.success("Agendamento cancelado com sucesso.")
        } catch (error) {
            console.error("Error canceling appointment:", error)
            notify.error("Erro ao cancelar agendamento.")
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
            notify.success("Agendamento excluído com sucesso.")
        } catch (error) {
            console.error("Error deleting appointment:", error)
            notify.error("Erro ao excluir agendamento.")
        }
    }



    // --- Autocomplete Logic ---
    const handleSearchPatient = async (query: string) => {
        // Debounce? For now direct call or reliance on Command input state
        if (!query || query.length < 2) {
            setPatientSuggestions([])
            return
        }

        const { data, error } = await supabase
            .from('consultas')
            .select('nome_cliente, telefone_cliente, celular_cliente, email_cliente, prontuario, convenio')
            .ilike('nome_cliente', `%${query}%`)
            .order('data_inicio', { ascending: false })
            .limit(10) // Limit results

        if (!error && data) {
            // Deduplicate by name
            const seen = new Set()
            const unique = data.filter(item => {
                const duplicate = seen.has(item.nome_cliente)
                seen.add(item.nome_cliente)
                return !duplicate
            })
            setPatientSuggestions(unique)
        }
    }

    const handleSelectPatient = (patient: any) => {
        setNewAppointment(prev => ({
            ...prev,
            nome_cliente: patient.nome_cliente,
            telefone_cliente: patient.telefone_cliente || '',
            celular_cliente: patient.celular_cliente || '',
            email_cliente: patient.email_cliente || '',
            prontuario: patient.prontuario || '',
            convenio: patient.convenio || '',
        }))
        setOpenCombobox(false)
    }


    const handleCreateAppointment = async () => {
        if (!user?.clinic_id || !newAppointment.nome_cliente) {
            notify.warning("Nome do cliente é obrigatório.")
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
                celular_cliente: newAppointment.celular_cliente,
                email_cliente: newAppointment.email_cliente,
                tipo_consulta: newAppointment.tipo_consulta || 'Consulta',
                data_inicio: startDateTime.toISOString(),
                data_fim: endDateTime.toISOString(),
                status: 'pendente',
                observacoes: newAppointment.observacoes,
                convenio: newAppointment.convenio,
                prontuario: newAppointment.prontuario,
                realizou_procedimento: newAppointment.realizou_procedimento,
                codigo_procedimento: newAppointment.realizou_procedimento ? newAppointment.codigo_procedimento : null
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
                celular_cliente: '',
                email_cliente: '',
                tipo_consulta: 'Particular',
                data_inicio: new Date().toISOString().split('T')[0],
                hora_inicio: '09:00',
                observacoes: '',
                convenio: '',
                prontuario: '',
                realizou_procedimento: false,
                codigo_procedimento: ''
            })
            notify.success("Agendamento criado!")

        } catch (error) {
            console.error("Error creating appointment:", error)
            notify.error("Erro ao criar agendamento.")
        } finally {
            setIsCreating(false)
        }
    }

    const handleReschedule = async () => {
        // Quick Reschedule Logic - Could be a modal, for now prompt date?
        // Or just open Edit Modal and allow Date change?
        // User asked for "Opção de reagendar"
        // Let's assume a prompt for now or open a simple date picker modal
        // Simplest: Edit 'selectedAppointment' state locally and trigger Save? 
        // No, dedicated action is better.
        // Let's implement a quick date prompt for now to prove logic
        const newDateStr = prompt("Informe a nova data (YYYY-MM-DD):", selectedAppointment?.data_inicio.split('T')[0])
        const newTimeStr = prompt("Informe o novo horário (HH:MM):", new Date(selectedAppointment!.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

        if (newDateStr && newTimeStr && selectedAppointment) {
            const newDateTime = new Date(`${newDateStr}T${newTimeStr}:00`).toISOString()

            const { error } = await supabase
                .from('consultas')
                .update({ data_inicio: newDateTime })
                .eq('id', selectedAppointment.id)

            if (!error) {
                notify.success("Reagendado com sucesso!")
                fetchAppointments()
                setSelectedAppointment(null)
            } else {
                notify.error("Erro ao reagendar.")
            }
        }
    }

    const handleUpdatePatientInfo = async () => {
        if (!editingPatient) return
        // Update info of ALL appointments for this patient? Or just this one?
        // Since no 'patients' table, update THIS appointment and rely on autocomplete for future.
        // Or update all with same name? Too risky.
        // Just update this appointment.

        const { error } = await supabase
            .from('consultas')
            .update({
                nome_cliente: editingPatient.nome_cliente,
                telefone_cliente: editingPatient.telefone_cliente,
                celular_cliente: editingPatient.celular_cliente,
                email_cliente: editingPatient.email_cliente,
                prontuario: editingPatient.prontuario
            })
            .eq('id', editingPatient.id)

        if (!error) {
            notify.success("Dados do paciente atualizados!")
            setAppointments(prev => prev.map(a => a.id === editingPatient.id ? { ...a, ...editingPatient } : a))
            setSelectedAppointment(editingPatient)
            setShowEditPatientModal(false)
        } else {
            console.error(error)
            notify.error("Erro ao atualizar dados.")
        }
    }


    const openWhatsApp = (phone: string | undefined) => {
        if (!phone) return
        const cleanPhone = phone.replace(/\D/g, '')
        window.open(`https://wa.me/${cleanPhone}`, '_blank')
    }

    // -- Render --
    return (
        <div className="flex h-[calc(100vh-1rem)] gap-2 p-2 overflow-hidden relative text-xs">
            {/* LEFT COLUMN: LIST + CALENDAR */}
            <div className="flex flex-col gap-2 w-[380px] min-w-[350px] shrink-0">
                {/* LIST */}
                <Card className="flex-1 flex flex-col border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-2 border-b space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold">
                                    {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h2>
                            </div>
                            <Button onClick={() => setShowCreateModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-3 h-7 text-[10px]">
                                <Plus className="w-3 h-3 mr-1" /> Novo
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 p-0 overflow-hidden">
                        <ScrollArea className="h-full">
                            <div className="flex flex-col">
                                {loading ? (
                                    <div className="p-8 text-center text-muted-foreground">Carregando...</div>
                                ) : appointments.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground">Nenhum agendamento para este dia.</div>
                                ) : (
                                    appointments.map((apt) => {
                                        const statusStyle = STATUS_CONFIG[apt.status] || STATUS_CONFIG['pendente']
                                        const isSelected = selectedAppointment?.id === apt.id
                                        const status = STATUS_CONFIG[apt.status] || STATUS_CONFIG['pendente']
                                        return (
                                            <div
                                                key={apt.id}
                                                onClick={() => setSelectedAppointment(apt)}
                                                className={cn(
                                                    "group flex flex-col gap-1 p-2 rounded-lg border transition-all cursor-pointer hover:shadow-md",
                                                    selectedAppointment?.id === apt.id
                                                        ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                                                        : "bg-card border-border hover:border-primary/50"
                                                )}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-2 font-bold text-foreground">
                                                        <span>{apt.data_inicio.split('T')[1].substring(0, 5)}</span>
                                                        <span className="text-muted-foreground font-normal text-xs">{apt.tipo_consulta}</span>
                                                    </div>
                                                    <Badge variant="outline" className={cn("text-[10px] px-1 py-0 h-5", status.color)}>
                                                        {status.label}
                                                    </Badge>
                                                </div>

                                                <div className="font-semibold text-xs truncate">{apt.nome_cliente}</div>

                                                {apt.observacoes && (
                                                    <div className="text-xs text-muted-foreground truncate max-w-full">
                                                        {apt.observacoes}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm p-1 flex justify-center shrink-0">
                    <MiniCalendar
                        aria-label="Calendário de Agendamentos"
                        value={getCalendarValue(selectedDate)}
                        onChange={handleDateSelect}
                        bookedDays={bookedDays}
                        className="rounded-md border p-0 bg-background shadow-none scale-90 origin-center"
                    />
                </Card>
            </div>

            {/* RIGHT PANEL - DETAIL */}
            <Card className="flex-1 flex flex-col border-0 shadow-lg overflow-hidden bg-card min-w-[400px]">
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
                                    <div className="flex gap-2 py-2">
                                        {/* Main Info Column */}
                                        <div className="flex-1 space-y-2">
                                            {/* Patient Search / Name */}
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">Paciente</label>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-2.5 h-3 w-3 text-muted-foreground" />
                                                    <Input
                                                        value={selectedAppointment.nome_cliente}
                                                        readOnly
                                                        className="pl-8 font-semibold text-sm h-8 bg-accent/20 border-accent"
                                                    />
                                                </div>
                                            </div>

                                            {/* Contact Grid */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">Celular</label>
                                                    <div className="flex gap-2">
                                                        <Input value={selectedAppointment.telefone_cliente || ''} readOnly className="h-8 text-sm" />
                                                        <Button
                                                            size="icon"
                                                            className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white shrink-0"
                                                            onClick={() => openWhatsApp(selectedAppointment.telefone_cliente)}
                                                            title="Abrir WhatsApp"
                                                        >
                                                            <MessageCircle className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-medium text-muted-foreground">Email</label>
                                                    <Input value={selectedAppointment.email_cliente || ''} readOnly placeholder="Não informado" className="h-8 text-sm" />
                                                </div>
                                            </div>

                                            {/* Insurance Info */}
                                            <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 flex justify-between items-center">
                                                <span className="text-xs font-medium text-foreground">Convênio</span>
                                                <Badge variant="outline" className="border-orange-200 text-orange-700 bg-white/50 text-xs px-2 py-0 h-5">{selectedAppointment.convenio || "Particular"}</Badge>
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

                                            {/* Action Buttons (Moved) */}
                                            <div className="pt-4 border-t space-y-2 mt-2">
                                                <Button
                                                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-lg"
                                                    onClick={handleSaveDetails}
                                                    disabled={isSaving}
                                                >
                                                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                                                </Button>

                                                <Button
                                                    className="w-full" variant="secondary"
                                                    onClick={handleReschedule}
                                                >
                                                    <Clock className="w-4 h-4 mr-2" /> Reagendar
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

                                                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => { setEditingPatient(selectedAppointment); setShowEditPatientModal(true) }}>
                                                    Editar e visualizar dados do paciente
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Actions / Status Column */}
                                        <div className="w-72 space-y-6 border-l pl-6">
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Status do Atendimento</h3>

                                                <div className="space-y-2">
                                                    {Object.keys(STATUS_CONFIG).map((statusKey) => {
                                                        const key = statusKey as AppointmentStatus
                                                        const config = STATUS_CONFIG[key]
                                                        const Icon = config.icon
                                                        const isActive = selectedAppointment.status === key

                                                        return (
                                                            <button
                                                                key={key}
                                                                onClick={() => handleStatusUpdate(key)}
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
                    </div >
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/5">
                        <CalendarIcon className="h-16 w-16 mb-4 opacity-20" />
                        <h3 className="text-xl font-semibold mb-2">Selecione um Agendamento</h3>
                        <p className="max-w-xs text-center text-sm opacity-70">
                            Clique em um horário na lista à esquerda para ver detalhes e gerenciar o atendimento.
                        </p>
                    </div>
                )
                }
            </Card >

            {/* CREATE APPOINTMENT MODAL OVERLAY */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-lg shadow-2xl border-0 ring-1 ring-white/10">
                            <CardHeader>
                                <CardTitle className="text-xl">Novo Agendamento</CardTitle>
                                <CardDescription>Preencha os dados para criar um novo agendamento.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2 flex flex-col">
                                    <label className="text-sm font-medium">Nome do Paciente</label>
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCombobox}
                                                className="w-full justify-between font-normal"
                                            >
                                                {newAppointment.nome_cliente || "Pesquisar paciente..."}
                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Digite o nome..."
                                                    value={newAppointment.nome_cliente}
                                                    onValueChange={(val) => {
                                                        setNewAppointment(prev => ({ ...prev, nome_cliente: val }))
                                                        handleSearchPatient(val)
                                                    }}
                                                />
                                                <CommandList>
                                                    {patientSuggestions.map((patient, idx) => (
                                                        <CommandItem
                                                            key={`${patient.nome_cliente}-${idx}`}
                                                            onSelect={() => handleSelectPatient(patient)}
                                                        >
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{patient.nome_cliente}</span>
                                                                <span className="text-xs text-muted-foreground">{patient.telefone_cliente || patient.celular_cliente}</span>
                                                            </div>
                                                            <Check
                                                                className={cn(
                                                                    "ml-auto h-4 w-4",
                                                                    newAppointment.nome_cliente === patient.nome_cliente ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                        </CommandItem>
                                                    ))}
                                                    {patientSuggestions.length === 0 && newAppointment.nome_cliente.length > 2 && (
                                                        <div className="p-2 text-sm text-muted-foreground text-center">Nenhum paciente encontrado. Crie um novo.</div>
                                                    )}
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Telefone (Fixo)</label>
                                        <Input
                                            value={newAppointment.telefone_cliente}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, telefone_cliente: e.target.value })}
                                            placeholder="(11) 3333-3333"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Celular (WhatsApp)</label>
                                        <Input
                                            value={newAppointment.celular_cliente}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, celular_cliente: e.target.value })}
                                            placeholder="(11) 99999-9999"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Prontuário</label>
                                        <Input
                                            value={newAppointment.prontuario}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, prontuario: e.target.value })}
                                            placeholder="Nº Prontuário"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Convênio</label>
                                        <Input
                                            value={newAppointment.convenio}
                                            onChange={(e) => setNewAppointment({ ...newAppointment, convenio: e.target.value })}
                                            placeholder="Particular, Unimed..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo de Consulta</label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={newAppointment.tipo_consulta}
                                        onChange={(e) => setNewAppointment({ ...newAppointment, tipo_consulta: e.target.value })}
                                    >
                                        <option value="Particular">Particular</option>
                                        <option value="Retorno">Retorno</option>
                                        <option value="Cortesia">Cortesia</option>
                                    </select>
                                </div>

                                <div className="space-y-4 border p-4 rounded-md">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="proc"
                                            checked={newAppointment.realizou_procedimento}
                                            onCheckedChange={(c) => setNewAppointment({ ...newAppointment, realizou_procedimento: !!c })}
                                        />
                                        <label htmlFor="proc" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            Realizou Procedimento?
                                        </label>
                                    </div>
                                    {newAppointment.realizou_procedimento && (
                                        <div className="animate-in fade-in slide-in-from-top-2">
                                            <label className="text-sm font-medium">Código do Procedimento</label>
                                            <Input
                                                value={newAppointment.codigo_procedimento}
                                                onChange={(e) => setNewAppointment({ ...newAppointment, codigo_procedimento: e.target.value })}
                                                placeholder="Ex: 10101010"
                                            />
                                        </div>
                                    )}
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
                )
            }

            {/* EDIT PATIENT MODAL */}
            {
                showEditPatientModal && editingPatient && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-lg shadow-2xl border-0 ring-1 ring-white/10">
                            <CardHeader>
                                <CardTitle className="text-xl">Editar Dados do Paciente</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 p-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome</label>
                                    <Input
                                        value={editingPatient.nome_cliente}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, nome_cliente: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Telefone (Fixo)</label>
                                        <Input
                                            value={editingPatient.telefone_cliente || ''}
                                            onChange={(e) => setEditingPatient({ ...editingPatient, telefone_cliente: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Celular</label>
                                        <Input
                                            value={editingPatient.celular_cliente || ''}
                                            onChange={(e) => setEditingPatient({ ...editingPatient, celular_cliente: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        value={editingPatient.email_cliente || ''}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, email_cliente: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Prontuário</label>
                                    <Input
                                        value={editingPatient.prontuario || ''}
                                        onChange={(e) => setEditingPatient({ ...editingPatient, prontuario: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 bg-muted/20 py-4">
                                <Button variant="outline" onClick={() => setShowEditPatientModal(false)}>Cancelar</Button>
                                <Button onClick={handleUpdatePatientInfo}>Salvar Dados</Button>
                            </CardFooter>
                        </Card>
                    </div>
                )
            }
        </div >
    )
}
