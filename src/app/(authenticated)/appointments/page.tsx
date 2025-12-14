"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { AppointmentScheduler, AvailableDate, TimeSlot } from "@/components/ui/appointment-scheduler"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Calendar, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AppointmentsPage() {
    const { user } = useAuth()
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        if (user?.clinic_id) {
            fetchAppointments()
        }
    }, [user?.clinic_id])

    async function fetchAppointments() {
        if (!user?.clinic_id) {
            setLoading(false)
            return
        }

        console.log("Fetching appointments for clinic:", user.clinic_id)

        const { data, error } = await supabase
            .from('consultas')
            .select('*')
            .eq('clinic_id', user.clinic_id)

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

    // Get dates that have appointments for the current month/year only
    const getAvailableDates = (): AvailableDate[] => {
        const datesWithAppointments = new Set<number>()

        appointments.forEach(app => {
            if (app.data_inicio) {
                const d = new Date(app.data_inicio)
                // Only include if the appointment is in the current viewed month/year
                if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                    datesWithAppointments.add(d.getDate())
                }
            }
        })

        return Array.from(datesWithAppointments).map(date => ({
            date,
            hasSlots: true // We use "hasSlots" to indicate "has appointments"
        }))
    }

    // Filter appointments for selected date to create timeSlots
    const getTimeSlotsForDate = (): TimeSlot[] => {
        return appointments
            .filter(app => {
                if (!app.data_inicio) return false
                const appDate = new Date(app.data_inicio)
                return appDate.getDate() === selectedDate.getDate() &&
                    appDate.getMonth() === selectedDate.getMonth() &&
                    appDate.getFullYear() === selectedDate.getFullYear()
            })
            .map(app => ({
                time: new Date(app.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                available: true,
                data: app
            }))
            .sort((a, b) => a.time.localeCompare(b.time))
    }

    // Get upcoming appointments (next 7 days)
    const getUpcomingAppointments = () => {
        const now = new Date()
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        return appointments
            .filter(app => {
                if (!app.data_inicio) return false
                const appDate = new Date(app.data_inicio)
                return appDate >= now && appDate <= nextWeek
            })
            .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime())
            .slice(0, 5) // Show max 5 upcoming
    }

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
        }
    }

    const handleDateSelect = (day: number) => {
        const newDate = new Date(currentYear, currentMonth, day)
        setSelectedDate(newDate)
    }

    const handleMonthChange = (month: number, year: number) => {
        setCurrentMonth(month)
        setCurrentYear(year)
    }

    const upcomingAppointments = getUpcomingAppointments()

    return (
        <div className="flex flex-col gap-6 p-4">
            <h1 className="text-2xl font-bold">Agendamentos</h1>

            {/* Calendar Section */}
            <div className="w-full">
                <AppointmentScheduler
                    userName="Agenda da Clínica"
                    meetingTitle="Agendamentos"
                    meetingType="Visualização Mensal"
                    duration="-"
                    availableDates={getAvailableDates()}
                    timeSlots={getTimeSlotsForDate()}
                    hideSidebar={true}
                    onDateSelect={handleDateSelect}
                    onMonthChange={handleMonthChange}
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

            {/* Upcoming Appointments Section */}
            <Card className="border-0 bg-card shadow-xl">
                <CardHeader>
                    <CardTitle className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Próximas Consultas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {upcomingAppointments.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            Nenhuma consulta marcada para os próximos 7 dias.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingAppointments.map((apt) => {
                                const aptDate = new Date(apt.data_inicio)
                                return (
                                    <div
                                        key={apt.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => handleAppointmentClick(apt)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/20 text-primary p-2 rounded-lg flex flex-col items-center justify-center min-w-14">
                                                <span className="text-xs font-medium">
                                                    {aptDate.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase()}
                                                </span>
                                                <span className="font-bold text-lg">
                                                    {aptDate.getDate()}
                                                </span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">
                                                    {apt.nome_cliente || "Paciente sem nome"}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>
                                                        {aptDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{apt.tipo_consulta || "Consulta Geral"}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Badge variant={apt.status === 'confirmada' ? 'default' : 'secondary'}>
                                            {apt.status || 'Pendente'}
                                        </Badge>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
