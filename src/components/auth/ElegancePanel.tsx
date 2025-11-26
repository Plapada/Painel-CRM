"use client"

import { Hexagon } from "lucide-react"
import { SparklesCore } from "@/components/ui/sparkles"

export function ElegancePanel() {
    return (
        <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-neutral-950 via-neutral-900 to-black flex flex-col items-center justify-center p-8">
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-yellow-500/5"></div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center gap-6">
                {/* Trapezoid Icon */}
                <div className="relative">
                    <Hexagon className="h-20 w-20 text-primary" strokeWidth={2} />
                    <div className="absolute inset-0 h-20 w-20 text-primary opacity-30 blur-xl">
                        <Hexagon className="h-20 w-20" strokeWidth={2} />
                    </div>
                </div>

                {/* Title and Subtitle */}
                <div className="flex flex-col items-center gap-2">
                    <h1 className="text-6xl md:text-7xl font-bold tracking-wider font-playfair text-white">
                        Elegance
                    </h1>
                    <p className="text-base text-muted-foreground tracking-widest uppercase">
                        Marketing Médico em Inovação
                    </p>
                </div>

                {/* Sparkles decoration below text - ONLY HERE */}
                <div className="w-[500px] h-32 relative mt-4">
                    {/* Gradient lines */}
                    <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent h-[2px] w-3/4 blur-sm mx-auto left-0 right-0" />
                    <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-amber-500 to-transparent h-px w-3/4 mx-auto left-0 right-0" />
                    <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-orange-400 to-transparent h-[5px] w-1/4 blur-sm mx-auto left-0 right-0" />
                    <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-orange-400 to-transparent h-px w-1/4 mx-auto left-0 right-0" />

                    {/* Concentrated Sparkles - only below title */}
                    <SparklesCore
                        background="transparent"
                        minSize={0.6}
                        maxSize={1.4}
                        particleDensity={400}
                        className="w-full h-full"
                        particleColor="#f59e0b"
                        speed={1}
                    />

                    {/* Radial gradient to fade edges */}
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-transparent via-black/20 to-black"></div>
                </div>
            </div>
        </div>
    )
}
