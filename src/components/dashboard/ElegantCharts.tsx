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
import { cn } from "@/lib/utils"

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 shadow-xl">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
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
    className?: string
}

export function ElegantAreaChart({ data, title, dataKey, color = "#FFD700", className }: AreaChartProps) {
    return (
        <Card className={cn("border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow", className)}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <CardTitle className="text-base font-bold text-inherit">{title}</CardTitle>
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
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(113, 113, 122, 0.1)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 500, opacity: 0.7 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 500, opacity: 0.7 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(113, 113, 122, 0.2)', strokeWidth: 1 }} />
                            <Area
                                type="monotone"
                                dataKey={dataKey}
                                stroke={color}
                                strokeWidth={2}
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
    className?: string
}

export function ElegantBarChart({ data, title, dataKey, color = "#FFD700", className }: BarChartProps) {
    return (
        <Card className={cn("border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow", className)}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <CardTitle className="text-base font-bold text-inherit">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="h-[160px] w-full outline-none" tabIndex={-1}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(113, 113, 122, 0.1)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 500, opacity: 0.7 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 500, opacity: 0.7 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(113, 113, 122, 0.05)' }} />
                            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={32} />
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
    className?: string
}

// High contrast professional colors: Yellow, Black, Grey, Light Grey
const DEFAULT_COLORS = ['#FFD700', '#1A1A1A', '#a1a1aa', '#e4e4e7', '#f59e0b', '#52525b']

export function ElegantDonutChart({ data, title, colors = DEFAULT_COLORS, className }: DonutChartProps) {
    const total = data.reduce((acc, curr) => acc + curr.value, 0)

    return (
        <Card className={cn("border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow", className)}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
                <CardTitle className="text-base font-bold text-inherit">{title}</CardTitle>
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
                        <span className="text-3xl font-bold text-inherit">
                            {total}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider opacity-70">
                            Total
                        </span>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-700">
                    {data.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="text-sm font-medium text-inherit opacity-80">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
