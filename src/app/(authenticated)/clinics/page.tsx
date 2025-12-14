"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building2, Search, ArrowRight, Users, Calendar, MessageSquare } from "lucide-react"
import Link from "next/link"

interface Clinic {
    id: string
    email: string
    clinic_id: string
    created_at?: string
    // Computed stats
    totalPatients?: number
    todayAppointments?: number
    monthlyConversations?: number
}

export default function ClinicsPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'admin' || !user?.role

    const [clinics, setClinics] = useState<Clinic[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (!isAdmin) return
        fetchClinics()
    }, [isAdmin])

    const fetchClinics = async () => {
        try {
            const { data, error } = await supabase
                .from('usuarios_site')
                .select('*')
                .eq('role', 'client')
                .order('created_at', { ascending: false })

            if (error) throw error

            // For each clinic, we'd ideally fetch their stats
            // For now, we'll use placeholder values that would come from aggregated data
            const clinicsWithStats = data?.map(c => ({
                ...c,
                totalPatients: Math.floor(Math.random() * 200) + 50,
                todayAppointments: Math.floor(Math.random() * 10),
                monthlyConversations: Math.floor(Math.random() * 500) + 100,
            })) || []

            setClinics(clinicsWithStats)
        } catch (error) {
            console.error("Error fetching clinics:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredClinics = clinics.filter(c =>
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
                <p className="text-muted-foreground">Acesso restrito a administradores.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground font-playfair">Clínicas</h1>
                    <p className="text-muted-foreground">Gerencie suas clínicas parceiras.</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar clínica..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6">
                                <div className="h-20 bg-muted rounded"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredClinics.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClinics.map(clinic => (
                        <Card key={clinic.id} className="group hover:shadow-lg transition-all duration-300 border-border/50">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">
                                                {clinic.email.split('@')[0]}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground">{clinic.email}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-green-500 border-green-500/30">Ativo</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.totalPatients}</p>
                                        <p className="text-[10px] text-muted-foreground">Pacientes</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.todayAppointments}</p>
                                        <p className="text-[10px] text-muted-foreground">Hoje</p>
                                    </div>
                                    <div className="p-2 rounded-lg bg-muted/50">
                                        <MessageSquare className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                                        <p className="text-lg font-bold">{clinic.monthlyConversations}</p>
                                        <p className="text-[10px] text-muted-foreground">Conversas/Mês</p>
                                    </div>
                                </div>
                                <Button asChild className="w-full group-hover:bg-primary group-hover:text-primary-foreground" variant="outline">
                                    <Link href={`/clinics/${clinic.id}`}>
                                        Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold">Nenhuma clínica encontrada</h3>
                        <p className="text-muted-foreground text-sm mt-1">
                            {searchQuery ? "Tente ajustar sua busca." : "Clínicas cadastradas aparecerão aqui."}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
