"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { searchPatients, Patient } from "@/app/actions/get-patients"

interface PatientSearchProps {
    onSelect: (patient: Patient) => void
    clinicId?: string
}

export function PatientSearch({ onSelect, clinicId }: PatientSearchProps) {
    const [open, setOpen] = React.useState(false)
    const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null)
    const [query, setQuery] = React.useState("")
    const [patients, setPatients] = React.useState<Patient[]>([])
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        if (query.length < 2) {
            setPatients([])
            return
        }

        const timer = setTimeout(async () => {
            setLoading(true)
            try {
                const results = await searchPatients(query, clinicId)
                setPatients(results)
            } catch (error) {
                console.error('Error searching patients:', error)
                setPatients([])
            }
            setLoading(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [query, clinicId])

    const handleSelect = (patient: Patient) => {
        setSelectedPatient(patient)
        onSelect(patient)
        setOpen(false)
        setQuery("")
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {selectedPatient
                        ? selectedPatient.nome
                        : "Buscar paciente..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Digite o nome para buscar..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm text-muted-foreground">Buscando...</span>
                            </div>
                        )}
                        {!loading && query.length >= 2 && patients.length === 0 && (
                            <CommandEmpty>Nenhum paciente encontrado.</CommandEmpty>
                        )}
                        {!loading && query.length < 2 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Digite ao menos 2 caracteres para buscar
                            </div>
                        )}
                        {!loading && patients.length > 0 && (
                            <CommandGroup>
                                {patients.map((patient) => (
                                    <CommandItem
                                        key={`${patient.source}-${patient.id}`}
                                        value={`${patient.source}-${patient.id}`}
                                        onSelect={() => handleSelect(patient)}
                                        className="cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 flex-shrink-0",
                                                selectedPatient?.id === patient.id && selectedPatient?.source === patient.source
                                                    ? "opacity-100"
                                                    : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="flex items-center gap-2">
                                                <span className="truncate font-medium">{patient.nome}</span>
                                                <span className={cn(
                                                    "text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0",
                                                    patient.source === 'whatsapp' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                                )}>
                                                    {patient.source === 'whatsapp' ? 'WhatsApp' : 'Banco'}
                                                </span>
                                            </span>
                                            <span className="text-xs text-muted-foreground truncate">
                                                {patient.cpf ? `CPF: ${patient.cpf} • ` : ''}{patient.telefone || 'Sem telefone'}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
