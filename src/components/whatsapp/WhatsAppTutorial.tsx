"use client"

import { MessageSquare, Smartphone, ScanLine, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WhatsAppTutorialProps {
    clinicName: string
    onStart: () => void
}

const steps = [
    {
        icon: Smartphone,
        title: "Abra o WhatsApp",
        description: "Abra o WhatsApp no seu celular e vá até Configurações",
    },
    {
        icon: MessageSquare,
        title: "Aparelhos Conectados",
        description: "Toque em 'Aparelhos Conectados' ou 'Linked Devices'",
    },
    {
        icon: ScanLine,
        title: "Conectar Aparelho",
        description: "Toque em 'Conectar um aparelho' e aponte para o QR Code",
    },
    {
        icon: CheckCircle,
        title: "Pronto!",
        description: "Aguarde a conexão ser estabelecida automaticamente",
    },
]

export function WhatsAppTutorial({ clinicName, onStart }: WhatsAppTutorialProps) {
    return (
        <div className="flex flex-col items-center space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 mb-2">
                    <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                    Conectar WhatsApp
                </h2>
                <p className="text-sm text-muted-foreground">
                    Vincule o WhatsApp da clínica <span className="text-primary font-medium">{clinicName}</span>
                </p>
            </div>

            {/* Steps */}
            <div className="w-full space-y-3">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/50 transition-colors hover:bg-card"
                    >
                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <step.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground font-medium">
                                    Passo {index + 1}
                                </span>
                            </div>
                            <h3 className="font-medium text-foreground text-sm">
                                {step.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Start Button */}
            <Button
                onClick={onStart}
                className="w-full py-6 text-base font-semibold gap-2 group"
            >
                Iniciar Conexão
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground text-center">
                Suas mensagens permanecem criptografadas de ponta a ponta.
            </p>
        </div>
    )
}
