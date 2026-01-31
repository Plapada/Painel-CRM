"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
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

// ... (imports)

interface PatientSearchProps {
    onSelect: (patient: Patient) => void
    clinicId?: string
}

export function PatientSearch({ onSelect, clinicId }: PatientSearchProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState("")
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
            const results = await searchPatients(query, clinicId)
            setPatients(results)
            setLoading(false)
        }, 300)

        return () => clearTimeout(timer)
    }, [query, clinicId])

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    {value
                        ? patients.find((patient) => patient.nome === value)?.nome || value
                        : "Search patient..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Type name to search..."
                        value={query}
                        onValueChange={setQuery}
                    />
                    <CommandList>
                        {loading && <CommandEmpty>Searching...</CommandEmpty>}
                        {!loading && query.length >= 2 && patients.length === 0 && (
                            <CommandEmpty>No patient found.</CommandEmpty>
                        )}
                        <CommandGroup>
                            {patients.map((patient) => (
                                <CommandItem
                                    key={`${patient.source}-${patient.id}`}
                                    value={patient.nome}
                                    onSelect={(currentValue) => {
                                        setValue(currentValue)
                                        onSelect(patient)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === patient.nome ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span className="flex items-center gap-2">
                                            {patient.nome}
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                                patient.source === 'whatsapp' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                                            )}>
                                                {patient.source === 'whatsapp' ? 'WhatsApp' : 'Banco'}
                                            </span>
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {patient.cpf ? `CPF: ${patient.cpf} • ` : ''} {patient.telefone}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
