"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'
import { GoldenParticlesBackground } from '@/components/whatsapp/GoldenParticlesBackground'
import { WhatsAppTutorial } from '@/components/whatsapp/WhatsAppTutorial'
import { WhatsAppQRCode } from '@/components/whatsapp/WhatsAppQRCode'

type Step = 'tutorial' | 'qrcode' | 'success'

export default function ConnectWhatsAppPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    const [isLoading, setIsLoading] = useState(true)
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
    const [registrationData, setRegistrationData] = useState<{
        clinic_id: string
        clinic_name: string
    } | null>(null)
    const [step, setStep] = useState<Step>('tutorial')
    const [instanceName, setInstanceName] = useState('')

    useEffect(() => {
        validateToken()
    }, [token])

    const validateToken = async () => {
        if (!token) {
            setIsValidToken(false)
            setIsLoading(false)
            return
        }

        try {
            // Check pending_registrations table for the token
            const { data, error } = await supabase
                .from('pending_registrations')
                .select('clinic_id, clinic_name')
                .eq('token', token)
                .single()

            if (data && !error) {
                setIsValidToken(true)
                setRegistrationData(data)
                // Generate instance name from clinic name
                const sanitizedName = data.clinic_name
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '') // Remove accents
                    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
                    .replace(/^_+|_+$/g, '') // Trim underscores
                setInstanceName(sanitizedName)
            } else {
                setIsValidToken(false)
            }
        } catch (err) {
            console.error('Error validating token:', err)
            setIsValidToken(false)
        } finally {
            setIsLoading(false)
        }
    }

    const handleStartConnection = () => {
        setStep('qrcode')
    }

    const handleBack = () => {
        setStep('tutorial')
    }

    const handleConnected = () => {
        setStep('success')
    }

    const handleGoToLogin = () => {
        router.push('/login')
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verificando...</span>
                </div>
            </div>
        )
    }

    // Invalid token
    if (!isValidToken || !registrationData) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark">
                <Card className="w-full max-w-md border-destructive/20">
                    <CardContent className="pt-6 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                        <h2 className="text-xl font-bold text-destructive">Link Inválido</h2>
                        <p className="text-muted-foreground text-sm">
                            Este link de conexão não é válido ou expirou. Entre em contato com o administrador.
                        </p>
                        <Button variant="outline" onClick={() => router.push('/login')}>
                            Ir para Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Success state
    if (step === 'success') {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark relative overflow-hidden">
                <GoldenParticlesBackground />

                {/* Gradient overlay */}
                <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-0 pointer-events-none opacity-80" />

                <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-lg border-green-500/20">
                    <CardContent className="pt-8 pb-8 text-center space-y-6">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-green-500">
                                Tudo Pronto!
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                O WhatsApp da <span className="text-primary font-medium">{registrationData.clinic_name}</span> foi conectado com sucesso.
                            </p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Agora você pode fazer login e começar a usar o sistema.
                        </p>
                        <Button onClick={handleGoToLogin} className="w-full">
                            Ir para Login
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Main connection flow
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark relative overflow-hidden">
            {/* Background Animation */}
            <GoldenParticlesBackground />

            {/* Watermark */}
            <div
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] text-white/[0.02] whitespace-nowrap pointer-events-none z-0 font-serif italic font-semibold select-none"
            >
                Elegance
            </div>

            {/* Gradient overlay */}
            <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-0 pointer-events-none opacity-80" />

            {/* Main Card */}
            <Card
                className="w-[95%] max-w-7xl relative z-10 bg-black text-white border border-white/10 shadow-2xl transition-all duration-700"
            >
                <CardContent className="p-0">
                    {step === 'tutorial' ? (
                        <WhatsAppTutorial
                            clinicName={registrationData.clinic_name}
                            onStart={handleStartConnection}
                        />
                    ) : (
                        <WhatsAppQRCode
                            instanceName={instanceName}
                            clinicName={registrationData.clinic_name}
                            onBack={handleBack}
                            onConnected={handleConnected}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
