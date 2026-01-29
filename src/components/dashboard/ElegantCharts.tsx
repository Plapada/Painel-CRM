"use client"

import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-xl">
                <p className="text-sm font-bold text-slate-800 dark:text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="font-semibold">{entry.name}:</span>
                        <span className="font-bold">{entry.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null
}

// --- Area Chart ---
interface AreaChartProps {
    data: any[]
    title: string
    dataKey: string
    color?: string
}

export function ElegantAreaChart({ data, title, dataKey, color = "#f59e0b" }: AreaChartProps) {
    return (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[160px] w-full outline-none" tabIndex={-1}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                            <defs>
                                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.3)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(148, 163, 184, 0.3)', strokeWidth: 1 }} />
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill={`url(#gradient-${dataKey})`}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

// --- Bar Chart ---
interface BarChartProps {
    data: any[]
    title: string
    dataKey: string
    color?: string
}

export function ElegantBarChart({ data, title, dataKey, color = "#f59e0b" }: BarChartProps) {
    return (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[160px] w-full outline-none" tabIndex={-1}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.3)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }} />
                            <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}

// --- Donut Chart ---
interface DonutChartProps {
    data: any[]
    title: string
    colors?: string[]
}

// High contrast professional colors
const DEFAULT_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4']

export function ElegantDonutChart({ data, title, colors = DEFAULT_COLORS }: DonutChartProps) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0)

    return (
        <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
            <CardHeader className="border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[180px] w-full flex items-center justify-center relative outline-none" tabIndex={-1}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart style={{ outline: 'none' }}>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={75}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white">
                            {total}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Total
                        </span>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    {data.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
