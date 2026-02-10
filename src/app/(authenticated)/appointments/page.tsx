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
    Trash2,
    Pencil,
    UserPlus
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { PatientSearch } from "@/components/patient-search"
import { Patient } from "@/app/actions/get-patients"
import { getProcedures, Procedure } from "@/app/actions/procedures"
import { Checkbox } from "@/components/ui/checkbox"
import { Check } from "lucide-react"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

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
    procedimento_id?: string | null // Added
    valor?: number // Added
}

const STATUS_CONFIG: Record<AppointmentStatus | 'confirmada', { label: string, color: string, icon: any }> = {
    'pendente': { label: 'Pendente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
    'confirmado': { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
    'confirmada': { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 }, // Legacy support
    'compareceu': { label: 'Compareceu', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: MapPin },
    'em_atendimento': { label: 'Em Atendimento', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400', icon: PlayCircle },
    'finalizado': { label: 'Finalizado', color: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100', icon: CheckSquare },
    'atrasado': { label: 'Atrasado', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle },
    'faltou': { label: 'Faltou', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
    'cancelada': { label: 'Cancelada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
}

import { Suspense } from "react"

function AppointmentsContent() {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

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
        procedimento_id: string | null
        valor: number
    }>({
        nome_cliente: '',
        telefone_cliente: '',
        celular_cliente: '',
        email_cliente: '',
        tipo_consulta: 'Consulta', // Default to Consulta
        data_inicio: new Date().toISOString().split('T')[0],
        hora_inicio: '09:00',
        observacoes: '',
        convenio: 'Particular', // Default to Particular
        prontuario: '',
        realizou_procedimento: false,
        codigo_procedimento: '',
        procedimento_id: null as string | null,
        valor: 0
    })

    // New Patient Creation Mode
    const [isCreatingNewPatient, setIsCreatingNewPatient] = useState(false)
    const [newPatientData, setNewPatientData] = useState({ nome: '', telefone: '', celular: '' })

    // Edit Appointment Modal State
    const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false)
    const [editingAppointmentData, setEditingAppointmentData] = useState<{
        data_inicio: string
        hora_inicio: string
        tipo_consulta: string
        procedimento_id: string | null
        valor: number
        observacoes: string
        convenio: string
    } | null>(null)

    // Procedure State
    const [procedures, setProcedures] = useState<Procedure[]>([])
    const [isLoadingProcedures, setIsLoadingProcedures] = useState(false)

    useEffect(() => {
        if ((showCreateModal || showEditAppointmentModal) && user?.clinic_id) {
            setIsLoadingProcedures(true)
            getProcedures(user.clinic_id).then(data => {
                setProcedures(data)
                setIsLoadingProcedures(false)
            })
        }
    }, [showCreateModal, showEditAppointmentModal, user?.clinic_id])

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

    // Alert Dialog State
    const [alertConfig, setAlertConfig] = useState<{
        isOpen: boolean
        title: string
        description: string
        actionLabel: string
        onConfirm: () => void
        variant?: 'default' | 'destructive'
    }>({ isOpen: false, title: '', description: '', actionLabel: '', onConfirm: () => { } })

    // Reschedule Dialog State
    const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
    const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' })

    // Finish Appointment Modal State
    const [showFinishModal, setShowFinishModal] = useState(false)
    const [finishingAppointment, setFinishingAppointment] = useState<Appointment | null>(null)
    const [selectedProcedureBtn, setSelectedProcedureBtn] = useState<string | null>(null)

    // Generated Time Slots (08:00 to 20:00, 30min steps)
    const timeSlots = Array.from({ length: 25 }, (_, i) => {
        const totalMinutes = 8 * 60 + i * 30 // Start 08:00
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
    })

    // 40min Overdue Notification
    useEffect(() => {
        const checkOverdue = () => {
            const now = new Date()
            appointments.forEach(apt => {
                if (['finalizado', 'cancelada', 'faltou'].includes(apt.status)) return

                const aptTime = new Date(apt.data_inicio)
                const diffMs = now.getTime() - aptTime.getTime()
                const diffMins = Math.floor(diffMs / 60000)

                if (diffMins >= 40 && diffMins < 45) { // Notify once in this window
                    notify.warning(`A consulta de ${apt.nome_cliente} excedeu 40 minutos.`, "Consulta Atrasada")
                }
            })
        }

        const interval = setInterval(checkOverdue, 60000) // Check every minute
        return () => clearInterval(interval)
    }, [appointments])

    // Fetch Appointments
    useEffect(() => {
        if (user?.clinic_id) {
            fetchAppointments()
            fetchMonthBookings()
        }
    }, [user?.clinic_id, selectedDate])

    // Check for query params to pre-fill and open modal
    useEffect(() => {
        const patientName = searchParams.get('patientName')
        if (patientName) {
            setNewAppointment(prev => ({
                ...prev,
                nome_cliente: patientName,
                telefone_cliente: searchParams.get('patientPhone') || '',
                // Add other fields if needed, e.g. email, etc. if passed
            }))
            setShowCreateModal(true)
        }
    }, [searchParams])

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

        // Intercept 'finalizado' to show modal
        if (newStatus === 'finalizado') {
            setFinishingAppointment(selectedAppointment)
            setShowFinishModal(true)
            return
        }

        updateAppointmentStatus(selectedAppointment.id, newStatus)
    }

    const updateAppointmentStatus = async (id: number, status: AppointmentStatus) => {
        if (!selectedAppointment) return

        // Specific handling for 'finalizado' if coming via direct update (unlikely path now but safe)
        // or other statuses

        // Optimistically update
        const updatedApp = { ...selectedAppointment, status }
        setSelectedAppointment(updatedApp)
        setAppointments(prev => prev.map(app => app.id === id ? updatedApp : app))

        // Save to DB (Auto-save for statuses other than finish?) 
        // Logic below suggests 'Save' button is main, BUT user requested flow suggests direct finish.
        // Let's autosave status change as it is a significant action usually.
        // Original code was local update only. 
        // User request "ao finalizar..." implies action. 

        // Let's implement direct save for status changes to be improved UX
        try {
            const { error } = await supabase
                .from('consultas')
                .update({ status })
                .eq('id', id)

            if (error) {
                notify.error('Erro ao atualizar status')
                fetchAppointments() // Revert
            } else {
                notify.success(`Status atualizado para ${STATUS_CONFIG[status].label}`)
            }
        } catch (e) {
            console.error(e)
        }
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

        setAlertConfig({
            isOpen: true,
            title: "Cancelar Agendamento",
            description: `Deseja realmente CANCELAR o agendamento de ${selectedAppointment.nome_cliente}? Esta ação alterará o status para 'Cancelada'.`,
            actionLabel: "Sim, Cancelar",
            variant: 'destructive',
            onConfirm: async () => {
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
                } finally {
                    setAlertConfig(prev => ({ ...prev, isOpen: false }))
                }
            }
        })
    }

    const handleDeleteAppointment = async () => {
        if (!selectedAppointment) return

        setAlertConfig({
            isOpen: true,
            title: "Excluir Agendamento",
            description: `Deseja realmente EXCLUIR o agendamento de ${selectedAppointment.nome_cliente}? Esta ação é IRREVERSÍVEL.`,
            actionLabel: "Sim, Excluir",
            variant: 'destructive',
            onConfirm: async () => {
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
                } finally {
                    setAlertConfig(prev => ({ ...prev, isOpen: false }))
                }
            }
        })
    }



    // --- Autocomplete Logic ---
    const handleSelectPatient = (patient: Patient) => {
        setNewAppointment(prev => ({
            ...prev,
            nome_cliente: patient.nome,
            telefone_cliente: patient.telefone || '',
            celular_cliente: patient.telefone || '', // Assuming telefone is mobile or similar
            email_cliente: patient.email || '',
            prontuario: patient.prontuario || '',
            convenio: patient.convenio || '',
        }))
    }

    // --- Create New Patient from Search ---
    const handleCreateNewPatient = (name: string) => {
        setNewAppointment(prev => ({
            ...prev,
            nome_cliente: name,
            telefone_cliente: '',
            celular_cliente: '',
            email_cliente: '',
        }))
        notify.info(`Novo paciente: ${name}. Preencha os dados abaixo.`)
    }

    // --- Open Edit Appointment Modal ---
    const handleOpenEditAppointment = () => {
        if (!selectedAppointment) return
        setEditingAppointmentData({
            data_inicio: selectedAppointment.data_inicio.split('T')[0],
            hora_inicio: new Date(selectedAppointment.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
            tipo_consulta: selectedAppointment.tipo_consulta || 'Consulta',
            procedimento_id: null, // Would need to be fetched from appointment if stored
            valor: 0, // Would need to be fetched from appointment if stored
            observacoes: selectedAppointment.observacoes || '',
            convenio: selectedAppointment.convenio || ''
        })
        setShowEditAppointmentModal(true)
    }

    // --- Save Edit Appointment ---
    const handleSaveEditAppointment = async () => {
        if (!selectedAppointment || !editingAppointmentData) return
        setIsSaving(true)

        try {
            // Subtract 3 hours to compensate for Brazil timezone (UTC-3)
            const localDateTime = new Date(`${editingAppointmentData.data_inicio}T${editingAppointmentData.hora_inicio}:00`)
            localDateTime.setHours(localDateTime.getHours() - 3)
            const newDateTime = localDateTime.toISOString()
            const { error } = await supabase
                .from('consultas')
                .update({
                    data_inicio: newDateTime,
                    tipo_consulta: editingAppointmentData.tipo_consulta,
                    observacoes: editingAppointmentData.observacoes,
                    procedimento_id: editingAppointmentData.procedimento_id,
                    valor: editingAppointmentData.valor,
                    convenio: editingAppointmentData.convenio
                })
                .eq('id', selectedAppointment.id)

            if (error) throw error

            notify.success("Agendamento atualizado!")
            fetchAppointments()
            setShowEditAppointmentModal(false)
            setSelectedAppointment(null)
        } catch (error) {
            console.error("Error updating appointment:", error)
            notify.error("Erro ao atualizar agendamento.")
        } finally {
            setIsSaving(false)
        }
    }


    const handleCreateAppointment = async () => {
        if (!user?.clinic_id || !newAppointment.nome_cliente) {
            notify.warning("Nome do cliente é obrigatório.")
            return
        }
        if (!newAppointment.tipo_consulta) {
            notify.warning("Tipo de consulta é obrigatório.")
            return
        }
        setIsCreating(true)

        try {
            const startDateTime = new Date(`${newAppointment.data_inicio}T${newAppointment.hora_inicio}:00`)
            // Subtract 3 hours to compensate for Brazil timezone (UTC-3)
            startDateTime.setHours(startDateTime.getHours() - 3)
            const endDateTime = new Date(startDateTime.getTime() + 30 * 60000) // Default 30 min duration

            // Check for existing appointments at the same time
            const { data: existingAppointments, error: checkError } = await supabase
                .from('consultas')
                .select('id')
                .eq('clinic_id', user.clinic_id)
                .eq('data_inicio', startDateTime.toISOString())
                .neq('status', 'cancelado')
                .limit(1)

            if (checkError) throw checkError

            if (existingAppointments && existingAppointments.length > 0) {
                notify.warning("Já existe um agendamento neste horário. Escolha outro horário.")
                setIsCreating(false)
                return
            }

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
                codigo_procedimento: newAppointment.realizou_procedimento ? newAppointment.codigo_procedimento : null,
                procedimento_id: newAppointment.procedimento_id,
                valor: newAppointment.valor
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
                tipo_consulta: 'Consulta',
                data_inicio: new Date().toISOString().split('T')[0],
                hora_inicio: '09:00',
                observacoes: '',
                convenio: 'Particular',
                prontuario: '',
                realizou_procedimento: false,
                codigo_procedimento: '',
                procedimento_id: null,
                valor: 0
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
        if (!selectedAppointment) return
        setRescheduleData({
            date: selectedAppointment.data_inicio.split('T')[0],
            time: new Date(selectedAppointment.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        })
        setShowRescheduleDialog(true)
    }



    const confirmReschedule = async () => {
        if (!selectedAppointment || !rescheduleData.date || !rescheduleData.time) return

        try {
            // Subtract 3 hours to compensate for Brazil timezone (UTC-3)
            const localDateTime = new Date(`${rescheduleData.date}T${rescheduleData.time}:00`)
            localDateTime.setHours(localDateTime.getHours() - 3)
            const newDateTime = localDateTime.toISOString()
            const { error } = await supabase
                .from('consultas')
                .update({ data_inicio: newDateTime })
                .eq('id', selectedAppointment.id)

            if (!error) {
                notify.success("Reagendado com sucesso!")
                fetchAppointments() // Refetch to sort/move
                setSelectedAppointment(null)
                setShowRescheduleDialog(false)
            } else {
                throw error
            }
        } catch (err) {
            console.error(err)
            notify.error("Erro ao reagendar.")
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
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleOpenEditAppointment}
                                            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                        >
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Editar Agendamento
                                        </Button>
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

                                                <Button variant="secondary" size="sm" className="w-full text-xs" onClick={() => { setEditingPatient(selectedAppointment); setShowEditPatientModal(true) }}>
                                                    ✏️ Editar dados do paciente
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
            {/* New Appointment Modal */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Novo Agendamento</DialogTitle>
                        <DialogDescription>
                            Preencha os detalhes para agendar.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="patient" className="text-sm font-medium">Paciente</Label>
                            <PatientSearch
                                onSelect={handleSelectPatient}
                                clinicId={user?.clinic_id}
                                onCreateNew={handleCreateNewPatient}
                            />
                            {newAppointment.nome_cliente && (
                                <div className="text-xs text-muted-foreground mt-1">
                                    Selecionado: {newAppointment.nome_cliente}
                                </div>
                            )}
                        </div>

                        {/* Fallback Manual Input if needed or for editing after selection */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phone" className="text-sm font-medium">Telefone</Label>
                                <Input
                                    id="phone"
                                    value={newAppointment.telefone_cliente}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, telefone_cliente: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="type" className="text-sm font-medium">Tipo</Label>
                                <Select
                                    value={newAppointment.tipo_consulta}
                                    onValueChange={(val) => setNewAppointment({ ...newAppointment, tipo_consulta: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Consulta">Consulta</SelectItem>
                                        <SelectItem value="Retorno">Retorno</SelectItem>
                                        <SelectItem value="Procedimento">Procedimento</SelectItem>
                                        <SelectItem value="Exame">Exame</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* PROCEDURES SELECTOR */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="procedure" className="text-sm font-medium">Procedimento (Opcional)</Label>
                                <Select
                                    value={newAppointment.procedimento_id || "none"}
                                    onValueChange={(val) => {
                                        if (val === "none") {
                                            setNewAppointment({ ...newAppointment, procedimento_id: null, valor: 0 })
                                        } else {
                                            const proc = procedures.find(p => p.id === val)
                                            setNewAppointment({
                                                ...newAppointment,
                                                procedimento_id: val,
                                                valor: proc ? Number(proc.valor) : newAppointment.valor
                                                // Note: tipo_consulta is now independent - user can select both
                                            })
                                        }
                                    }}
                                    disabled={isLoadingProcedures}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={isLoadingProcedures ? "Carregando..." : "Selecione..."} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {procedures.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.nome} - R$ {Number(p.valor).toFixed(2)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="valor" className="text-sm font-medium">Valor (R$)</Label>
                                <Input
                                    id="valor"
                                    type="number"
                                    value={newAppointment.valor || ''}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, valor: parseFloat(e.target.value) })}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="date" className="text-sm font-medium">Data</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={newAppointment.data_inicio}
                                    onChange={(e) => setNewAppointment({ ...newAppointment, data_inicio: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time" className="text-sm font-medium">Hora</Label>
                                <Select
                                    value={newAppointment.hora_inicio}
                                    onValueChange={(val) => setNewAppointment({ ...newAppointment, hora_inicio: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione horrio" />
                                    </SelectTrigger>
                                    <SelectContent className="h-48">
                                        {timeSlots.map(time => (
                                            <SelectItem key={time} value={time}>{time}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="obs" className="text-sm font-medium">Observações</Label>
                            <Input
                                id="obs"
                                value={newAppointment.observacoes}
                                onChange={(e) => setNewAppointment({ ...newAppointment, observacoes: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="convenio" className="text-sm font-medium">Convênio</Label>
                            <Input
                                id="convenio"
                                value={newAppointment.convenio}
                                onChange={(e) => setNewAppointment({ ...newAppointment, convenio: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
                        <Button onClick={handleCreateAppointment} disabled={isCreating}>
                            {isCreating ? "Criando..." : "Agendar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
            {/* ALERT DIALOG SYSTEM */}
            <AlertDialog open={alertConfig.isOpen} onOpenChange={(open) => setAlertConfig(prev => ({ ...prev, isOpen: open }))}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{alertConfig.title}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {alertConfig.description}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={alertConfig.onConfirm}
                            className={cn(alertConfig.variant === 'destructive' && "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                        >
                            {alertConfig.actionLabel}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* RESCHEDULE MODAL */}
            {
                showRescheduleDialog && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <Card className="w-full max-w-sm shadow-2xl border-0 ring-1 ring-white/10">
                            <CardHeader>
                                <CardTitle className="text-lg">Reagendar Atendimento</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nova Data</label>
                                    <Input
                                        type="date"
                                        value={rescheduleData.date}
                                        onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Novo Horário</label>
                                    <Select
                                        value={rescheduleData.time}
                                        onValueChange={(val) => setRescheduleData({ ...rescheduleData, time: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] z-[99999]">
                                            {timeSlots.map(time => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 bg-muted/20 py-4">
                                <Button variant="outline" onClick={() => setShowRescheduleDialog(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={confirmReschedule}>
                                    Confirmar Reagendamento
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                )
            }

            {/* EDIT APPOINTMENT MODAL */}
            {showEditAppointmentModal && editingAppointmentData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-lg shadow-2xl border-0 ring-1 ring-white/10">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Pencil className="h-5 w-5 text-amber-500" />
                                Editar Agendamento
                            </CardTitle>
                            <CardDescription>
                                Altere os detalhes do agendamento.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Data</Label>
                                    <Input
                                        type="date"
                                        value={editingAppointmentData.data_inicio}
                                        onChange={(e) => setEditingAppointmentData({
                                            ...editingAppointmentData,
                                            data_inicio: e.target.value
                                        })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Horário</Label>
                                    <Select
                                        value={editingAppointmentData.hora_inicio}
                                        onValueChange={(val) => setEditingAppointmentData({
                                            ...editingAppointmentData,
                                            hora_inicio: val
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[200px] z-[99999]">
                                            {timeSlots.map(time => (
                                                <SelectItem key={time} value={time}>{time}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Tipo de Consulta</Label>
                                    <Select
                                        value={editingAppointmentData.tipo_consulta}
                                        onValueChange={(val) => setEditingAppointmentData({
                                            ...editingAppointmentData,
                                            tipo_consulta: val
                                        })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione" />
                                        </SelectTrigger>
                                        <SelectContent className="z-[99999]">
                                            <SelectItem value="Consulta">Consulta</SelectItem>
                                            <SelectItem value="Retorno">Retorno</SelectItem>
                                            <SelectItem value="Procedimento">Procedimento</SelectItem>
                                            <SelectItem value="Exame">Exame</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Procedimento</Label>
                                    <Select
                                        value={editingAppointmentData.procedimento_id || "none"}
                                        onValueChange={(val) => {
                                            if (val === "none") {
                                                setEditingAppointmentData({
                                                    ...editingAppointmentData,
                                                    procedimento_id: null,
                                                    valor: 0
                                                })
                                            } else {
                                                const proc = procedures.find(p => p.id === val)
                                                setEditingAppointmentData({
                                                    ...editingAppointmentData,
                                                    procedimento_id: val,
                                                    valor: proc ? Number(proc.valor) : editingAppointmentData.valor
                                                    // Note: tipo_consulta is now independent - user can select both
                                                })
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="z-[99999]">
                                            <SelectItem value="none">Nenhum</SelectItem>
                                            {procedures.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.nome} - R$ {Number(p.valor).toFixed(2)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Valor (R$)</Label>
                                <Input
                                    type="number"
                                    value={editingAppointmentData.valor || ''}
                                    onChange={(e) => setEditingAppointmentData({
                                        ...editingAppointmentData,
                                        valor: parseFloat(e.target.value) || 0
                                    })}
                                    placeholder="0.00"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Convênio</Label>
                                <Input
                                    value={editingAppointmentData.convenio}
                                    onChange={(e) => setEditingAppointmentData({
                                        ...editingAppointmentData,
                                        convenio: e.target.value
                                    })}
                                    placeholder="Nome do convênio (opcional)"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Observações</Label>
                                <Input
                                    value={editingAppointmentData.observacoes}
                                    onChange={(e) => setEditingAppointmentData({
                                        ...editingAppointmentData,
                                        observacoes: e.target.value
                                    })}
                                    placeholder="Adicione observações..."
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 bg-muted/20 py-4">
                            <Button variant="outline" onClick={() => setShowEditAppointmentModal(false)}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSaveEditAppointment} disabled={isSaving}>
                                {isSaving ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {/* FINISH APPOINTMENT MODAL */}
            {showFinishModal && finishingAppointment && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <Card className="w-full max-w-md shadow-2xl border-0 ring-1 ring-white/10">
                        <CardHeader>
                            <CardTitle>Finalizar Atendimento</CardTitle>
                            <CardDescription>
                                Deseja adicionar um procedimento realizado antes de finalizar?
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedProcedureBtn === 'yes' && (
                                <div className="space-y-2">
                                    <Label>Selecione o Procedimento</Label>
                                    <Select
                                        onValueChange={(val) => {
                                            const proc = procedures.find(p => p.id === val)
                                            if (proc) {
                                                // Update locally to save later
                                                setFinishingAppointment({
                                                    ...finishingAppointment,
                                                    procedimento_id: val,
                                                    valor: Number(proc.valor)
                                                })
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {procedures.map(p => (
                                                <SelectItem key={p.id} value={p.id}>
                                                    {p.nome} - R$ {Number(p.valor).toFixed(2)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 bg-muted/20 py-4">
                            {selectedProcedureBtn !== 'yes' ? (
                                <>
                                    <Button variant="outline" onClick={() => {
                                        // Just finish
                                        updateAppointmentStatus(finishingAppointment.id, 'finalizado')
                                        setShowFinishModal(false)
                                    }}>
                                        Não, apenas finalizar
                                    </Button>
                                    <Button onClick={() => setSelectedProcedureBtn('yes')}>
                                        Sim, adicionar procedimento
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button variant="outline" onClick={() => setShowFinishModal(false)}>Cancelar</Button>
                                    <Button onClick={async () => {
                                        if (finishingAppointment.procedimento_id) {
                                            // 1. Update procedure info
                                            const { error } = await supabase
                                                .from('agendamentos')
                                                .update({
                                                    procedimento_id: finishingAppointment.procedimento_id,
                                                    valor: finishingAppointment.valor,
                                                    realizou_procedimento: true
                                                })
                                                .eq('id', finishingAppointment.id)

                                            if (error) {
                                                notify.error('Erro ao salvar procedimento')
                                                return
                                            }
                                        }
                                        // 2. Finish
                                        updateAppointmentStatus(finishingAppointment.id, 'finalizado')
                                        setShowFinishModal(false)
                                        setSelectedProcedureBtn(null)
                                    }}>
                                        Confirmar e Finalizar
                                    </Button>
                                </>
                            )}
                        </CardFooter>
                    </Card>
                </div>
            )}
        </div >
    )
}

export default function AppointmentsPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Carregando...</div>}>
            <AppointmentsContent />
        </Suspense>
    )
}
