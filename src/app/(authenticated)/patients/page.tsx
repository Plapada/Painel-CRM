"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Database, MessageCircle, Pause, Play, Sparkles, Loader2, Phone, User } from "lucide-react"
import { getPatients, getWhatsAppPatients, pauseWhatsAppPatient, resumeWhatsAppPatient, type Patient, type WhatsAppPatient } from "@/app/actions/get-patients"
import { useAuth } from "@/lib/auth-context"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PatientsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuth()

    const [activeTab, setActiveTab] = useState<"database" | "whatsapp">("database")

    // Database patients state
    const [dbPatients, setDbPatients] = useState<Patient[]>([])
    const [dbCount, setDbCount] = useState(0)
    const [dbPage, setDbPage] = useState(1)
    const [dbSearch, setDbSearch] = useState("")
    const [dbLoading, setDbLoading] = useState(true)

    // WhatsApp patients state
    const [wpPatients, setWpPatients] = useState<WhatsAppPatient[]>([])
    const [wpCount, setWpCount] = useState(0)
    const [wpPage, setWpPage] = useState(1)
    const [wpSearch, setWpSearch] = useState("")
    const [wpLoading, setWpLoading] = useState(true)

    // Action states
    const [isPending, startTransition] = useTransition()
    const [actionLoading, setActionLoading] = useState<number | null>(null)

    // Summary modal
    const [summaryModal, setSummaryModal] = useState(false)
    const [summaryContent, setSummaryContent] = useState("")
    const [summaryPatientName, setSummaryPatientName] = useState("")
    const [isSummarizing, setIsSummarizing] = useState(false)

    const limit = 10

    // Fetch database patients
    useEffect(() => {
        async function fetchDb() {
            setDbLoading(true)
            const result = await getPatients(dbPage, limit, dbSearch)
            setDbPatients(result.data)
            setDbCount(result.count)
            setDbLoading(false)
        }
        fetchDb()
    }, [dbPage, dbSearch])

    // Fetch WhatsApp patients
    useEffect(() => {
        async function fetchWp() {
            setWpLoading(true)
            const result = await getWhatsAppPatients(wpPage, limit, wpSearch, user?.clinic_id)
            setWpPatients(result.data)
            setWpCount(result.count)
            setWpLoading(false)
        }
        if (user?.clinic_id) {
            fetchWp()
        }
    }, [wpPage, wpSearch, user?.clinic_id])

    const dbTotalPages = Math.ceil(dbCount / limit)
    const wpTotalPages = Math.ceil(wpCount / limit)

    // Handle database search
    const handleDbSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const query = formData.get("dbQuery") as string
        setDbSearch(query)
        setDbPage(1)
    }

    // Handle WhatsApp search
    const handleWpSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const query = formData.get("wpQuery") as string
        setWpSearch(query)
        setWpPage(1)
    }

    // Handle pause/resume patient
    const handleTogglePause = async (patient: WhatsAppPatient) => {
        setActionLoading(patient.id)
        try {
            if (patient.atendimento_ia === 'pausado') {
                await resumeWhatsAppPatient(patient.id)
            } else {
                await pauseWhatsAppPatient(patient.id)
            }
            // Refresh list
            const result = await getWhatsAppPatients(wpPage, limit, wpSearch, user?.clinic_id)
            setWpPatients(result.data)
            setWpCount(result.count)
        } finally {
            setActionLoading(null)
        }
    }

    // Handle summarize conversation
    const handleSummarize = async (patient: WhatsAppPatient) => {
        if (!user?.clinic_id) return

        setSummaryPatientName(patient.nomewpp || patient.telefone)
        setSummaryModal(true)
        setIsSummarizing(true)
        setSummaryContent("")

        try {
            const response = await fetch('https://ia-n8n.jje6ux.easypanel.host/webhook/webhookresumirconversas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telefone: patient.telefone,
                    clinic_id: user.clinic_id
                })
            })

            if (!response.ok) {
                throw new Error('Falha ao gerar resumo')
            }

            const summary = await response.text()
            setSummaryContent(summary)

            // Refresh list to show updated summary
            const result = await getWhatsAppPatients(wpPage, limit, wpSearch, user?.clinic_id)
            setWpPatients(result.data)

        } catch (error: any) {
            setSummaryContent(`Erro: ${error.message}`)
        } finally {
            setIsSummarizing(false)
        }
    }

    return (
        <div className="flex h-[calc(100vh-1rem)] gap-2 p-2 overflow-hidden relative text-xs flex-col">
            <Card className="flex-1 flex flex-col border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Pacientes</h1>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "database" | "whatsapp")} className="flex-1 flex flex-col">
                        <div className="px-4 pt-4">
                            <TabsList className="grid w-full max-w-md grid-cols-2">
                                <TabsTrigger value="database" className="flex items-center gap-2">
                                    <Database className="h-4 w-4" />
                                    Banco de Dados
                                </TabsTrigger>
                                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    WhatsApp Ativos
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Database Tab */}
                        <TabsContent value="database" className="flex-1 flex flex-col m-0 overflow-hidden">
                            <div className="p-4 pb-2">
                                <form onSubmit={handleDbSearch} className="flex gap-2 max-w-sm">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            name="dbQuery"
                                            type="search"
                                            placeholder="Buscar por nome..."
                                            defaultValue={dbSearch}
                                            className="pl-8 bg-background"
                                        />
                                    </div>
                                    <Button type="submit" disabled={dbLoading}>
                                        {dbLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                                    </Button>
                                </form>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Telefone</TableHead>
                                            <TableHead>CPF</TableHead>
                                            <TableHead>Convênio</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dbLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : dbPatients.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Nenhum paciente encontrado.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            dbPatients.map((patient) => (
                                                <TableRow key={patient.id}>
                                                    <TableCell className="font-medium">{patient.nome}</TableCell>
                                                    <TableCell>{patient.telefone || "-"}</TableCell>
                                                    <TableCell>{patient.cpf || "-"}</TableCell>
                                                    <TableCell>{patient.convenio || "-"}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm">
                                                            Ver
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Database Pagination */}
                            <div className="border-t p-4 flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Total: {dbCount} pacientes
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={dbPage <= 1}
                                        onClick={() => setDbPage(p => p - 1)}
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex items-center px-4 font-medium">
                                        Página {dbPage} de {dbTotalPages || 1}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={dbPage >= dbTotalPages}
                                        onClick={() => setDbPage(p => p + 1)}
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>

                        {/* WhatsApp Tab */}
                        <TabsContent value="whatsapp" className="flex-1 flex flex-col m-0 overflow-hidden">
                            <div className="p-4 pb-2">
                                <form onSubmit={handleWpSearch} className="flex gap-2 max-w-sm">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            name="wpQuery"
                                            type="search"
                                            placeholder="Buscar por nome ou telefone..."
                                            defaultValue={wpSearch}
                                            className="pl-8 bg-background"
                                        />
                                    </div>
                                    <Button type="submit" disabled={wpLoading}>
                                        {wpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
                                    </Button>
                                </form>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nome</TableHead>
                                            <TableHead>Telefone</TableHead>
                                            <TableHead>Etapa do Funil</TableHead>
                                            <TableHead>Status IA</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {wpLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24">
                                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ) : wpPatients.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Nenhum paciente ativo no WhatsApp.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            wpPatients.map((patient) => (
                                                <TableRow key={patient.id}>
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            {patient.nomewpp || "Sem nome"}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            {patient.telefone}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">
                                                            {patient.etapa_funil || "Não definida"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={patient.atendimento_ia === 'pausado' ? 'secondary' : 'default'} className="text-xs">
                                                            {patient.atendimento_ia === 'pausado' ? 'Pausado' : patient.atendimento_ia || 'Ativo'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <TooltipProvider>
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleTogglePause(patient)}
                                                                            disabled={actionLoading === patient.id}
                                                                        >
                                                                            {actionLoading === patient.id ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                            ) : patient.atendimento_ia === 'pausado' ? (
                                                                                <Play className="h-4 w-4 text-green-600" />
                                                                            ) : (
                                                                                <Pause className="h-4 w-4 text-amber-600" />
                                                                            )}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        {patient.atendimento_ia === 'pausado' ? 'Retomar IA' : 'Pausar IA'}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={() => handleSummarize(patient)}
                                                                        >
                                                                            <Sparkles className="h-4 w-4 text-purple-600" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Resumir Conversa
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </div>
                                                        </TooltipProvider>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* WhatsApp Pagination */}
                            <div className="border-t p-4 flex items-center justify-between">
                                <span className="text-muted-foreground">
                                    Total: {wpCount} pacientes ativos
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={wpPage <= 1}
                                        onClick={() => setWpPage(p => p - 1)}
                                    >
                                        Anterior
                                    </Button>
                                    <div className="flex items-center px-4 font-medium">
                                        Página {wpPage} de {wpTotalPages || 1}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={wpPage >= wpTotalPages}
                                        onClick={() => setWpPage(p => p + 1)}
                                    >
                                        Próxima
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Summary Modal */}
            <Dialog open={summaryModal} onOpenChange={setSummaryModal}>
                <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-purple-500" />
                            Resumo da Conversa
                        </DialogTitle>
                        <DialogDescription>
                            {summaryPatientName}
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 pr-4">
                        {isSummarizing ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-2 text-muted-foreground">Gerando resumo...</span>
                            </div>
                        ) : (
                            <div className="py-4 whitespace-pre-wrap text-sm">
                                {summaryContent || "Nenhum resumo disponível."}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    )
}
