import { getPatients } from "@/app/actions/get-patients"
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
import { Search } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export const metadata = {
    title: "Pacientes | CRM Elegance",
    description: "Gerenciamento de pacientes",
}

export default async function PatientsPage({
    searchParams,
}: {
    searchParams: { page?: string; q?: string }
}) {
    const page = Number(searchParams.page) || 1
    const query = searchParams.q || ""
    const limit = 10

    const { data: patients, count } = await getPatients(page, limit, query)
    const totalPages = Math.ceil(count / limit)

    async function handleSearch(formData: FormData) {
        "use server"
        const q = formData.get("q")
        redirect(`/patients?q=${q}&page=1`)
    }

    return (
        <div className="flex h-[calc(100vh-1rem)] gap-2 p-2 overflow-hidden relative text-xs flex-col">
            <Card className="flex-1 flex flex-col border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-4 border-b space-y-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Pacientes</h1>
                    </div>
                    <form action={handleSearch} className="flex gap-2 max-w-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                name="q"
                                type="search"
                                placeholder="Buscar por nome..."
                                defaultValue={query}
                                className="pl-8 bg-background"
                            />
                        </div>
                        <Button type="submit">Buscar</Button>
                    </form>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-auto">
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
                            {patients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Nenhum paciente encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                patients.map((patient) => (
                                    <TableRow key={patient.id}>
                                        <TableCell className="font-medium">{patient.nome}</TableCell>
                                        <TableCell>{patient.telefone || "-"}</TableCell>
                                        <TableCell>{patient.cpf || "-"}</TableCell>
                                        <TableCell>{patient.convenio || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`#`}>Ver</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination */}<div className="border-t p-4 flex items-center justify-between">
                    <span className="text-muted-foreground">
                        Total: {count} pacientes
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            asChild
                        >
                            <Link href={`/patients?q=${query}&page=${page - 1}`}>Anterior</Link>
                        </Button>
                        <div className="flex items-center px-4 font-medium">
                            Página {page} de {totalPages || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            asChild
                        >
                            <Link href={`/patients?q=${query}&page=${page + 1}`}>Próxima</Link>
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    )
}
