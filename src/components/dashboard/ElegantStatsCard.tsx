
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
            border border-slate-200 dark:border-slate-700
            bg-gradient-to-br from-white to-slate-50 
            dark:from-slate-800 dark:to-slate-900
            shadow-lg hover:shadow-xl 
            transition-all duration-300 
            group overflow-hidden relative
        ">
            {/* Accent Corner */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-500/20 to-transparent rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-125" />

            <CardHeader className="flex flex-row items-center justify-between pb-2 z-10">
                <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
                    {title}
                </CardTitle>
                <div className="p-2.5 bg-amber-500 rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                    <Icon className="h-5 w-5 text-white" />
                </div>
            </CardHeader>
            <CardContent className="z-10 relative pt-2">
                <div className="text-3xl font-bold text-slate-900 dark:text-white font-playfair">
                    {value}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                    {description}
                </p>
            </CardContent>
        </Card>
    )
}
