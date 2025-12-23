"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Smartphone, MoreVertical, Scan, Settings } from "lucide-react"

interface WhatsAppTutorialProps {
    clinicName: string
    onStart: () => void
}

export function WhatsAppTutorial({ clinicName, onStart }: WhatsAppTutorialProps) {
    return (
        <div className="relative w-full h-full text-white p-6 md:p-12 lg:p-20 flex flex-col justify-center min-h-[700px] bg-black overflow-hidden">
            {/* Background Grid & Glow */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(200, 170, 70, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 170, 70, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 max-w-6xl mx-auto w-full">
                <div className="mb-16 space-y-6 text-center md:text-left">
                    {/* Removed "Conexão Segura" label as requested */}

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter font-playfair text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 drop-shadow-sm">
                        Inteligência.
                    </h1>
                    <p className="text-xl md:text-2xl text-neutral-400 font-light max-w-2xl leading-relaxed mx-auto md:mx-0">
                        Vincule o WhatsApp da <span className="text-amber-400 font-medium">{clinicName}</span> para começar a orquestrar seus atendimentos.
                    </p>

                    <Button
                        onClick={onStart}
                        size="lg"
                        className="rounded-full px-10 py-7 text-lg bg-amber-500 text-black hover:bg-amber-400 transition-all duration-300 shadow-[0_0_20px_rgba(217,119,6,0.2)] hover:shadow-[0_0_30px_rgba(217,119,6,0.4)] mt-8 font-semibold"
                    >
                        Gerar QR Code <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Step 1 */}
                    <div className="group relative bg-neutral-900/80 border border-amber-500/10 p-8 rounded-3xl hover:bg-neutral-900 transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <Smartphone className="h-6 w-6" />
                            </div>
                            <span className="text-4xl font-playfair font-bold text-amber-500/40 group-hover:text-amber-500 transition-colors">01</span>
                        </div>
                        <h3 className="text-xl font-medium mb-3 text-white">Abra o WhatsApp</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                            No seu celular, abra o aplicativo do WhatsApp.
                        </p>
                        {/* Visual Mockup */}
                        <div className="relative h-32 w-full bg-neutral-950 rounded-xl border border-white/5 overflow-hidden flex flex-col pt-2 shadow-inner">
                            {/* Phone Header */}
                            <div className="h-4 w-full bg-neutral-900 border-b border-white/5 flex items-center justify-between px-3">
                                <div className="text-[8px] text-neutral-500">12:00</div>
                                <div className="flex gap-1">
                                    <div className="h-1 w-1 rounded-full bg-neutral-600"></div>
                                    <div className="h-1 w-2 rounded-full bg-neutral-600"></div>
                                </div>
                            </div>
                            {/* Phone Content (List) */}
                            <div className="flex-1 p-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-amber-500/20"></div>
                                    <div className="space-y-1">
                                        <div className="h-1.5 w-16 bg-neutral-800 rounded"></div>
                                        <div className="h-1 w-10 bg-neutral-800 rounded"></div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-6 w-6 rounded-full bg-neutral-800"></div>
                                    <div className="space-y-1">
                                        <div className="h-1.5 w-12 bg-neutral-800 rounded"></div>
                                        <div className="h-1 w-8 bg-neutral-800 rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="group relative bg-neutral-900/80 border border-amber-500/10 p-8 rounded-3xl hover:bg-neutral-900 transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <Settings className="h-6 w-6" />
                            </div>
                            <span className="text-4xl font-playfair font-bold text-amber-500/40 group-hover:text-amber-500 transition-colors">02</span>
                        </div>
                        <h3 className="text-xl font-medium mb-3 text-white">Configurações</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                            Acesse <b>Configurações</b> (iOS) ou <b>Três Pontos</b> (Android) &gt; <b>Aparelhos Conectados</b>.
                        </p>
                        {/* Visual Mockup */}
                        <div className="relative h-32 w-full bg-neutral-950 rounded-xl border border-white/5 overflow-hidden flex flex-col items-end pt-2 pr-2 shadow-inner">
                            <div className="bg-neutral-800 rounded-lg p-2 w-24 border border-white/5 shadow-xl mr-2 mt-2">
                                <div className="space-y-2">
                                    <div className="h-1.5 w-full bg-neutral-700 rounded"></div>
                                    <div className="h-1.5 w-full bg-amber-500/50 rounded animate-pulse"></div>
                                    <div className="h-1.5 w-full bg-neutral-700 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="group relative bg-neutral-900/80 border border-amber-500/10 p-8 rounded-3xl hover:bg-neutral-900 transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]">
                        <div className="flex justify-between items-start mb-6">
                            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <Scan className="h-6 w-6" />
                            </div>
                            <span className="text-4xl font-playfair font-bold text-amber-500/40 group-hover:text-amber-500 transition-colors">03</span>
                        </div>
                        <h3 className="text-xl font-medium mb-3 text-white">Escaneie</h3>
                        <p className="text-neutral-400 text-sm leading-relaxed mb-6">
                            Toque em <b>Conectar aparelho</b> e aponte a câmera para o código.
                        </p>
                        {/* Visual Mockup */}
                        <div className="relative h-32 w-full bg-neutral-950 rounded-xl border border-white/5 overflow-hidden flex items-center justify-center shadow-inner">
                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=300')] bg-cover opacity-20 blur-sm"></div>
                            <div className="relative h-16 w-16 border-2 border-amber-500/80 rounded-lg flex items-center justify-center">
                                <div className="h-full w-[1px] bg-amber-500 absolute top-0 left-1/2 -ml-[0.5px] animate-scan-vertical"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer simplified */}
                <div className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-neutral-600">
                    <span className="text-amber-500/50">Criptografia de ponta a ponta</span>
                </div>
            </div>
        </div>
    )
}
