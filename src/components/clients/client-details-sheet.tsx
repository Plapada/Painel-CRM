"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { User, Phone, Mail, FileText, Calendar, Clock, MapPin, Building, CreditCard, Activity } from "lucide-react"
import { Patient } from "@/app/actions/get-patients"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClientDetailsSheetProps {
    patient: Patient | null
    isOpen: boolean
    onClose: () => void
}

export function ClientDetailsSheet({ patient, isOpen, onClose }: ClientDetailsSheetProps) {
    const [appointments, setAppointments] = useState<any[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    useEffect(() => {
        if (isOpen && patient?.id) {
            fetchHistory()
        }
    }, [isOpen, patient])

    async function fetchHistory() {
        if (!patient) return
        setLoadingHistory(true)

        try {
            // Fetch appointments matching name or close match
            const { data, error } = await supabase
                .from('consultas')
                .select('*')
                .eq('clinic_id', patient.clinica_id)
                .ilike('nome_cliente', patient.nome) // Basic match for now
                .order('data_inicio', { ascending: false })

            if (data) {
                setAppointments(data)
            }
        } catch (err) {
            console.error("Error fetching history:", err)
        } finally {
            setLoadingHistory(false)
        }
    }

    if (!patient) return null

    return (
        <Sheet open={isOpen} onOpenChange={open => !open && onClose()}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <SheetTitle className="text-xl">{patient.nome}</SheetTitle>
                            <SheetDescription>
                                Detalhes do paciente e histórico
                            </SheetDescription>
                        </div>
                    </div>
                </SheetHeader>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="details">Dados Pessoais</TabsTrigger>
                        <TabsTrigger value="history">Histórico de Consultas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="details" className="space-y-6">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Phone className="h-4 w-4" /> Contato
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Telefone</Label>
                                    <div className="font-medium text-sm">{patient.telefone || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Email</Label>
                                    <div className="font-medium text-sm truncate" title={patient.email || ''}>
                                        {patient.email || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Personal Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Documentos & info
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">CPF</Label>
                                    <div className="font-medium text-sm">{patient.cpf || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Convênio</Label>
                                    <div>
                                        <Badge variant="outline" className="font-normal text-xs">
                                            {patient.convenio || 'Particular'}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Prontuário</Label>
                                    <div className="font-medium text-sm">{patient.prontuario || '-'}</div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Profissão</Label>
                                    <div className="font-medium text-sm">{patient.profissao || '-'}</div>
                                </div>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <MapPin className="h-4 w-4" /> Endereço
                            </h3>
                            <div className="space-y-2">
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Logradouro</Label>
                                    <div className="font-medium text-sm">{patient.endereco_logradouro || '-'}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Número</Label>
                                        <div className="font-medium text-sm">{patient.endereco_numero || '-'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history">
                        <ScrollArea className="h-[60vh] pr-4">
                            {loadingHistory ? (
                                <div className="text-center py-8 text-muted-foreground">Carregando histórico...</div>
                            ) : appointments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                    Nenhum agendamento encontrado para este paciente.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {appointments.map((app) => (
                                        <Card key={app.id} className="overflow-hidden">
                                            <div className={`h-1 w-full ${getStatusColor(app.status)}`} />
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <div className="font-semibold">{app.tipo_consulta || 'Consulta'}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                            <Calendar className="h-3 w-3" />
                                                            {format(new Date(app.data_inicio), "PPP", { locale: ptBR })}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(app.data_inicio), "HH:mm")}
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="text-[10px] uppercase">
                                                        {app.status}
                                                    </Badge>
                                                </div>
                                                {app.observacoes && (
                                                    <div className="mt-2 text-xs bg-muted/50 p-2 rounded text-muted-foreground italic border-l-2 border-primary/20">
                                                        "{app.observacoes}"
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case 'confirmado': return 'bg-green-500'
        case 'pendente': return 'bg-yellow-500'
        case 'cancelada': return 'bg-red-500'
        case 'finalizado': return 'bg-blue-500'
        default: return 'bg-gray-300'
    }
}
