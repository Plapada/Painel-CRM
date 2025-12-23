"use client"

import { Smartphone, MoreVertical, ScanLine, ArrowRight, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WhatsAppTutorialProps {
    clinicName: string
    onStart: () => void
}

export function WhatsAppTutorial({ clinicName, onStart }: WhatsAppTutorialProps) {
    return (
        <div className="relative w-full max-w-6xl mx-auto py-12 px-4 selection:bg-primary/20">
            {/* Grid Background */}
            <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />

            {/* Header */}
            <div className="mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium tracking-wide border border-green-500/20 mb-6">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    CONEXÃO SEGURA
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-2xl leading-tight">
                    Conecte sua <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-500 to-emerald-700">Inteligência.</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground max-w-lg leading-relaxed">
                    Vincule o WhatsApp da <span className="font-semibold text-foreground border-b border-green-500/30">{clinicName}</span> para começar a orquestrar seus atendimentos automaticamente.
                </p>

                <div className="mt-8">
                    <Button
                        onClick={onStart}
                        size="lg"
                        className="rounded-full px-8 h-12 bg-foreground text-background hover:bg-foreground/90 transition-all shadow-xl shadow-black/5"
                    >
                        Gerar QR Code <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {/* Card 1 */}
                <div className="group relative bg-white/60 backdrop-blur-sm border border-border/40 rounded-3xl p-8 hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:shadow-green-900/5 hover:-translate-y-1">
                    <span className="block text-7xl font-sans font-extralight text-foreground/5 mb-6 group-hover:text-green-500/10 transition-colors duration-500">01.</span>
                    <div className="mb-4 h-10 w-10 text-green-600/80 group-hover:text-green-600 transition-colors">
                        <Smartphone className="h-full w-full" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground/90">Abra o WhatsApp</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        No seu celular, abra o aplicativo do WhatsApp que você deseja conectar ao sistema.
                    </p>
                </div>

                {/* Card 2 */}
                <div className="group relative bg-white/60 backdrop-blur-sm border border-border/40 rounded-3xl p-8 hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:shadow-green-900/5 hover:-translate-y-1 delay-75">
                    <span className="block text-7xl font-sans font-extralight text-foreground/5 mb-6 group-hover:text-green-500/10 transition-colors duration-500">02.</span>
                    <div className="mb-4 h-10 w-10 text-green-600/80 group-hover:text-green-600 transition-colors">
                        <MoreVertical className="h-full w-full" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground/90">Acesse o Menu</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Toque nos três pontinhos (Android) ou Configurações (iOS) e selecione <span className="font-medium text-foreground">Aparelhos conectados</span>.
                    </p>
                </div>

                {/* Card 3 */}
                <div className="group relative bg-white/60 backdrop-blur-sm border border-border/40 rounded-3xl p-8 hover:bg-white/80 transition-all duration-500 hover:shadow-2xl hover:shadow-green-900/5 hover:-translate-y-1 delay-150">
                    <span className="block text-7xl font-sans font-extralight text-foreground/5 mb-6 group-hover:text-green-500/10 transition-colors duration-500">03.</span>
                    <div className="mb-4 h-10 w-10 text-green-600/80 group-hover:text-green-600 transition-colors">
                        <ScanLine className="h-full w-full" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground/90">Escaneie</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        Clique em <span className="font-medium text-foreground">Conectar um aparelho</span> na tela do seu celular e aponte a câmera para o QR Code.
                    </p>
                </div>
            </div>

            {/* Footer Note */}
            <div className="mt-16 border-t border-border/40 pt-8 flex flex-col md:flex-row items-center justify-between text-muted-foreground gap-4">
                <div className="flex items-center gap-2 text-sm">
                    <ShieldCheck className="h-4 w-4 text-green-500" />
                    Criptografia de ponta a ponta garantida
                </div>
                <p className="text-xs opacity-60">
                    Tecnologia Metafore
                </p>
            </div>
        </div>
    )
}
