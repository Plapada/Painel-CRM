"use client"

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
    CreditCard
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockDashboardData } from "@/lib/mock-data"

export default function DashboardPage() {
    const stats = mockDashboardData.stats
    const patientsData = mockDashboardData.patientsData
    const originData = mockDashboardData.originData

    return (
        <div className="space-y-8 p-2">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Visão Geral</h1>
                <p className="text-muted-foreground">Bem-vindo ao CRM Elegance. Aqui está o resumo da sua clínica de Neurologia.</p>
            </div>

            {/* Primary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ElegantStatsCard
                    title="Receita Total"
                    value={`R$ ${stats.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    trend="+12%"
                    trendUp={true}
                    description="vs. mês anterior"
                />
                <ElegantStatsCard
                    title="Agendamentos"
                    value={stats.todayAppointments.toString()}
                    icon={Calendar}
                    description="Para hoje"
                />
                <ElegantStatsCard
                    title="Novos Pacientes"
                    value={stats.newPatients.toString()}
                    icon={Users}
                    trend="+5%"
                    trendUp={true}
                    description="Últimos 30 dias"
                />
                <ElegantStatsCard
                    title="Ticket Médio"
                    value={`R$ ${stats.avgTicket.toFixed(0)}`}
                    icon={CreditCard}
                    trend="+8%"
                    trendUp={true}
                />
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column (2/3) */}
                <div className="lg:col-span-2 space-y-8">
                    <ElegantAreaChart
                        title="Crescimento de Pacientes"
                        data={patientsData.labels.map((label: string, i: number) => ({
                            name: label,
                            value: patientsData.data[i]
                        }))}
                        dataKey="value"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ElegantBarChart
                            title="Desempenho da IA"
                            data={mockDashboardData.aiPerformance}
                            dataKey="value"
                            color="#10b981"
                        />
                        <ElegantBarChart
                            title="Custo por Canal"
                            data={mockDashboardData.costPerChannel}
                            dataKey="value"
                            color="#3b82f6"
                        />
                    </div>

                    {/* Recent Appointments Table (New) */}
                    <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-foreground">Próximos Agendamentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockDashboardData.appointments.map((apt) => (
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
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (1/3) */}
                <div className="lg:col-span-1 space-y-8">
                    <ElegantDonutChart
                        title="Origem dos Pacientes"
                        data={originData.labels.map((label: string, i: number) => ({
                            name: label,
                            value: originData.data[i]
                        }))}
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
                        <ElegantStatsCard
                            title="Tempo de Espera"
                            value={`${stats.avgWaitTime} min`}
                            icon={Activity}
                            trend="-2 min"
                            trendUp={true}
                            description="Média recepção"
                        />
                    </div>

                    {/* Recent Patients List (New) */}
                    <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium text-foreground">Pacientes Recentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockDashboardData.recentPatients.map((patient) => (
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
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
