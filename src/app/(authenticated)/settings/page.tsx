import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

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

                <div className="flex gap-4">
                    <Button>Salvar Alterações</Button>
                    <Button variant="outline">Cancelar</Button>
                </div>
            </div>
        </div>
    )
}
