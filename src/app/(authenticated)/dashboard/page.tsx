"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ElegantStatsCard } from "@/components/dashboard/ElegantStatsCard"
import {
    ElegantAreaChart,
    ElegantBarChart,
    ElegantDonutChart
} from "@/components/dashboard/ElegantCharts"
import {
    DollarSign,
    Calendar,
    Users,
    TrendingUp,
    Activity,
    Building2,
    MessageSquare,
    ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ClinicStats {
    id: string
    name: string
    email?: string
    username?: string
    totalConversations: number
    todayAppointments: number
    totalPatients: number
}

export default function DashboardPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'

    const [loading, setLoading] = useState(true)

    // Admin stats
    const [clinics, setClinics] = useState<ClinicStats[]>([])
    const [totalClinics, setTotalClinics] = useState(0)
    const [totalConversations, setTotalConversations] = useState(0)
    const [totalAppointments, setTotalAppointments] = useState(0)
    const [totalPatients, setTotalPatients] = useState(0)

    // Charts data
    const [conversationsByClinic, setConversationsByClinic] = useState<any[]>([])
    const [appointmentsByDay, setAppointmentsByDay] = useState<any[]>([])
    const [conversionData, setConversionData] = useState<any[]>([])

    // Client stats
    const [clientStats, setClientStats] = useState({
        todayAppointments: 0,
        totalPatients: 0,
        monthlyConversations: 0,
        avgTicket: 450
    })

    useEffect(() => {
        if (isAdmin) {
            fetchAdminData()
        } else {
            fetchClientData()
        }
    }, [isAdmin, user])

    const fetchAdminData = async () => {
        try {
            setLoading(true)

            // 1. Fetch all client users (clinics)
            const { data: clientUsers, error: clientError } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('role', 'client')

            if (clientError) throw clientError

            const clinicsList: ClinicStats[] = []
            let totalConv = 0
            let totalApt = 0
            let totalPat = 0

            // 2. For each clinic, fetch their stats
            for (const client of clientUsers || []) {
                if (!client.clinic_id) continue

                // Conversations count
                const { count: convCount } = await supabase
                    .from('chats')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', client.clinic_id)

                // Today's appointments
                const today = new Date().toISOString().split('T')[0]
                const { count: aptCount } = await supabase
                    .from('consultas')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', client.clinic_id)
                    .gte('data_inicio', today)

                // Total patients
                const { count: patCount } = await supabase
                    .from('dados_cliente')
                    .select('*', { count: 'exact', head: true })
                    .eq('clinic_id', client.clinic_id)

                const clinicStats: ClinicStats = {
                    id: client.id,
                    name: client.username || client.email?.split('@')[0] || 'Clínica',
                    email: client.email,
                    username: client.username,
                    totalConversations: convCount || 0,
                    todayAppointments: aptCount || 0,
                    totalPatients: patCount || 0
                }

                clinicsList.push(clinicStats)
                totalConv += convCount || 0
                totalApt += aptCount || 0
                totalPat += patCount || 0
            }

            setClinics(clinicsList)
            setTotalClinics(clientUsers?.length || 0)
            setTotalConversations(totalConv)
            setTotalAppointments(totalApt)
            setTotalPatients(totalPat)

            // Prepare chart data
            setConversationsByClinic(
                clinicsList.map(c => ({ name: c.name, value: c.totalConversations }))
            )

            // Conversion funnel (mock based on real patient data)
            setConversionData([
                { name: 'Leads', value: Math.round(totalPat * 1.5) },
                { name: 'Agendados', value: totalApt },
                { name: 'Convertidos', value: totalPat },
            ])

            // Appointments by day (last 7 days)
            const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
            const today = new Date()
            const last7Days = []
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today)
                date.setDate(date.getDate() - i)
                const dayName = days[date.getDay()]
                const dateStr = date.toISOString().split('T')[0]

                // Count appointments for this day across all clinics
                const { count } = await supabase
                    .from('consultas')
                    .select('*', { count: 'exact', head: true })
                    .gte('data_inicio', dateStr)
                    .lt('data_inicio', new Date(date.getTime() + 86400000).toISOString().split('T')[0])

                last7Days.push({ name: dayName, value: count || 0 })
            }
            setAppointmentsByDay(last7Days)

        } catch (error) {
            console.error("Error fetching admin data:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchClientData = async () => {
        if (!user?.clinic_id) {
            setLoading(false)
            return
        }

        try {
            const today = new Date().toISOString().split('T')[0]
            const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

            // Today's appointments
            const { count: aptCount } = await supabase
                .from('consultas')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', user.clinic_id)
                .gte('data_inicio', today)

            // Total patients
            const { count: patCount } = await supabase
                .from('dados_cliente')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', user.clinic_id)

            // Monthly conversations
            const { count: convCount } = await supabase
                .from('chats')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', user.clinic_id)
                .gte('created_at', monthAgo)

            setClientStats({
                todayAppointments: aptCount || 0,
                totalPatients: patCount || 0,
                monthlyConversations: convCount || 0,
                avgTicket: 450
            })
        } catch (error) {
            console.error("Error fetching client data:", error)
        } finally {
            setLoading(false)
        }
    }

    // --- ADMIN VIEW ---
    if (isAdmin) {
        return (
            <div className="space-y-8 p-2 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Painel Administrativo</h1>
                        <Badge className="bg-primary text-primary-foreground">ADMIN</Badge>
                    </div>
                    <p className="text-muted-foreground">Visão global de todas as clínicas gerenciadas.</p>
                </div>

                {/* Admin Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ElegantStatsCard
                        title="Total de Clínicas"
                        value={totalClinics.toString()}
                        icon={Building2}
                        description="Ativas na plataforma"
                    />
                    <ElegantStatsCard
                        title="Total de Pacientes"
                        value={totalPatients.toString()}
                        icon={Users}
                        description="Base global"
                    />
                    <ElegantStatsCard
                        title="Conversas (Total)"
                        value={totalConversations.toString()}
                        icon={MessageSquare}
                        description="Todas as clínicas"
                    />
                    <ElegantStatsCard
                        title="Agendamentos Hoje"
                        value={totalAppointments.toString()}
                        icon={Calendar}
                        description="Em toda a rede"
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ElegantBarChart
                        title="Conversas por Clínica"
                        data={conversationsByClinic.length > 0 ? conversationsByClinic : [{ name: 'Sem dados', value: 0 }]}
                        dataKey="value"
                        color="#d4af37"
                    />
                    <ElegantBarChart
                        title="Agendamentos (Últimos 7 dias)"
                        data={appointmentsByDay.length > 0 ? appointmentsByDay : [{ name: 'Sem dados', value: 0 }]}
                        dataKey="value"
                        color="#10b981"
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        {/* Clinics List Table */}
                        <Card className="border-0 bg-card shadow-xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="text-xl font-medium text-foreground">Clínicas Ativas</CardTitle>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/clinics">Ver Todas</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                                            <tr>
                                                <th className="px-4 py-3">Clínica</th>
                                                <th className="px-4 py-3">Conversas</th>
                                                <th className="px-4 py-3">Pacientes</th>
                                                <th className="px-4 py-3">Hoje</th>
                                                <th className="px-4 py-3">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clinics.length > 0 ? clinics.slice(0, 5).map((clinic) => (
                                                <tr key={clinic.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                                {clinic.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            {clinic.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">{clinic.totalConversations}</td>
                                                    <td className="px-4 py-3">{clinic.totalPatients}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className="border-green-500/30 text-green-500">
                                                            {clinic.todayAppointments} agend.
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Button variant="ghost" size="sm" asChild className="h-8">
                                                            <Link href={`/clinics/${clinic.id}`}>
                                                                Ver <ArrowRight className="ml-1 h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                        {loading ? "Carregando..." : "Nenhuma clínica encontrada."}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <ElegantDonutChart
                        title="Funil de Conversão"
                        data={conversionData.length > 0 ? conversionData : [{ name: 'Sem dados', value: 1 }]}
                    />
                </div>
            </div>
        )
    }

    // --- CLIENT VIEW ---
    return (
        <div className="space-y-8 p-2 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Visão Geral</h1>
                <p className="text-muted-foreground">Bem-vindo ao CRM Elegance.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ElegantStatsCard
                    title="Agendamentos Hoje"
                    value={clientStats.todayAppointments.toString()}
                    icon={Calendar}
                    description="Consultas marcadas"
                />
                <ElegantStatsCard
                    title="Total de Pacientes"
                    value={clientStats.totalPatients.toString()}
                    icon={Users}
                    description="Base de cadastros"
                />
                <ElegantStatsCard
                    title="Conversas (Mês)"
                    value={clientStats.monthlyConversations.toString()}
                    icon={MessageSquare}
                    description="Últimos 30 dias"
                />
                <ElegantStatsCard
                    title="Ticket Médio"
                    value={`R$ ${clientStats.avgTicket}`}
                    icon={DollarSign}
                    description="Estimado"
                />
            </div>

            <Card className="border-0 bg-card shadow-xl">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Activity className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold">Dados em tempo real</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                        Suas estatísticas são atualizadas automaticamente.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
