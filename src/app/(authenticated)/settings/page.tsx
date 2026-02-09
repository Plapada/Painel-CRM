import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { ArrowRight, Stethoscope } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
                <p className="text-muted-foreground">Gerencie as configurações da sua conta e preferências.</p>
            </div>
            <Separator />

            <div className="grid gap-8">
                <div className="grid gap-4">
                    <h2 className="text-xl font-semibold">Perfil</h2>
                    <div className="grid gap-4 max-w-md">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Nome da Clínica</Label>
                            <Input id="name" defaultValue="Clínica Elegance" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email de Contato</Label>
                            <Input id="email" defaultValue="contato@elegance.com" />
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                    <h2 className="text-xl font-semibold">Notificações</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between max-w-md">
                            <div className="space-y-0.5">
                                <Label>Novos Agendamentos</Label>
                                <p className="text-sm text-muted-foreground">Receber email quando houver novo agendamento.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between max-w-md">
                            <div className="space-y-0.5">
                                <Label>Mensagens de Chat</Label>
                                <p className="text-sm text-muted-foreground">Notificar sobre novas mensagens.</p>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="grid gap-4">
                    <h2 className="text-xl font-semibold">Geral</h2>
                    <div className="grid gap-4 max-w-md">
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600 dark:text-blue-400">
                                    <Stethoscope className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Procedimentos</h3>
                                    <p className="text-sm text-muted-foreground">Gerenciar catálogo de procedimentos e valores.</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/settings/procedures">
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="flex gap-4">
                    <Button>Salvar Alterações</Button>
                    <Button variant="outline">Cancelar</Button>
                </div>
            </div>
        </div>
    )
}
