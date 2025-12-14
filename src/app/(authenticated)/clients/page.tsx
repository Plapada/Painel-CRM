"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, Plus, Search } from "lucide-react"

export default function ClientsPage() {
    const { user } = useAuth()
    const [clients, setClients] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        if (user?.clinic_id) {
            fetchClients()

            const channel = supabase
                .channel('clients-updates')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dados_cliente' }, (payload) => {
                    // Only add if it belongs to this clinic
                    if (payload.new.clinic_id === user.clinic_id) {
                        setClients(prev => [payload.new, ...prev])
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
        }
    }, [user?.clinic_id])

    async function fetchClients() {
        if (!user?.clinic_id) {
            setLoading(false)
            return
        }

        console.log("Fetching clients for clinic:", user.clinic_id)

        try {
            const { data, error } = await supabase
                .from('dados_cliente')
                .select('*')
                .eq('clinic_id', user.clinic_id)
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching clients:", error)
            } else {
                console.log("Clients fetched:", data?.length)
                if (data) setClients(data)
            }
        } catch (err) {
            console.error("Exception fetching clients:", err)
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(client =>
        (client.nomewpp && client.nomewpp.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.telefone && client.telefone.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Novo Cliente
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar clientes..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome (WhatsApp)</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status IA</TableHead>
                            <TableHead>Resumo</TableHead>
                            <TableHead>Data Cadastro</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredClients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">Nenhum cliente encontrado.</TableCell>
                            </TableRow>
                        ) : (
                            filteredClients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/clients/${client.id}`} className="hover:underline text-primary">
                                            {client.nomewpp || 'Sem Nome'}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{client.telefone}</TableCell>
                                    <TableCell>{client.atendimento_ia || '-'}</TableCell>
                                    <TableCell className="max-w-xs truncate" title={client.resumo_conversa}>
                                        {client.resumo_conversa || <span className="text-muted-foreground text-xs">Sem resumo</span>}
                                    </TableCell>
                                    <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
