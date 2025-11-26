import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface ElegantStatsCardProps {
    title: string
    value: string | number
    icon?: LucideIcon
    description?: string
    trend?: string
    trendUp?: boolean
    className?: string
    children?: React.ReactNode
}

export function ElegantStatsCard({
    title,
    value,
    icon: Icon,
    description,
    trend,
    trendUp,
    className,
    children
}: ElegantStatsCardProps) {
    return (
        <Card className={cn(
            "relative overflow-hidden border-0 shadow-2xl transition-all duration-300",
            "bg-white dark:bg-black/40 dark:backdrop-blur-xl",
            "before:absolute before:inset-0 before:p-[1px] before:bg-gradient-to-br before:from-black/5 before:via-black/0 before:to-transparent dark:before:from-white/10 dark:before:via-white/5 dark:before:to-transparent before:rounded-xl before:-z-10",
            "after:hidden dark:after:block after:absolute after:inset-0 after:bg-gradient-to-br after:from-amber-500/5 after:via-transparent after:to-transparent after:rounded-xl after:-z-20",
            className
        )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-black dark:text-muted-foreground tracking-wide uppercase">
                    {title}
                </CardTitle>
                {Icon && (
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Icon className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-black dark:text-foreground tracking-tight mt-2">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center text-xs text-black dark:text-muted-foreground mt-3 font-medium">
                        {trend && (
                            <span className={cn(
                                "flex items-center px-2 py-0.5 rounded-full text-[10px] mr-2 border",
                                trendUp
                                    ? "text-emerald-600 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20"
                                    : "text-rose-600 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20"
                            )}>
                                {trend}
                            </span>
                        )}
                        {description && <span>{description}</span>}
                    </div>
                )}
                {children}
            </CardContent>

            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </Card>
    )
}
