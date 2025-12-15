"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { ArrowLeft, Calendar, MessageSquare, User, Tag, Clock, Loader2, Sparkles, FileText, Target, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { useAuth } from "@/lib/auth-context"

export default function ClientDetailsPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    const { user } = useAuth()
    const [clientId, setClientId] = useState<string | null>(null)
    const [client, setClient] = useState<any>(null)
    const [appointments, setAppointments] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    // Summary feature state
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [summaryData, setSummaryData] = useState<string | null>(null)
    const [showSummaryModal, setShowSummaryModal] = useState(false)
    const [summaryError, setSummaryError] = useState<string | null>(null)

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

    // Parse summary into sections
    const parseSummary = (text: string) => {
        const sections: { title: string; content: string; icon: 'target' | 'alert' | 'file' }[] = []

        // Extract Queixa Principal
        const queixaMatch = text.match(/🎯\s*Queixa Principal[:\s]*([^-]+?)(?=-{2,}|🚧|📝|$)/i)
        if (queixaMatch) {
            sections.push({
                title: 'Queixa Principal',
                content: queixaMatch[1].trim(),
                icon: 'target'
            })
        }

        // Extract Objeções e Hesitações
        const objecoesMatch = text.match(/🚧\s*Objeções e Hesitações[:\s]*([^-]+?)(?=-{2,}|📝|$)/i)
        if (objecoesMatch) {
            sections.push({
                title: 'Objeções e Hesitações',
                content: objecoesMatch[1].trim(),
                icon: 'alert'
            })
        }

        // Extract Resumo da Interação
        const resumoMatch = text.match(/📝\s*\*?Resumo da Interação[:\s]*([\s\S]+)/i)
        if (resumoMatch) {
            sections.push({
                title: 'Resumo da Interação',
                content: resumoMatch[1].replace(/-{2,}/g, '').trim(),
                icon: 'file'
            })
        }

        // If no sections parsed, return the raw text
        if (sections.length === 0) {
            sections.push({
                title: 'Resumo',
                content: text,
                icon: 'file'
            })
        }

        return sections
    }

    // Handle summarize conversation
    const handleSummarizeConversation = async () => {
        if (!client?.telefone || !user?.clinic_id) {
            setSummaryError('Cliente sem telefone registrado.')
            return
        }

        setIsSummarizing(true)
        setSummaryError(null)

        try {
            const response = await fetch('https://ia-n8n.jje6ux.easypanel.host/webhook/webhookresumirconversas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telefone: client.telefone,
                    clinic_id: user.clinic_id
                })
            })

            if (!response.ok) {
                throw new Error('Falha ao resumir conversa')
            }

            const data = await response.text()
            setSummaryData(data)
            setShowSummaryModal(true)
        } catch (error: any) {
            console.error('Error summarizing conversation:', error)
            setSummaryError(error.message || 'Erro ao resumir conversa.')
        } finally {
            setIsSummarizing(false)
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

                                {/* Summarize Button */}
                                <div className="pt-3 border-t">
                                    <Button
                                        onClick={handleSummarizeConversation}
                                        disabled={isSummarizing}
                                        className="w-full"
                                        variant="outline"
                                    >
                                        {isSummarizing ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Resumindo...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Gerar Resumo da Conversa
                                            </>
                                        )}
                                    </Button>
                                    {summaryError && (
                                        <p className="text-xs text-destructive mt-2 text-center">{summaryError}</p>
                                    )}
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

            {/* Summary Modal */}
            <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
                <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Resumo da Conversa
                        </DialogTitle>
                        <DialogDescription>
                            Análise gerada por IA da conversa com {client?.nomewpp || client?.nome || 'o cliente'}
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4">
                        {summaryData && (
                            <div className="space-y-4 py-4">
                                {parseSummary(summaryData).map((section, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border bg-card p-4 space-y-2"
                                    >
                                        <div className="flex items-center gap-2">
                                            {section.icon === 'target' && (
                                                <div className="p-1.5 rounded-full bg-blue-500/10">
                                                    <Target className="h-4 w-4 text-blue-500" />
                                                </div>
                                            )}
                                            {section.icon === 'alert' && (
                                                <div className="p-1.5 rounded-full bg-amber-500/10">
                                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                </div>
                                            )}
                                            {section.icon === 'file' && (
                                                <div className="p-1.5 rounded-full bg-green-500/10">
                                                    <FileText className="h-4 w-4 text-green-500" />
                                                </div>
                                            )}
                                            <h4 className="font-semibold text-sm">{section.title}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {section.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSummaryModal(false)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
