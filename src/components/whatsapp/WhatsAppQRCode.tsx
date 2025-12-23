"use client"

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, RefreshCw, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react'

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

        // Send notification to webhook
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
            <div className="flex flex-col items-center justify-center py-8 px-4 text-emerald-500">
                <CheckCircle className="h-16 w-16 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Conexão Estabelecida!</h3>
                <p className="text-sm text-muted-foreground text-center">
                    Instância &quot;{clinicName}&quot; conectada com sucesso.
                </p>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-8 px-4">
                <AlertCircle className="h-16 w-16 mb-4 text-destructive" />
                <h3 className="text-lg font-semibold mb-2 text-destructive">Erro</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
                <button
                    onClick={createInstance}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Tentar Novamente
                </button>
            </div>
        )
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 px-4">
                <Loader2 className="h-8 w-8 mb-4 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">
                    {status === 'creating' ? 'Criando instância...' : 'Gerando QR Code...'}
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center space-y-4">
            {/* QR Code Display */}
            <div className="p-3 bg-white rounded-xl shadow-lg">
                {qrCodeSrc ? (
                    <img
                        src={qrCodeSrc}
                        alt="QR Code WhatsApp"
                        className="w-[240px] h-[240px] object-contain"
                    />
                ) : (
                    <div className="w-[240px] h-[240px] flex items-center justify-center bg-muted rounded-lg">
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    </div>
                )}
            </div>

            {/* Timer Section */}
            <div className="flex items-center gap-2 px-4 py-2 bg-card/50 border rounded-lg">
                <RefreshCw className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Atualiza em:</span>
                <span className={`font-mono font-bold ${timeLeft <= 5 ? 'text-destructive' : 'text-primary'}`}>
                    {timeLeft}s
                </span>
            </div>

            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft className="h-4 w-4" />
                Voltar
            </button>
        </div>
    )
}
