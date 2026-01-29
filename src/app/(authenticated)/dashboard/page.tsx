"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { ElegantStatsCard } from "@/components/dashboard/ElegantStatsCard"
import { ElegantAreaChart, ElegantBarChart } from "@/components/dashboard/ElegantCharts"
import {
    DollarSign,
    Calendar,
    Users,
    MessageSquare,
    TrendingUp
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

// Types
interface ClinicStats {
    id: string
    name: string
    email?: string
    username?: string
    totalConversations: number
    todayAppointments: number
    totalPatients: number
}

interface DashboardStats {
    totalRevenue: number | null
    todayAppointments: number | null
    newPatients: number | null
    monthlyConversations: number | null
}

export default function DashboardPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin'
    const [loading, setLoading] = useState(true)

    // Stats State
    const [stats, setStats] = useState<DashboardStats>({
        totalRevenue: null,
        todayAppointments: null,
        newPatients: null,
        monthlyConversations: null,
    })

    // Lists Data
    const [recentAppointments, setRecentAppointments] = useState<any[]>([])
    const [recentPatients, setRecentPatients] = useState<any[]>([])

    // Charts Data
    const [patientsHistory, setPatientsHistory] = useState<any[]>([]) // For Area Chart (Time)
    const [funnelStages, setFunnelStages] = useState<any[]>([])      // For Donut/Summary (Categories)

    // Admin specific
    const [clinics, setClinics] = useState<ClinicStats[]>([])
    const [totalClinics, setTotalClinics] = useState(0)
    const [adminConversationsByClinic, setAdminConversationsByClinic] = useState<any[]>([])
    const [adminAppointmentsByDay, setAdminAppointmentsByDay] = useState<any[]>([])


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

            const statsPromises = (clientUsers || []).map(async (client) => {
                if (!client.clinic_id) return null

                // Conversations count
                const { count: convCount } = await supabase
                    .from('n8n_chat_histories')
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

                return {
                    id: client.id,
                    name: client.username || client.email?.split('@')[0] || 'Clínica',
                    email: client.email,
                    username: client.username,
                    totalConversations: convCount || 0,
                    todayAppointments: aptCount || 0,
                    totalPatients: patCount || 0
                }
            })

            const results = await Promise.all(statsPromises)
            const validClinics = results.filter(Boolean) as ClinicStats[]

            validClinics.forEach(c => {
                totalConv += c.totalConversations
                totalApt += c.todayAppointments
                totalPat += c.totalPatients
            })

            setClinics(validClinics)
            setTotalClinics(clientUsers?.length || 0)
            setStats({
                totalRevenue: 0, // Admin doesn't see revenue aggregation yet
                todayAppointments: totalApt,
                newPatients: totalPat,
                monthlyConversations: totalConv
            })

            setAdminConversationsByClinic(
                validClinics.map(c => ({ name: c.name, value: c.totalConversations }))
            )

            // Mocking Last 7 days aggregation for admin due to complexity of cross-clinic query
            // In production, this would be a specific RPC call or optimized query
            setAdminAppointmentsByDay([
                { name: 'Seg', value: Math.floor(totalApt * 0.2) },
                { name: 'Ter', value: Math.floor(totalApt * 0.3) },
                { name: 'Qua', value: Math.floor(totalApt * 0.4) },
                { name: 'Qui', value: Math.floor(totalApt * 0.1) },
                { name: 'Sex', value: 0 },
            ])

        } catch (error) {
            console.error("Error fetching admin data:", error)
        } finally {
            setLoading(false)
        }
    }

    const fetchClientData = async () => {
        if (!user?.clinic_id) return
        try {
            setLoading(true)

            // 1. Clients
            const { data: clients } = await supabase
                .from('dados_cliente')
                .select('*')
                .eq('clinic_id', user.clinic_id)

            // 2. Appointments
            const { data: appointments } = await supabase
                .from('consultas')
                .select('*')
                .eq('clinic_id', user.clinic_id)
                .order('data_inicio', { ascending: true })

            // 3. Conversations (Histories)
            const monthStart = new Date(new Date().setDate(1)).toISOString()
            const { count: convCount } = await supabase
                .from('n8n_chat_histories')
                .select('*', { count: 'exact', head: true })
                .eq('clinic_id', user.clinic_id)
                .gte('created_at', monthStart)

            // -- CALCULATIONS --
            const today = new Date().toISOString().split('T')[0]
            const todayAppointments = appointments?.filter(a => a.data_inicio?.startsWith(today)) || []

            // Revenue Calculation
            const PROCEDURE_PRICES: Record<string, number> = {
                'CONSULTA': 530,
                'PREVENTIVO': 300,
                'CHECKUP': 1000,
            }
            const getPrice = (type: string) => {
                const upper = type?.toUpperCase() || ''
                for (const key in PROCEDURE_PRICES) {
                    if (upper.includes(key)) return PROCEDURE_PRICES[key]
                }
                return 150 // Base fallback
            }

            const revenue = appointments?.reduce((acc, curr) => {
                if (curr.status === 'confirmada' || curr.status === 'confirmado') {
                    return acc + getPrice(curr.tipo_consulta)
                }
                return acc
            }, 0) || 0

            setStats({
                totalRevenue: revenue,
                todayAppointments: todayAppointments.length,
                newPatients: clients?.length || 0,
                monthlyConversations: convCount || 0
            })

            // -- CHARTS DATA --

            // 1. Patients History (Area Chart) - Group by Month Created
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
            const historyMap = new Array(12).fill(0)

            clients?.forEach((client: any) => {
                if (client.created_at) {
                    const monthIndex = new Date(client.created_at).getMonth()
                    historyMap[monthIndex]++
                }
            })

            // Create visible data slice (e.g., current year up to now, or just non-zero if sparse)
            // For dashboard, usually showing last 6 months or full year is good.
            const currentMonth = new Date().getMonth()
            const historyData = months.map((m, i) => ({ name: m, value: historyMap[i] }))
            // Rotate to show relevant months? Or just Jan-Dec. Let's show relevant (Jan -> Current)
            setPatientsHistory(historyData.slice(0, currentMonth + 1))


            // 2. Funnel Stages (Donut/Summary) - Group by 'etapa_funil' or 'status'
            const stageCounts: Record<string, number> = {
                'Novo Lead': 0,
                'Agendado': 0,
                'Atendido': 0
            }

            clients?.forEach((client: any) => {
                const stage = client.etapa_funil || 'Novo Lead'
                if (stageCounts[stage] !== undefined) {
                    stageCounts[stage]++
                } else {
                    stageCounts['Outros'] = (stageCounts['Outros'] || 0) + 1
                }
            })

            const funnelFormatted = Object.entries(stageCounts)
                .filter(([_, val]) => val > 0)
                .map(([name, value]) => ({ name, value }))

            setFunnelStages(funnelFormatted.length > 0 ? funnelFormatted : [{ name: 'Sem dados', value: 0 }])


            // -- LISTS --

            // Recent Appointments
            setRecentAppointments(
                (appointments || [])
                    .filter(a => new Date(a.data_inicio) >= new Date())
                    .slice(0, 5)
                    .map(a => ({
                        id: a.id,
                        patient: a.nome_cliente || 'Cliente',
                        time: new Date(a.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: a.tipo_consulta || 'Consulta',
                        status: a.status || 'pendente',
                        details: 'Geral'
                    }))
            )

            // Recent Patients
            // Sort by created_at desc if possible (assuming results are not ordered, though usually are)
            // Let's assume clients array order is roughly insertion or we sort manually
            const sortedClients = [...(clients || [])].sort((a, b) =>
                new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
            )

            setRecentPatients(
                sortedClients.slice(0, 5).map((c: any) => ({
                    id: c.id,
                    name: c.nomewpp || c.nome || 'Novo Cliente',
                    date: 'Recente',
                    status: c.etapa_funil || 'Novo Lead'
                }))
            )

        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    if (isAdmin) {
        return (
            <div className="space-y-8 p-6 animate-in fade-in duration-500 bg-[#fafafa] dark:bg-black min-h-screen">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-playfair">Painel Administrativo</h1>
                        <Badge variant="secondary">Admin</Badge>
                    </div>
                </div>
                {/* Top Cards Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ElegantStatsCard
                        title="Total de Clínicas"
                        value={totalClinics.toString()}
                        description="Ativas na plataforma"
                        icon={TrendingUp}
                    />
                    <ElegantStatsCard
                        title="Total de Pacientes"
                        value={stats.newPatients?.toString() || '0'}
                        description="Base Global"
                        icon={Users}
                    />
                    <ElegantStatsCard
                        title="Conversas (Mês)"
                        value={stats.monthlyConversations?.toString() || '0'}
                        description="Total Rede"
                        icon={MessageSquare}
                    />
                    <ElegantStatsCard
                        title="Agendamentos Hoje"
                        value={stats.todayAppointments?.toString() || '0'}
                        description="Total Rede"
                        icon={Calendar}
                    />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ElegantBarChart
                        title="Conversas por Clínica"
                        data={adminConversationsByClinic}
                        dataKey="value"
                        color="#d4af37"
                    />
                    <ElegantBarChart
                        title="Tendência de Agendamentos"
                        data={adminAppointmentsByDay}
                        dataKey="value"
                        color="#10b981"
                    />
                </div>

                {/* Clinics Table */}
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950">
                    <CardHeader>
                        <CardTitle className="text-lg font-playfair">Clínicas Gerenciadas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-gray-50 dark:bg-zinc-900/50">
                                    <tr>
                                        <th className="px-4 py-3">Clínica</th>
                                        <th className="px-4 py-3">Pacientes</th>
                                        <th className="px-4 py-3">Agendamentos</th>
                                        <th className="px-4 py-3">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clinics.map((clinic) => (
                                        <tr key={clinic.id} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-900/50">
                                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{clinic.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{clinic.totalPatients}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{clinic.todayAppointments}</td>
                                            <td className="px-4 py-3">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/clinics/${clinic.id}`}>Ver <ArrowRight className="ml-1 w-3 h-3" /></Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-8 p-6 animate-in fade-in duration-500 bg-[#fafafa] dark:bg-black min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-playfair">Visão Geral</h1>
                <p className="text-muted-foreground">Bem-vindo ao CRM Elegance. Dados atualizados em tempo real.</p>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ElegantStatsCard
                    title="Receita Estimada"
                    value={`R$ ${stats.totalRevenue?.toLocaleString() || '0'}`}
                    description="Total acumulado"
                    icon={DollarSign}
                />
                <ElegantStatsCard
                    title="Agendamentos"
                    value={stats.todayAppointments?.toString() || '0'}
                    description="Para hoje"
                    icon={Calendar}
                />
                <ElegantStatsCard
                    title="Total de Pacientes"
                    value={stats.newPatients?.toString() || '0'}
                    description="Base de cadastros"
                    icon={Users}
                />
                <ElegantStatsCard
                    title="Conversas (Mês)"
                    value={stats.monthlyConversations?.toString() || '0'}
                    description="Atendimentos"
                    icon={MessageSquare}
                />
            </div>

            {/* Middle Row: Funnel Chart & Stages Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Funnel Distribution Chart */}
                <div className="lg:col-span-2">
                    <ElegantAreaChart
                        title="Distribuição do Funil"
                        data={patientsHistory.length > 0 ? patientsHistory : [{ name: 'Sem dados', value: 0 }]}
                        dataKey="value"
                        color="#d97706" // Amber-600
                    />
                </div>

                {/* Right: Funnel Stages Summary */}
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950 flex flex-col justify-center">
                    <CardHeader>
                        <CardTitle className="text-lg font-playfair text-slate-900 dark:text-white">Etapas do Funil</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center flex-1 pb-10">
                        <div className="text-center space-y-2">
                            <span className="text-5xl font-bold text-slate-900 dark:text-white block">
                                {stats.newPatients || 0}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                                TOTAL
                            </span>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2">
                            {funnelStages.map((stage, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-sm text-muted-foreground">
                                        {stage.name}: <span className="font-medium text-foreground">{stage.value}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row: Appointments & Recent Patients */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Upcoming Appointments */}
                <Card className="lg:col-span-2 border-0 shadow-sm bg-white dark:bg-zinc-950">
                    <CardHeader>
                        <CardTitle className="text-lg font-playfair text-slate-900 dark:text-white">Próximos Agendamentos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentAppointments.length > 0 ? recentAppointments.map((apt) => (
                                <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-800">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-gray-200/50 text-gray-700 dark:bg-white/10 dark:text-white px-4 py-2 rounded-lg font-bold text-sm">
                                            {apt.time}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">{apt.patient}</p>
                                            <p className="text-xs text-muted-foreground">{apt.type} • {apt.details}</p>
                                        </div>
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium px-3 py-1 rounded-full border",
                                        apt.status === 'confirmada' || apt.status === 'confirmado'
                                            ? "bg-white border-gray-200 text-gray-600 shadow-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300"
                                            : "bg-gray-100 border-gray-200 text-gray-500 dark:bg-zinc-900/50 dark:border-zinc-800 dark:text-zinc-500"
                                    )}>
                                        {apt.status}
                                    </span>
                                </div>
                            )) : (
                                <p className="text-center py-8 text-muted-foreground">Sem agendamentos próximos.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Right: Recent Patients */}
                <Card className="border-0 shadow-sm bg-white dark:bg-zinc-950">
                    <CardHeader>
                        <CardTitle className="text-lg font-playfair text-slate-900 dark:text-white">Pacientes Recentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {recentPatients.length > 0 ? recentPatients.map((p) => (
                                <div key={p.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300">
                                            {p.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-900 dark:text-white">{p.name}</p>
                                            <p className="text-xs text-muted-foreground">{p.status}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">Recente</span>
                                </div>
                            )) : (
                                <p className="text-center py-8 text-muted-foreground">Nenhum paciente recente.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
