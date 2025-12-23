"use client"

import { Smartphone, MoreVertical, Link2, ScanLine, CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WhatsAppTutorialProps {
    clinicName: string
    onStart: () => void
}

const steps = [
    {
        icon: Smartphone,
        stepNumber: 1,
        title: "Abra o WhatsApp",
        description: "Abra o aplicativo do WhatsApp no seu celular",
        highlight: "Certifique-se de estar conectado à internet",
    },
    {
        icon: MoreVertical,
        stepNumber: 2,
        title: "Toque no menu",
        description: "Toque nos três pontinhos no canto superior direito",
        highlight: "⋮ (Menu de opções)",
    },
    {
        icon: Link2,
        stepNumber: 3,
        title: "Aparelhos conectados",
        description: "Selecione a opção 'Aparelhos conectados' ou 'Linked Devices'",
        highlight: "Gerenciar dispositivos vinculados",
    },
    {
        icon: ScanLine,
        stepNumber: 4,
        title: "Conectar aparelho",
        description: "Toque em 'Conectar um aparelho' e aponte a câmera para o QR Code",
        highlight: "A conexão será feita automaticamente",
    },
    {
        icon: CheckCircle,
        stepNumber: 5,
        title: "Pronto!",
        description: "Aguarde a conexão ser estabelecida",
        highlight: "Você verá uma confirmação na tela",
    },
]

export function WhatsAppTutorial({ clinicName, onStart }: WhatsAppTutorialProps) {
    return (
        <div className="flex flex-col items-center space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 mb-2">
                    <svg viewBox="0 0 24 24" className="h-7 w-7 text-green-500" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                    Como conectar seu WhatsApp
                </h2>
                <p className="text-sm text-muted-foreground">
                    Siga os passos abaixo para vincular o WhatsApp da clínica <span className="text-primary font-medium">{clinicName}</span>
                </p>
            </div>

            {/* Steps with visual styling */}
            <div className="w-full space-y-3">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className="relative flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-card/80 to-card/40 border border-border/50 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
                    >
                        {/* Step number badge */}
                        <div className="absolute -left-2 -top-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg">
                            {step.stepNumber}
                        </div>

                        {/* Icon */}
                        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
                            <step.icon className="h-6 w-6 text-primary" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                            <h3 className="font-semibold text-foreground text-sm mb-1">
                                {step.title}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {step.description}
                            </p>
                            <p className="text-[10px] text-primary/80 mt-1 font-medium">
                                {step.highlight}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Start Button */}
            <Button
                onClick={onStart}
                className="w-full py-6 text-base font-semibold gap-2 group bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-lg shadow-green-500/25"
            >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Gerar QR Code
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            {/* Security note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Suas mensagens permanecem criptografadas de ponta a ponta</span>
            </div>
        </div>
    )
}
