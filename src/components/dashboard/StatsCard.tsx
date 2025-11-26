import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
    title: string
    value: string | number
    description?: string
    trend?: string
    trendUp?: boolean
    className?: string
    children?: React.ReactNode
}

export function StatsCard({ title, value, description, trend, trendUp, className, children }: StatsCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {(description || trend) && (
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        {description && <span>{description}</span>}
                        {trend && (
                            <span className={cn("ml-2 font-medium", trendUp ? "text-green-500" : "text-red-500")}>
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
