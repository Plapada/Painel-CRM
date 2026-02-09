"use client"

import { useState, useEffect, useTransition } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Pause, Play, Sparkles, User, Phone } from "lucide-react"
import { getPatients, pauseWhatsAppPatient, resumeWhatsAppPatient, type Patient } from "@/app/actions/get-patients"
import { useAuth } from "@/lib/auth-context"
import { ClientDetailsSheet } from "@/components/clients/client-details-sheet"
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
    const { user } = useAuth()

    // Patients state
    const [patients, setPatients] = useState<Patient[]>([])
    const [count, setCount] = useState(0)
    const [page, setPage] = useState(1)
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

    // Action states
    const [actionLoading, setActionLoading] = useState<string | number | null>(null)

    // Sheet state
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    // Summary modal
    const [summaryModal, setSummaryModal] = useState(false)
    const [summaryContent, setSummaryContent] = useState("")
    const [summaryPatientName, setSummaryPatientName] = useState("")
    const [isSummarizing, setIsSummarizing] = useState(false)

    const limit = 10
    const totalPages = Math.ceil(count / limit)

    // Fetch patients
    async function fetchPatients() {
        if (!user?.clinic_id) return
        setLoading(true)
        try {
            const result = await getPatients(page, limit, search, user.clinic_id)
            setPatients(result.data)
            setCount(result.count)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPatients()
    }, [page, search, user?.clinic_id])

    // Handle search
    const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const query = formData.get("query") as string
        setSearch(query)
        setPage(1)
    }

    // Opens details sheet
    const handleRowClick = (patient: Patient) => {
        setSelectedPatient(patient)
        setIsSheetOpen(true)
    }

    // Handle pause/resume patient (for WhatsApp functionality)
    const handleTogglePause = async (e: React.MouseEvent, patient: Patient) => {
        e.stopPropagation() // Prevent opening row details
        // Cast ID to number if needed, since our helper functions expect number
        const patientId = Number(patient.id)
        if (isNaN(patientId)) return

        setActionLoading(patient.id)
        try {
            if (patient.atendimento_ia === 'pause') {
                await resumeWhatsAppPatient(patientId)
            } else {
                await pauseWhatsAppPatient(patientId)
            }
            // Refresh list
            await fetchPatients()
        } finally {
            setActionLoading(null)
        }
    }

    // Handle summarize conversation
    const handleSummarize = async (e: React.MouseEvent, patient: Patient) => {
        e.stopPropagation() // Prevent opening row details
        if (!user?.clinic_id) return

        setSummaryPatientName(patient.nome || patient.telefone || "")
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

            // Refresh list (optional, but maybe status changed)
            await fetchPatients()

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
                    <div className="p-4 pb-2 border-b">
                        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    name="query"
                                    type="search"
                                    placeholder="Buscar por nome, telefone, CPF..."
                                    defaultValue={search}
                                    className="pl-8 bg-background"
                                />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buscar"}
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
                                    <TableHead>Status IA</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : patients.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            Nenhum paciente encontrado.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    patients.map((patient) => (
                                        <TableRow
                                            key={patient.id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleRowClick(patient)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                    {patient.nome}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    {patient.telefone || "-"}
                                                </div>
                                            </TableCell>
                                            <TableCell>{patient.cpf || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal text-xs">
                                                    {patient.convenio || "Particular"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {patient.atendimento_ia && (
                                                    <Badge variant={patient.atendimento_ia === 'pause' ? 'secondary' : 'default'} className="text-xs">
                                                        {patient.atendimento_ia === 'pause' ? 'Pausado' : patient.atendimento_ia}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TooltipProvider>
                                                    <div className="flex items-center justify-end gap-1">
                                                        {patient.telefone && (
                                                            <>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={(e) => handleTogglePause(e, patient)}
                                                                            disabled={actionLoading === patient.id}
                                                                        >
                                                                            {actionLoading === patient.id ? (
                                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                            ) : patient.atendimento_ia === 'pause' ? (
                                                                                <Play className="h-4 w-4 text-green-600" />
                                                                            ) : (
                                                                                <Pause className="h-4 w-4 text-amber-600" />
                                                                            )}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        {patient.atendimento_ia === 'pause' ? 'Retomar IA' : 'Pausar IA'}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8"
                                                                            onClick={(e) => handleSummarize(e, patient)}
                                                                        >
                                                                            <Sparkles className="h-4 w-4 text-purple-600" />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        Resumir Conversa
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        <Button variant="ghost" size="sm">
                                                            Ver Detalhes
                                                        </Button>
                                                    </div>
                                                </TooltipProvider>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="border-t p-4 flex items-center justify-between">
                        <span className="text-muted-foreground">
                            Total: {count} pacientes
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                Anterior
                            </Button>
                            <div className="flex items-center px-4 font-medium">
                                Página {page} de {totalPages || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Próxima
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <ClientDetailsSheet
                patient={selectedPatient}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
            />

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
