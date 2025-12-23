"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Smartphone, MoreVertical, Scan, CheckCircle } from "lucide-react"

interface WhatsAppTutorialProps {
    clinicName: string
    onStart: () => void
}

export function WhatsAppTutorial({ clinicName, onStart }: WhatsAppTutorialProps) {
    return (
        <div className="relative w-full h-full text-white p-8 md:p-12 lg:p-20 flex flex-col justify-center min-h-[700px] bg-black">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto w-full">
                <div className="mb-16 space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-medium tracking-wider text-green-500 uppercase border border-green-500/20 px-2 py-0.5 rounded-full bg-green-500/10">Conexão Segura</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter font-playfair text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
                        Inteligência.
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-400 font-light max-w-2xl leading-relaxed">
                        Vincule o WhatsApp da <span className="text-green-400 font-medium">{clinicName}</span> para começar a orquestrar seus atendimentos automaticamente.
                    </p>

                    <Button
                        onClick={onStart}
                        size="lg"
                        className="rounded-full px-8 py-6 text-lg bg-white text-black hover:bg-neutral-200 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] mt-8"
                    >
                        Gerar QR Code <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Step 1 */}
                    <div className="group relative bg-neutral-900/50 border border-white/5 p-8 rounded-3xl hover:bg-white/5 transition-all duration-500 hover:border-white/20">
                        <div className="absolute -top-4 -left-4 text-6xl font-black text-white/5 select-none group-hover:text-white/10 transition-colors">01</div>
                        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform duration-500">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium mb-3 text-white">Abra o WhatsApp</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                            No seu celular, abra o aplicativo do WhatsApp que você deseja conectar.
                        </p>
                        {/* Visual */}
                        <div className="relative h-24 w-full bg-black/60 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                            <Smartphone className="h-10 w-10 text-neutral-700 absolute opacity-20" />
                            {/* Placeholder for real image */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <span className="relative text-xs text-neutral-500">Imagem do App</span>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="group relative bg-neutral-900/50 border border-white/5 p-8 rounded-3xl hover:bg-white/5 transition-all duration-500 hover:border-white/20">
                        <div className="absolute -top-4 -left-4 text-6xl font-black text-white/5 select-none group-hover:text-white/10 transition-colors">02</div>
                        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform duration-500">
                            <MoreVertical className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium mb-3 text-white">Menu de Opções</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                            Toque nos três pontinhos (Android) ou Configurações (iOS) e selecione <b>Aparelhos conectados</b>.
                        </p>
                        <div className="relative h-24 w-full bg-black/60 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                            <div className="flex flex-col gap-1 items-end p-4 w-full opacity-40">
                                <div className="h-1 w-full bg-neutral-600 rounded"></div>
                                <div className="h-1 w-2/3 bg-neutral-600 rounded"></div>
                                <div className="h-1 w-1/2 bg-neutral-600 rounded"></div>
                            </div>
                            <span className="absolute text-xs text-neutral-500">Menu &gt; Conectar</span>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="group relative bg-neutral-900/50 border border-white/5 p-8 rounded-3xl hover:bg-white/5 transition-all duration-500 hover:border-white/20">
                        <div className="absolute -top-4 -left-4 text-6xl font-black text-white/5 select-none group-hover:text-white/10 transition-colors">03</div>
                        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-green-400 group-hover:scale-110 transition-transform duration-500">
                            <Scan className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-medium mb-3 text-white">Escaneie o Código</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                            Toque em <b>Conectar um aparelho</b> e aponte a câmera para o QR Code na próxima tela.
                        </p>
                        <div className="relative h-24 w-full bg-black/60 rounded-xl border border-white/5 flex items-center justify-center overflow-hidden">
                            <Scan className="h-10 w-10 text-neutral-700 absolute opacity-20" />
                            <span className="relative text-xs text-neutral-500">Scanner</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-between text-xs text-neutral-600 border-t border-white/5 pt-8">
                    <span className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" /> Criptografia de ponta a ponta
                    </span>
                    <span>Tecnologia Metafore</span>
                </div>
            </div>
        </div>
    )
}
