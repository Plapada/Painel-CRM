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
            "relative overflow-hidden border border-border/50 shadow-sm transition-all duration-300 hover:shadow-md",
            "bg-white dark:bg-zinc-950",
            className
        )}>
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-4">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            {title}
                        </p>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                                {value}
                            </h3>
                            {description && (
                                <p className="text-sm text-muted-foreground font-medium">
                                    {description}
                                </p>
                            )}
                        </div>
                    </div>
                    {Icon && (
                        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                        </div>
                    )}
                </div>
                {/* Visual accent bar at the bottom or side? Image shows mostly clean. */}
                {/* Let's keep it clean as per the image description provided (white, gold icon circle) */}
            </CardContent>
        </Card>
    )
}
