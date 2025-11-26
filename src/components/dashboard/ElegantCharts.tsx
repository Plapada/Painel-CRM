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
            <div className="rounded-lg border border-border/50 bg-white/90 dark:bg-black/80 backdrop-blur-md p-3 shadow-xl">
                <p className="text-xs font-medium text-black dark:text-gray-400 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span>{entry.name}:</span>
                        <span>{entry.value.toLocaleString()}</span>
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
        <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(128,128,128,0.1)', strokeWidth: 1 }} />
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
}

export function ElegantBarChart({ data, title, dataKey, color = "#3b82f6" }: BarChartProps) {
    return (
        <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[160px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#71717a', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(128,128,128,0.05)' }} />
                            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} barSize={40} />
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

const DEFAULT_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6']

export function ElegantDonutChart({ data, title, colors = DEFAULT_COLORS }: DonutChartProps) {
    return (
        <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl transition-all duration-300">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-foreground">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[160px] w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
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
                        <span className="text-2xl font-bold text-foreground">
                            {data.reduce((acc, curr) => acc + curr.value, 0)}
                        </span>
                        <span className="text-xs text-black dark:text-gray-400 uppercase tracking-wider">Total</span>
                    </div>
                </div>

                {/* Custom Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {data.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="text-xs text-black dark:text-gray-400">{entry.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
