"use client"

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, RefreshCw, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WhatsAppQRCodeProps {
    instanceName: string
    clinicName: string
    onBack: () => void
    onConnected: () => void
}

const WEBHOOK_CRIAR = process.env.NEXT_PUBLIC_WEBHOOK_CRIAR_INSTANCIA!
const WEBHOOK_STATUS = process.env.NEXT_PUBLIC_WEBHOOK_STATUS_INSTANCIA!
const WEBHOOK_ATUALIZAR_QR = process.env.NEXT_PUBLIC_WEBHOOK_ATUALIZAR_QRCODE!
const WEBHOOK_MENSAGEM = process.env.NEXT_PUBLIC_WEBHOOK_MENSAGEM!

export function WhatsAppQRCode({ instanceName, clinicName, onBack, onConnected }: WhatsAppQRCodeProps) {
    const [qrCodeSrc, setQrCodeSrc] = useState<string | null>(null)
    const [timeLeft, setTimeLeft] = useState(30)
    const [isConnected, setIsConnected] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<'creating' | 'connecting' | 'checking' | 'connected' | 'error'>('creating')

    // Check instance status
    const checkInstanceStatus = useCallback(async () => {
        try {
            const response = await fetch(WEBHOOK_STATUS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName }),
            })

            if (response.ok) {
                const data = await response.json()
                let exists = false
                let connected = false

                if (Array.isArray(data) && data.length > 0) {
                    const instanceData = data[0]
                    if (instanceData.instance?.instanceName === instanceName) {
                        exists = true
                        if (instanceData.instance.state === 'open') {
                            connected = true
                        }
                    }
                } else if (data.instance) {
                    if (data.instance.instanceName === instanceName) {
                        exists = true
                        if (data.instance.state === 'open') {
                            connected = true
                        }
                    }
                } else {
                    exists = data.connected === true || data.status === 'connected' || data.state === 'open'
                }

                return { exists, connected }
            }
            return { exists: false, connected: false }
        } catch (err) {
            console.error('Error checking instance status:', err)
            return { exists: false, connected: false }
        }
    }, [instanceName])

    // Process QR code from response
    const processQRCode = async (response: Response) => {
        const contentType = response.headers.get('content-type')
        let imgSrc: string

        if (contentType?.includes('application/json')) {
            const data = await response.json()
            imgSrc = `data:image/png;base64,${data.qrCodeBase64}`
        } else {
            // It's a blob/image
            const blob = await response.blob()
            imgSrc = URL.createObjectURL(blob)
        }

        setQrCodeSrc(imgSrc)
    }

    // Create new instance
    const createInstance = useCallback(async () => {
        setIsLoading(true)
        setStatus('creating')
        setError(null)

        try {
            // First check if instance already exists
            const instanceStatus = await checkInstanceStatus()

            if (instanceStatus.exists) {
                if (instanceStatus.connected) {
                    setIsConnected(true)
                    setStatus('connected')
                    return
                }
                // Instance exists but not connected - get new QR code
                setStatus('connecting')
                const response = await fetch(WEBHOOK_ATUALIZAR_QR, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instanceName }),
                })
                if (!response.ok) throw new Error('Failed to update QR code')
                await processQRCode(response)
            } else {
                // Create new instance
                const response = await fetch(WEBHOOK_CRIAR, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ instanceName }),
                })
                if (!response.ok) throw new Error('Failed to create instance')
                await processQRCode(response)
            }

            setStatus('checking')
            setTimeLeft(30)
        } catch (err) {
            console.error('Error creating instance:', err)
            setError('Erro ao gerar QR Code. Tente novamente.')
            setStatus('error')
        } finally {
            setIsLoading(false)
        }
    }, [instanceName, checkInstanceStatus])

    // Refresh QR code
    const refreshQRCode = useCallback(async () => {
        if (isConnected) return

        try {
            const response = await fetch(WEBHOOK_ATUALIZAR_QR, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instanceName }),
            })
            if (response.ok) {
                await processQRCode(response)
                setTimeLeft(30)
            }
        } catch (err) {
            console.error('Error refreshing QR:', err)
        }
    }, [instanceName, isConnected])

    // Handle successful connection
    const handleConnected = useCallback(async () => {
        if (isConnected) return
        setIsConnected(true)
        setStatus('connected')

        try {
            await fetch(WEBHOOK_MENSAGEM, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    instanceName,
                    clinicName,
                    event: 'instance_connected',
                    status: 'connected',
                    timestamp: new Date().toISOString(),
                }),
            })
        } catch (err) {
            console.error('Error sending connection notification:', err)
        }

        onConnected()
    }, [instanceName, clinicName, isConnected, onConnected])

    // Check connection status periodically
    useEffect(() => {
        if (isConnected || status !== 'checking') return

        const interval = setInterval(async () => {
            const { connected } = await checkInstanceStatus()
            if (connected) {
                handleConnected()
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [isConnected, status, checkInstanceStatus, handleConnected])

    // Timer for QR refresh
    useEffect(() => {
        if (isConnected || isLoading || status !== 'checking') return
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    refreshQRCode()
                    return 30
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(timer)
    }, [isConnected, isLoading, status, refreshQRCode])

    // Initial load
    useEffect(() => {
        createInstance()
    }, [createInstance])

    // Connected state
    if (isConnected) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-amber-500 animate-in zoom-in duration-500">
                <div className="h-24 w-24 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
                    <CheckCircle className="h-12 w-12 animate-pulse" />
                </div>
                <h3 className="text-3xl font-playfair font-bold mb-2 text-white">Conexão Estabelecida</h3>
                <p className="text-neutral-400 text-center max-w-sm mt-2">
                    A instância de <span className="text-amber-400 font-medium">{clinicName}</span> está pronta.
                </p>
                {/* Gold Particles Effect could be added here if component was shared */}
            </div>
        )
    }

    return (
        <div className="relative w-full min-h-[700px] flex flex-col items-center justify-center p-8 bg-black text-white overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(200, 170, 70, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(200, 170, 70, 0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-md w-full flex flex-col items-center space-y-10">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-bold font-playfair mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-100 to-amber-400">
                        Conectar WhatsApp
                    </h2>
                    <p className="text-neutral-500 text-sm tracking-wide">
                        ESCANEIE O QR CODE PARA VINCULAR <span className="text-amber-500 font-bold">{clinicName.toUpperCase()}</span>
                    </p>
                </div>

                {/* QR Display */}
                <div className="relative group">
                    {/* Golden Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-tr from-amber-500/30 via-orange-500/20 to-yellow-500/30 rounded-2xl blur-lg opacity-80 group-hover:opacity-100 transition duration-1000 animate-pulse-slow"></div>

                    <div className="relative bg-black border border-amber-500/20 rounded-xl p-6 shadow-2xl backdrop-blur-xl">
                        {status === 'error' ? (
                            <div className="w-[280px] h-[280px] flex flex-col items-center justify-center text-center p-4">
                                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                                <p className="text-sm text-neutral-400 mb-4">{error}</p>
                                <Button onClick={createInstance} variant="outline" className="border-white/10 hover:bg-white/5 hover:text-white">
                                    <RefreshCw className="mr-2 h-4 w-4" /> Tentar Novamente
                                </Button>
                            </div>
                        ) : qrCodeSrc ? (
                            <div className="relative w-[280px] h-[280px] bg-white rounded-lg overflow-hidden p-2">
                                {/* The QR Code Image - Tinted Gold via Filter? 
                                    Standard QR is Black on White. 
                                    To make it "Gold", we can invert and sepia? 
                                    Or just show it plainly for max readability, with gold border/scanline.
                                    User explicitly asked for "cor do qr code dourada"
                                    Let's attempt a filter on the image container.
                                */}
                                <img
                                    src={qrCodeSrc}
                                    alt="QR Code WhatsApp"
                                    className="w-full h-full object-contain mix-blend-multiply filter sepia-[.8] hue-rotate-[5deg] saturate-[3]"
                                />

                                {/* Scan Line */}
                                <div className="absolute inset-x-0 top-0 h-0.5 bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,1)] animate-scan pointer-events-none z-10"></div>
                            </div>
                        ) : (
                            <div className="w-[280px] h-[280px] flex items-center justify-center bg-amber-500/5 rounded-lg border border-amber-500/10">
                                <Loader2 className="h-10 w-10 text-amber-500/50 animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="w-full flex items-center justify-between px-4">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="text-neutral-500 hover:text-amber-400 hover:bg-amber-500/5 gap-2 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>

                    {!isConnected && status !== 'error' && (
                        <div className="flex items-center gap-2 text-xs text-neutral-500 bg-amber-500/5 px-4 py-2 rounded-full border border-amber-500/10">
                            <RefreshCw className={`h-3 w-3 ${timeLeft <= 5 ? 'text-red-500' : 'text-amber-500'}`} />
                            <span>Atualiza em <span className="text-amber-400 font-mono font-bold">{timeLeft}s</span></span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
