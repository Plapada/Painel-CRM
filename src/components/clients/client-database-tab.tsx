"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { getPatients, searchPatients, Patient } from "@/app/actions/get-patients"
import { ClientDetailsSheet } from "./client-details-sheet"

export function ClientDatabaseTab() {
    const [patients, setPatients] = useState<Patient[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) {
                handleSearch()
            } else {
                fetchInitialData()
            }
        }, 500)

        return () => clearTimeout(timer)
    }, [searchTerm])

    async function fetchInitialData() {
        setLoading(true)
        try {
            const { data } = await getPatients(1, 100)
            setPatients(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSearch() {
        if (!searchTerm) return
        setLoading(true)
        try {
            const results = await searchPatients(searchTerm)
            setPatients(results)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleRowClick = (patient: Patient) => {
        setSelectedPatient(patient)
        setIsSheetOpen(true)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, CPF..."
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
                            <TableHead>Nome</TableHead>
                            <TableHead>CPF</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Convênio</TableHead>
                            <TableHead>Prontuário</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Carregando...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : patients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
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
                                    <TableCell className="font-medium text-primary">
                                        {patient.nome}
                                    </TableCell>
                                    <TableCell>{patient.cpf || '-'}</TableCell>
                                    <TableCell>{patient.telefone || '-'}</TableCell>
                                    <TableCell>{patient.convenio || 'Particular'}</TableCell>
                                    <TableCell>{patient.prontuario || '-'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="text-xs text-muted-foreground text-center">
                Exibindo {patients.length} registro(s)
            </div>

            <ClientDetailsSheet
                patient={selectedPatient}
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
            />
        </div>
    )
}
