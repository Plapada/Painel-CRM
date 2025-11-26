"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, MessageSquare, User, Tag, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    const [clientId, setClientId] = useState<string | null>(null)
    const [client, setClient] = useState<any>(null)
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        async function unwrapParams() {
            const resolvedParams = await Promise.resolve(params)
            setClientId(resolvedParams.id)
        }
        unwrapParams()
    }, [params])

    useEffect(() => {
        if (clientId) {
            console.log("Fetching client details for ID:", clientId)
            fetchClientData()
        }
    }, [clientId])

    async function fetchClientData() {
        if (!clientId) return

        try {
            setLoading(true)
            setError(null)
            console.log("Fetching client from Supabase with ID:", clientId)

            // 1. Fetch Client Details
            const { data: clientData, error: clientError } = await supabase
                .from('dados_cliente')
                .select('*')
                .eq('id', clientId)
                .single()

            if (clientError) {
                console.error("Error fetching client:", clientError)
                throw new Error(`Erro ao buscar cliente: ${clientError.message}`)
            }

            if (!clientData) {
                throw new Error("Cliente não encontrado")
            }

            console.log("Client fetched successfully:", clientData)
            setClient(clientData)

            if (clientData) {
                // 2. Fetch Appointments
                // Try to match by phone OR name
                let query = supabase
                    .from('consultas')
                    .select('*')
                    .eq('clinic_id', clientData.clinic_id)

                const { data: allApps, error: appError } = await query

                if (appError) {
                    console.error("Error fetching appointments:", appError)
                }

                if (allApps) {
                    const clientApps = allApps.filter(app => {
                        const phoneMatch = clientData.telefone && app.telefone_cliente && app.telefone_cliente.includes(clientData.telefone)
                        const nameMatch = (app.nome_cliente && clientData.nomewpp && app.nome_cliente.toLowerCase().includes(clientData.nomewpp.toLowerCase())) ||
                            (app.nome_cliente && clientData.nome && app.nome_cliente.toLowerCase().includes(clientData.nome.toLowerCase()))
                        return phoneMatch || nameMatch
                    })
                    setAppointments(clientApps)
                }

            }
        } catch (err: any) {
            console.error("Error fetching client data:", err)
            setError(err.message || "Erro ao carregar dados do cliente")
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center h-full gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Carregando detalhes do cliente...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-8 text-center">
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => router.back()}>Voltar</Button>
            </div>
        )
    }

    if (!client) {
        return (
            <div className="p-8 text-center">
                <p className="text-muted-foreground mb-4">Cliente não encontrado.</p>
                <Button onClick={() => router.back()}>Voltar</Button>
            </div>
        )
    }


    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{client.nomewpp || client.nome || 'Sem Nome'}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{client.telefone}</span>
                            {client.email && <span>• {client.email}</span>}
                        </div>
                    </div>
                </div>
                <div className="ml-auto flex gap-2">
                    <Badge variant="outline" className="text-sm py-1 px-3">
                        {client.etapa_funil || 'Sem Etapa'}
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                <TabsList>
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="flex-1 overflow-y-auto py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5" /> Informações Pessoais
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Nome WhatsApp</label>
                                        <div className="text-sm">{client.nomewpp || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                                        <div className="text-sm">{client.telefone || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                                        <div className="text-sm">{client.email || '-'}</div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Origem</label>
                                        <div><Badge variant="secondary">{client.origem || 'Desconhecida'}</Badge></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Tag className="h-5 w-5" /> Status e IA
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Etapa do Funil</label>
                                    <div className="mt-1 text-sm">{client.etapa_funil || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status IA</label>
                                    <div className="mt-1 text-sm">{client.atendimento_ia || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Resumo da Conversa</label>
                                    <div className="mt-1 p-3 bg-muted/30 rounded-md text-sm">
                                        {client.resumo_conversa || 'Nenhum resumo disponível.'}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>


                <TabsContent value="appointments" className="flex-1 overflow-y-auto py-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5" /> Histórico de Agendamentos
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {appointments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">Nenhum agendamento encontrado.</p>
                            ) : (
                                <div className="space-y-4">
                                    {appointments.map((app) => (
                                        <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Clock className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{app.tipo_consulta || "Consulta"}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(app.data_inicio).toLocaleDateString()} às {new Date(app.data_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={app.status === 'confirmada' ? 'default' : 'secondary'}>
                                                {app.status || 'Pendente'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
