import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { LucideIcon } from "lucide-react"

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    trend?: string
    trendUp?: boolean
    className?: string
    children?: React.ReactNode
    variant?: 'default' | 'highlight' | 'dark'
    icon?: LucideIcon
}

export function StatsCard({ title, value, description, trend, trendUp, className, children, variant = 'default', icon: Icon }: StatsCardProps) {
    const isHighlight = variant === 'highlight'
    const isDark = variant === 'dark'

    return (
        <Card className={cn(
            "overflow-hidden border-0 shadow-sm transition-all duration-200 hover:shadow-md",
            isHighlight ? "bg-primary text-primary-foreground" :
                isDark ? "bg-zinc-900 text-white border border-zinc-800" :
                    "bg-card text-card-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50",
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn(
                    "text-sm font-medium",
                    isHighlight ? "text-primary-foreground/80" :
                        isDark ? "text-zinc-400" :
                            "text-muted-foreground"
                )}>
                    {title}
                </CardTitle>
                {Icon && (
                    <Icon className={cn(
                        "h-4 w-4",
                        isHighlight ? "text-primary-foreground/80" :
                            isDark ? "text-zinc-400" :
                                "text-muted-foreground"
                    )} />
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <div className={cn(
                        "flex items-center text-xs mt-1",
                        isHighlight ? "text-primary-foreground/70" :
                            isDark ? "text-zinc-500" :
                                "text-muted-foreground"
                    )}>
                        {description && <span>{description}</span>}
                        {trend && (
                            <span className={cn(
                                "ml-2 font-medium",
                                trendUp
                                    ? (isHighlight ? "text-green-900" : "text-emerald-600")
                                    : (isHighlight ? "text-red-900" : "text-red-500")
                            )}>
                                {trend}
                            </span>
                        )}
                    </div>
                )}
                {children}
            </CardContent>
        </Card>
    )
}
