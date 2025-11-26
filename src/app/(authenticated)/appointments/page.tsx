"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { AppointmentScheduler, AvailableDate, TimeSlot } from "@/components/ui/appointment-scheduler"
import { Badge } from "@/components/ui/badge"
import { User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AppointmentsPage() {
    const [date, setDate] = useState<Date>(new Date())
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchAppointments()
    }, [])

    async function fetchAppointments() {
        const sessionStr = localStorage.getItem('crm_session')
        let clinicId = '457e67c0-55ca-456d-8762-cc94df166e6d' // Fallback ID

        if (sessionStr) {
            const session = JSON.parse(sessionStr)
            if (session.clinic_id) clinicId = session.clinic_id
        }

        console.log("Fetching appointments for clinic:", clinicId)

        const { data, error } = await supabase
            .from('consultas')
            .select('*')
            .eq('clinic_id', clinicId)

        if (error) {
            console.error("Error fetching appointments:", error)
        } else {
            console.log("Appointments fetched:", data)
        }

        if (data) {
            setAppointments(data)
        }
        setLoading(false)
    }

    // Map appointments to availableDates (days that have appointments)
    const availableDates: AvailableDate[] = []
    const appointmentsByDate: Record<string, boolean> = {}

    appointments.forEach(app => {
        if (app.data_inicio) {
            const d = new Date(app.data_inicio)
            const dateKey = d.toDateString()
            if (!appointmentsByDate[dateKey]) {
                availableDates.push({
                    date: d.getDate(),
                    hasSlots: true // In this context, "hasSlots" means "has appointments"
                })
                appointmentsByDate[dateKey] = true
            }
        }
    })

    // Filter appointments for selected date to create timeSlots
    const selectedDateAppointments = appointments.filter(app => {
        if (!date || !app.data_inicio) return false
        const appDate = new Date(app.data_inicio)
        return appDate.getDate() === date.getDate() &&
            appDate.getMonth() === date.getMonth() &&
            appDate.getFullYear() === date.getFullYear()
    })

    const timeSlots: TimeSlot[] = selectedDateAppointments.map(app => ({
        time: new Date(app.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        available: true, // Always "available" to be clickable/viewable
        data: app
    })).sort((a, b) => a.time.localeCompare(b.time))

    const router = useRouter()

    const handleAppointmentClick = async (appointment: any) => {
        if (!appointment.telefone_cliente) {
            console.warn("Appointment has no client phone:", appointment)
            return
        }

        // Find client by phone
        const { data: client, error } = await supabase
            .from('dados_cliente')
            .select('id')
            .eq('telefone', appointment.telefone_cliente)
            .single()

        if (client) {
            router.push(`/clients/${client.id}`)
        } else {
            console.warn("Client not found for phone:", appointment.telefone_cliente)
            // Optional: Show toast or alert
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] w-full p-4 gap-4">
            <h1 className="text-2xl font-bold">Agendamentos</h1>
            <div className="flex-1 w-full items-center justify-center">
                <AppointmentScheduler
                    userName="Agenda da Clínica"
                    meetingTitle="Agendamentos"
                    meetingType="Visualização Mensal"
                    duration="-"
                    availableDates={availableDates}
                    timeSlots={timeSlots}
                    hideSidebar={true}
                    onDateSelect={(d) => {
                        const newDate = new Date(date)
                        newDate.setDate(d)
                        setDate(newDate)
                    }}
                    onMonthChange={(m, y) => {
                        const newDate = new Date(date)
                        newDate.setMonth(m)
                        newDate.setFullYear(y)
                        setDate(newDate)
                    }}
                    loading={loading}
                    renderSlot={(slot) => (
                        <div
                            className="flex w-full flex-col gap-1 rounded-lg border bg-card p-3 text-left shadow-sm transition-all hover:bg-accent cursor-pointer"
                            onClick={() => handleAppointmentClick(slot.data)}
                        >
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-primary">{slot.time}</span>
                                <Badge variant={slot.data.status === 'confirmada' ? 'default' : 'secondary'}>
                                    {slot.data.status || 'Pendente'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{slot.data.nome_cliente || "Paciente sem nome"}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {slot.data.tipo_consulta || "Consulta Geral"}
                            </div>
                        </div>
                    )}
                />
            </div>
        </div>
    )
}
