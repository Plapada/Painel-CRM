
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"

interface ElegantStatsCardProps {
    title: string
    value: string
    icon: LucideIcon
    description: string
}

export function ElegantStatsCard({ title, value, icon: Icon, description }: ElegantStatsCardProps) {
    return (
        <Card className="border-0 bg-white dark:bg-black/40 dark:backdrop-blur-xl shadow-2xl hover:shadow-primary/5 transition-all duration-300 group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />

            <CardHeader className="flex flex-row items-center justify-between pb-2 z-10">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative">
                <div className="text-2xl font-playfair font-bold text-foreground">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </CardContent>
        </Card>
    )
}
