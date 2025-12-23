"use client"

import { useEffect, useRef } from 'react'

interface GoldenParticle {
    x: number
    y: number
    size: number
    speedX: number
    speedY: number
    opacity: number
    color: { r: number; g: number; b: number }
    twinkle: number
    twinkleSpeed: number
}

interface GlowOrb {
    x: number
    y: number
    size: number
    vx: number
    vy: number
    color: { r: number; g: number; b: number }
    pulse: number
    pulseSpeed: number
}

const goldenColors = [
    { r: 212, g: 175, b: 55 },   // Classic Gold
    { r: 255, g: 215, b: 0 },    // Pure Gold
    { r: 218, g: 165, b: 32 },   // Goldenrod
    { r: 184, g: 134, b: 11 },   // Dark Goldenrod
    { r: 255, g: 193, b: 37 },   // Bright Gold
]

export function GoldenParticlesBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const mouseRef = useRef({ x: 0, y: 0 })
    const animationRef = useRef<number | undefined>(undefined)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let width = window.innerWidth
        let height = window.innerHeight
        let particles: GoldenParticle[] = []
        let glowOrbs: GlowOrb[] = []

        const resize = () => {
            width = canvas.width = window.innerWidth
            height = canvas.height = window.innerHeight
            init()
        }

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current.x = e.clientX
            mouseRef.current.y = e.clientY
        }

        const createParticle = (): GoldenParticle => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.3,
            speedY: (Math.random() - 0.5) * 0.3 - 0.1,
            opacity: Math.random() * 0.4 + 0.1,
            color: goldenColors[Math.floor(Math.random() * goldenColors.length)],
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: Math.random() * 0.02 + 0.01,
        })

        const createGlowOrb = (): GlowOrb => ({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 200 + 150,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2,
            color: goldenColors[Math.floor(Math.random() * goldenColors.length)],
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: Math.random() * 0.005 + 0.002,
        })

        const init = () => {
            particles = []
            glowOrbs = []

            const numParticles = Math.min(Math.ceil((width * height) / 8000), 200)
            for (let i = 0; i < numParticles; i++) {
                particles.push(createParticle())
            }

            const numOrbs = Math.ceil((width * height) / 400000) + 3
            for (let i = 0; i < numOrbs; i++) {
                glowOrbs.push(createGlowOrb())
            }
        }

        const updateParticle = (p: GoldenParticle) => {
            p.x += p.speedX
            p.y += p.speedY
            p.twinkle += p.twinkleSpeed

            const dx = p.x - mouseRef.current.x
            const dy = p.y - mouseRef.current.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 100) {
                p.x += dx * 0.01
                p.y += dy * 0.01
            }

            if (p.x < -10) p.x = width + 10
            if (p.x > width + 10) p.x = -10
            if (p.y < -10) p.y = height + 10
            if (p.y > height + 10) p.y = -10
        }

        const updateGlowOrb = (orb: GlowOrb) => {
            orb.x += orb.vx
            orb.y += orb.vy
            orb.pulse += orb.pulseSpeed

            if (orb.x < -orb.size || orb.x > width + orb.size) orb.vx *= -1
            if (orb.y < -orb.size || orb.y > height + orb.size) orb.vy *= -1

            const dx = mouseRef.current.x - orb.x
            const dy = mouseRef.current.y - orb.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 600) {
                orb.x += dx * 0.0005
                orb.y += dy * 0.0005
            }
        }

        const drawParticle = (p: GoldenParticle) => {
            const twinkleOpacity = p.opacity * (0.5 + Math.sin(p.twinkle) * 0.5)

            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${twinkleOpacity})`
            ctx.fill()

            const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
            gradient.addColorStop(0, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${twinkleOpacity * 0.3})`)
            gradient.addColorStop(1, `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0)`)
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
            ctx.fill()
        }

        const drawGlowOrb = (orb: GlowOrb) => {
            const pulseOpacity = 0.03 + Math.sin(orb.pulse) * 0.015
            const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size)
            gradient.addColorStop(0, `rgba(${orb.color.r}, ${orb.color.g}, ${orb.color.b}, ${pulseOpacity})`)
            gradient.addColorStop(0.4, `rgba(${orb.color.r}, ${orb.color.g}, ${orb.color.b}, ${pulseOpacity * 0.5})`)
            gradient.addColorStop(1, `rgba(${orb.color.r}, ${orb.color.g}, ${orb.color.b}, 0)`)

            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2)
            ctx.fill()
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height)

            ctx.globalCompositeOperation = 'screen'
            glowOrbs.forEach(orb => {
                updateGlowOrb(orb)
                drawGlowOrb(orb)
            })

            particles.forEach(particle => {
                updateParticle(particle)
                drawParticle(particle)
            })

            ctx.globalCompositeOperation = 'source-over'
            animationRef.current = requestAnimationFrame(animate)
        }

        window.addEventListener('resize', resize)
        window.addEventListener('mousemove', handleMouseMove)

        resize()
        animate()

        return () => {
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', handleMouseMove)
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current)
            }
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 z-0 pointer-events-auto"
            style={{ mixBlendMode: 'screen' }}
        />
    )
}
