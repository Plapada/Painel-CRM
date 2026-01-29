
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
        <Card className="
            border-2 border-gray-200 dark:border-slate-700
            bg-white dark:bg-slate-800
            shadow-md hover:shadow-lg 
            transition-all duration-300 
            group overflow-hidden relative
        ">
            {/* Subtle accent line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500" />

            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 z-10">
                <CardTitle className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
                    {title}
                </CardTitle>
                <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative pt-2">
                <div className="text-3xl font-bold text-black dark:text-white font-playfair">
                    {value}
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 font-medium">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}
