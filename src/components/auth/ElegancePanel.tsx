"use client"

import { Hexagon } from "lucide-react"
import { SparklesCore } from "@/components/ui/sparkles"

export function ElegancePanel() {
    return (
        <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0d0d0d] via-[#111111] to-[#0a0a0a] flex flex-col items-center justify-center">
            {/* Background radial glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(217,119,6,0.08)_0%,_transparent_70%)]" />

            {/* Decorative corner accents */}
            <div className="absolute top-0 right-0 w-32 h-32 border-t border-r border-amber-500/10 rounded-tr-2xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b border-l border-amber-500/10 rounded-bl-2xl" />

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-8 px-10 max-w-md text-center">
                {/* Logo */}
                <div className="relative">
                    <Hexagon className="h-16 w-16 text-amber-500" strokeWidth={1.5} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Hexagon className="h-16 w-16 text-amber-500 opacity-20 blur-lg" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Title */}
                <div className="flex flex-col items-center gap-3">
                    <h2 className="text-5xl font-bold tracking-wider font-playfair text-white">
                        Elegance
                    </h2>
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
                    <p className="text-xs text-white/40 tracking-[0.3em] uppercase">
                        Marketing Médico em Inovação
                    </p>
                </div>

                {/* Feature text */}
                <div className="space-y-3 mt-4">
                    <p className="text-lg font-playfair text-white/80 leading-relaxed">
                        Gerencie sua clínica com elegância.
                    </p>
                    <p className="text-sm text-white/30 leading-relaxed">
                        Uma plataforma sofisticada desenhada para profissionais que buscam excelência operacional.
                    </p>
                </div>
            </div>

            {/* Sparkles decoration — bottom half */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 pointer-events-none">
                {/* Gradient lines */}
                <div className="absolute inset-x-0 top-0 mx-auto w-3/4 h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent blur-sm" />
                <div className="absolute inset-x-0 top-0 mx-auto w-3/4 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                <SparklesCore
                    background="transparent"
                    minSize={0.4}
                    maxSize={1.2}
                    particleDensity={300}
                    className="w-full h-full"
                    particleColor="#f59e0b"
                    speed={0.8}
                />

                {/* Fade edges */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] via-transparent to-[#0a0a0a]/80" />
            </div>
        </div>
    )
}
