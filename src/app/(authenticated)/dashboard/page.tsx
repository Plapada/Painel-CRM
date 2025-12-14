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
    CreditCard,
    Building2,
    ArrowRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DashboardPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || !user?.role // Default to admin for legacy users without role

    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayAppointments: 0,
        newPatients: 0,
        avgTicket: 0,
        patientSatisfaction: 4.9,
        treatmentSuccess: 92,
        avgWaitTime: 12
    })
    const [loading, setLoading] = useState(true)
    const [recentAppointments, setRecentAppointments] = useState<any[]>([])
    const [recentPatients, setRecentPatients] = useState<any[]>([])
    const [funnelData, setFunnelData] = useState<any[]>([])

    // Admin specific states
    const [clinics, setClinics] = useState<any[]>([])
    const [totalClinics, setTotalClinics] = useState(0)

    // Hardcoded for now based on typical interactions
    const aiPerformance = [
        { name: 'Agendamentos', value: 145 },
        { name: 'Dúvidas Clínicas', value: 89 },
        { name: 'Triagem Inicial', value: 210 },
        { name: 'Renovação Receita', value: 65 },
    ]

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                if (isAdmin) {
                    // --- ADMIN VIEW DATA FETCHING ---

                    // 1. Fetch All Clinics (Users with role 'client')
                    const { data: usersData, error: usersError } = await supabase
                        .from('usuarios_site')
                        .select('*')
                        .eq('role', 'client')

                    if (usersError) throw usersError

                    // Mock aggregate data for now as we don't have row-level access to all clinic data yet without backend functions
                    // In a real scenario, we would count *all* appointments from the DB or have a 'stats' view

                    const simulatedClinics = usersData?.map(u => ({
                        id: u.id,
                        name: u.email.split('@')[0], // Placeholder name
                        revenue: Math.floor(Math.random() * 50000) + 10000,
                        activePatients: Math.floor(Math.random() * 200) + 50,
                        status: 'Ativo',
                        lastActive: new Date().toLocaleDateString()
                    })) || []

                    setClinics(simulatedClinics)
                    setTotalClinics(usersData?.length || 0)

                    // Aggregated Stats
                    setStats({
                        totalRevenue: simulatedClinics.reduce((acc, c) => acc + c.revenue, 0),
                        todayAppointments: Math.floor(Math.random() * 50) + 10, // Mock total
                        newPatients: simulatedClinics.reduce((acc, c) => acc + c.activePatients, 0),
                        avgTicket: 450,
                        patientSatisfaction: 4.8,
                        treatmentSuccess: 94,
                        avgWaitTime: 10
                    })

                } else {
                    // --- CLIENT VIEW DATA FETCHING (Existing Logic) ---

                    // 1. Fetch Clients
                    const { data: clients, error: clientError } = await supabase
                        .from('dados_cliente')
                        .select('*')

                    if (clientError) throw clientError

                    // 2. Fetch Appointments
                    const { data: appointments, error: aptError } = await supabase
                        .from('consultas')
                        .select('*')
                        .order('data_inicio', { ascending: true })

                    if (aptError) throw aptError

                    // -- Process Data --
                    const newPatientsCount = clients ? clients.length : 0
                    const today = new Date().toISOString().split('T')[0]
                    const todayAppointmentsCount = appointments ? appointments.filter(a => a.data_inicio?.startsWith(today)).length : 0
                    const confirmedAppointments = appointments ? appointments.filter(a => a.status === 'confirmada').length : 0
                    const estimatedRevenue = confirmedAppointments * 450
                    const avgTicket = 450

                    setStats(prev => ({
                        ...prev,
                        totalRevenue: estimatedRevenue,
                        todayAppointments: todayAppointmentsCount,
                        newPatients: newPatientsCount,
                        avgTicket: avgTicket
                    }))

                    // Recent Appointments
                    const recentAppts = appointments ? appointments
                        .filter(a => new Date(a.data_inicio) >= new Date())
                        .slice(0, 5)
                        .map(a => ({
                            id: a.id,
                            patient: a.nome_cliente || 'Cliente',
                            time: new Date(a.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            type: a.tipo_consulta || 'Consulta',
                            status: a.status || 'Pendente',
                            condition: 'Geral'
                        })) : []
                    setRecentAppointments(recentAppts)

                    // Recent Clients
                    const recentClis = clients ? clients
                        .slice(0, 5)
                        .map((c: any) => ({
                            id: c.id,
                            name: c.nomewpp || 'Novo Cliente',
                            date: 'Recente',
                            condition: c.etapa_funil || 'Novo Lead',
                            status: 'Novo'
                        })) : []
                    setRecentPatients(recentClis)

                    // Funnel
                    const funnelCounts: Record<string, number> = {}
                    clients?.forEach((c: any) => {
                        const stage = c.etapa_funil || 'Sem Etapa'
                        funnelCounts[stage] = (funnelCounts[stage] || 0) + 1
                    })
                    const funnelChartData = Object.entries(funnelCounts).map(([name, value]) => ({ name, value }))
                    setFunnelData(funnelChartData)
                }

            } catch (error) {
                console.error("Error fetching dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [isAdmin])

    if (isAdmin) {
        return (
            <div className="space-y-8 p-2 animate-in fade-in duration-500">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Painel Administrativo</h1>
                    <p className="text-muted-foreground">Visão global de todas as clínicas gerenciadas.</p>
                </div>

                {/* Admin Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <ElegantStatsCard
                        title="Receita Global"
                        value={`R$ ${stats.totalRevenue.toLocaleString()}`}
                        icon={DollarSign}
                        trend="+15%"
                        trendUp={true}
                        description="Todas as clínicas"
                    />
                    <ElegantStatsCard
                        title="Total de Clínicas"
                        value={totalClinics.toString()}
                        icon={Building2}
                        description="Ativas na plataforma"
                    />
                    <ElegantStatsCard
                        title="Total de Pacientes"
                        value={stats.newPatients.toString()}
                        icon={Users}
                        trend="+8%"
                        trendUp={true}
                        description="Base global"
                    />
                    <ElegantStatsCard
                        title="Agendamentos Hoje"
                        value={stats.todayAppointments.toString()}
                        icon={Calendar}
                        trend="+12%"
                        trendUp={true}
                        description="Em toda a rede"
                    />
                </div>

                {/* Clinics List Table */}
                <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xl font-medium text-foreground">Clínicas Ativas</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/clients">Ver Todas</Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-gray-50 dark:bg-white/5">
                                    <tr>
                                        <th className="px-4 py-3">Clínica / Cliente</th>
                                        <th className="px-4 py-3">Receita Mensal</th>
                                        <th className="px-4 py-3">Pacientes Ativos</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clinics.length > 0 ? clinics.map((clinic) => (
                                        <tr key={clinic.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-foreground">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                        {clinic.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    {clinic.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">R$ {clinic.revenue.toLocaleString()}</td>
                                            <td className="px-4 py-3">{clinic.activePatients}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    {clinic.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button variant="ghost" size="sm" asChild className="h-8">
                                                    <Link href={`/dashboard?view_clinic=${clinic.id}`}>
                                                        Acessar <ArrowRight className="ml-2 h-3 w-3" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                                Nenhuma clínica encontrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // --- CLIENT VIEW RENDER (Standard Dashboard) ---
    return (
        <div className="space-y-8 p-2 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Visão Geral</h1>
                <p className="text-muted-foreground">Bem-vindo ao CRM Elegance. Dados atualizados em tempo real.</p>
            </div>

            {/* Primary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ElegantStatsCard
                    title="Receita Estimada"
                    value={`R$ ${stats.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend="+12%"
                    trendUp={true}
                    description="Total acumulado"
                />
                <ElegantStatsCard
                    title="Agendamentos"
                    value={stats.todayAppointments.toString()}
                    icon={Calendar}
                    description="Para hoje"
                />
                <ElegantStatsCard
                    title="Total de Clientes"
                    value={stats.newPatients.toString()}
                    icon={Users}
                    trend="+5%"
                    trendUp={true}
                    description="Base de cadastros"
                />
                <ElegantStatsCard
                    title="Ticket Médio"
                    value={`R$ ${stats.avgTicket.toFixed(0)}`}
                    icon={CreditCard}
                    trend="Estável"
                    trendUp={true}
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Funnel/Clients Chart */}
                    <ElegantBarChart
                        title="Distribuição do Funil"
                        data={funnelData.length > 0 ? funnelData : [{ name: 'Sem dados', value: 0 }]}
                        dataKey="value"
                        color="#d4af37" // Gold color
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ElegantBarChart
                            title="Desempenho da IA"
                            data={aiPerformance}
                            dataKey="value"
                            color="#10b981"
                        />
                        {/* Placeholder for Cost per Channel - keeping mock or static for now as no ad data source */}
                        <ElegantBarChart
                            title="Conversões por Canal"
                            data={[{ name: 'WhatsApp', value: 65 }, { name: 'Instagram', value: 40 }]}
                            dataKey="value"
                            color="#3b82f6"
                        />
                    </div>

                    {/* Recent Appointments Table */}
                    <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-foreground">Próximos Agendamentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentAppointments.length > 0 ? recentAppointments.map((apt) => (
                                    <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/20 text-primary p-3 rounded-lg flex flex-col items-center justify-center w-14 h-14">
                                                <span className="font-bold">{apt.time}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium text-black dark:text-foreground">{apt.patient}</p>
                                                <p className="text-sm text-gray-600 dark:text-muted-foreground">{apt.type} • {apt.condition}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                            {apt.status}
                                        </span>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground text-center py-4">Nenhum agendamento próximo.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (1/3) */}
                <div className="lg:col-span-1 space-y-8">
                    <ElegantDonutChart
                        title="Etapas do Funil"
                        data={funnelData.length > 0 ? funnelData : [{ name: 'Sem dados', value: 1 }]}
                    />

                    {/* Secondary Stats Vertical Stack */}
                    <div className="grid grid-cols-1 gap-6">
                        <ElegantStatsCard
                            title="Satisfação (NPS)"
                            value={stats.patientSatisfaction.toString()}
                            icon={Activity}
                            trend="+0.2"
                            trendUp={true}
                            description="Excelente"
                        />
                        <ElegantStatsCard
                            title="Taxa de Sucesso"
                            value={`${stats.treatmentSuccess}%`}
                            icon={TrendingUp}
                            trend="+2%"
                            trendUp={true}
                            description="Tratamentos"
                        />
                    </div>

                    {/* Recent Patients List */}
                    <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-foreground">Clientes Recentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentPatients.length > 0 ? recentPatients.map((patient) => (
                                    <div key={patient.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                            {patient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-black dark:text-foreground">{patient.name}</p>
                                            <p className="text-xs text-gray-600 dark:text-muted-foreground">{patient.condition}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-500 dark:text-muted-foreground">{patient.date}</span>
                                    </div>
                                )) : (
                                    <p className="text-muted-foreground text-center py-4">Nenhum cliente recente.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
