"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"
import { Hexagon } from "lucide-react"

function NeuralNetwork() {
    const count = 100
    const connections = 150
    const radius = 20

    const particlePositions = useMemo(() => {
        const positions = new Float32Array(count * 3)
        for (let i = 0; i < count; i++) {
            const x = (Math.random() - 0.5) * radius
            const y = (Math.random() - 0.5) * radius
            const z = (Math.random() - 0.5) * radius
            positions[i * 3] = x
            positions[i * 3 + 1] = y
            positions[i * 3 + 2] = z
        }
        return positions
    }, [])

    const linePositions = useMemo(() => {
        const positions = new Float32Array(connections * 2 * 3)
        for (let i = 0; i < connections; i++) {
            const startIdx = Math.floor(Math.random() * count)
            const endIdx = Math.floor(Math.random() * count)

            positions[i * 6] = particlePositions[startIdx * 3]
            positions[i * 6 + 1] = particlePositions[startIdx * 3 + 1]
            positions[i * 6 + 2] = particlePositions[startIdx * 3 + 2]

            positions[i * 6 + 3] = particlePositions[endIdx * 3]
            positions[i * 6 + 4] = particlePositions[endIdx * 3 + 1]
            positions[i * 6 + 5] = particlePositions[endIdx * 3 + 2]
        }
        return positions
    }, [particlePositions])

    const pointsRef = useRef<THREE.Points>(null!)
    const linesRef = useRef<THREE.LineSegments>(null!)

    useFrame((state) => {
        const time = state.clock.getElapsedTime() * 0.1
        if (pointsRef.current) {
            pointsRef.current.rotation.y = time
        }
        if (linesRef.current) {
            linesRef.current.rotation.y = time
        }
    })

    return (
        <group>
            <points ref={pointsRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={count}
                        args={[particlePositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial size={0.15} color="#f59e0b" transparent opacity={0.8} sizeAttenuation />
            </points>
            <lineSegments ref={linesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={connections * 2}
                        args={[linePositions, 3]}
                    />
                </bufferGeometry>
                <lineBasicMaterial color="#f59e0b" transparent opacity={0.15} />
            </lineSegments>
        </group>
    )
}

export function NeuralNetworkBackground() {
    return (
        <>
            <div className="absolute inset-0 w-full h-full">
                <Canvas camera={{ position: [0, 0, 15], fov: 60 }}>
                    <NeuralNetwork />
                </Canvas>
            </div>

            {/* Overlay with Logo and Text */}
            <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-8 gap-4 z-10 bg-black/30">
                <a className="flex flex-col items-center gap-2 font-semibold text-white text-center" href="#">
                    <Hexagon className="h-12 w-12 shrink-0 text-primary" strokeWidth={2} />
                    <div>
                        <span className="text-5xl font-bold tracking-wider font-playfair">Elegance</span>
                        <p className="text-base text-muted-foreground tracking-widest">Marketing Médico em Inovação</p>
                    </div>
                </a>
            </div>
        </>
    )
}
