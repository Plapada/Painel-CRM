"use client"

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, ArrowLeft } from 'lucide-react'
import { GoldenParticlesBackground } from '@/components/whatsapp/GoldenParticlesBackground'
import { WhatsAppTutorial } from '@/components/whatsapp/WhatsAppTutorial'
import { WhatsAppQRCode } from '@/components/whatsapp/WhatsAppQRCode'
import Link from 'next/link'

type Step = 'tutorial' | 'qrcode' | 'success'

export default function AdminConnectWhatsAppPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user } = useAuth()

    const clinicId = searchParams.get('clinic_id')
    const clinicName = searchParams.get('clinic_name')

    const [isLoading, setIsLoading] = useState(true)
    const [isValid, setIsValid] = useState(false)
    const [step, setStep] = useState<Step>('tutorial')
    const [instanceName, setInstanceName] = useState('')
    const [resolvedClinicName, setResolvedClinicName] = useState('')

    useEffect(() => {
        validateAccess()
    }, [clinicId, clinicName, user])

    const validateAccess = async () => {
        // Must be admin
        if (!user || user.role !== 'admin') {
            setIsValid(false)
            setIsLoading(false)
            return
        }

        // Must have clinic_id
        if (!clinicId) {
            setIsValid(false)
            setIsLoading(false)
            return
        }

        try {
            // Get clinic info if name not provided
            let finalClinicName = clinicName

            if (!finalClinicName) {
                const { data } = await supabase
                    .from('usuarios_site')
                    .select('username, email')
                    .eq('id', clinicId)
                    .single()

                if (data) {
                    finalClinicName = data.username || data.email?.split('@')[0] || 'Clinic'
                }
            }

            if (!finalClinicName) {
                setIsValid(false)
                setIsLoading(false)
                return
            }

            setResolvedClinicName(finalClinicName)

            // Generate instance name from clinic name
            const sanitizedName = finalClinicName
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')

            setInstanceName(`${sanitizedName}_${clinicId.slice(0, 8)}`)
            setIsValid(true)
        } catch (err) {
            console.error('Error validating access:', err)
            setIsValid(false)
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

    const handleGoBack = () => {
        router.push(`/clinics/${clinicId}`)
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Verificando acesso...</span>
                </div>
            </div>
        )
    }

    // Invalid access
    if (!isValid) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark">
                <Card className="w-full max-w-md border-destructive/20">
                    <CardContent className="pt-6 text-center space-y-4">
                        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
                        <h2 className="text-xl font-bold text-destructive">Acesso Negado</h2>
                        <p className="text-muted-foreground text-sm">
                            Você não tem permissão para acessar esta página ou a clínica não foi encontrada.
                        </p>
                        <Button variant="outline" asChild>
                            <Link href="/clinics">Voltar para Clínicas</Link>
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
                <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-0 pointer-events-none opacity-80" />

                <Card className="w-full max-w-md relative z-10 bg-card/80 backdrop-blur-lg border-green-500/20">
                    <CardContent className="pt-8 pb-8 text-center space-y-6">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto">
                            <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-green-500">Conexão Estabelecida!</h2>
                            <p className="text-muted-foreground text-sm">
                                O WhatsApp da clínica <span className="text-primary font-medium">{resolvedClinicName}</span> foi conectado com sucesso.
                            </p>
                        </div>
                        <Button onClick={handleGoBack} className="w-full">
                            Voltar para Detalhes da Clínica
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Main connection flow
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black dark relative overflow-hidden">
            <GoldenParticlesBackground />

            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15vw] text-white/[0.02] whitespace-nowrap pointer-events-none z-0 font-serif italic font-semibold select-none">
                Elegance
            </div>

            <div className="fixed inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-0 pointer-events-none opacity-80" />

            {/* Back button for admin */}
            <Button
                variant="ghost"
                className="fixed top-4 left-4 z-20 text-muted-foreground hover:text-foreground"
                asChild
            >
                <Link href={`/clinics/${clinicId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar
                </Link>
            </Button>

            <Card
                className="w-[95%] max-w-[460px] relative z-10 bg-black/60 backdrop-blur-xl border-white/[0.08]"
                style={{
                    boxShadow: '0 50px 100px -20px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(212, 175, 55, 0.08)',
                }}
            >
                <CardHeader className="text-center pb-2">
                    <span className="text-primary/80 text-[10px] uppercase tracking-[0.3em] font-semibold mb-2">
                        Elegance • Admin
                    </span>

                    <div className="flex justify-center mb-3">
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/5 border border-white/10 shadow-lg shadow-black/50">
                            <span className="text-primary font-serif font-bold italic text-xl">E</span>
                        </div>
                    </div>

                    <CardDescription className="text-neutral-500 text-sm font-light">
                        {step === 'tutorial'
                            ? 'Configure a integração com WhatsApp'
                            : 'Escaneie o código para conectar'
                        }
                    </CardDescription>
                </CardHeader>

                <CardContent className="pt-4 pb-8">
                    {step === 'tutorial' ? (
                        <WhatsAppTutorial
                            clinicName={resolvedClinicName}
                            onStart={handleStartConnection}
                        />
                    ) : (
                        <WhatsAppQRCode
                            instanceName={instanceName}
                            clinicName={resolvedClinicName}
                            onBack={handleBack}
                            onConnected={handleConnected}
                        />
                    )}
                </CardContent>

                <div className="px-6 md:px-12 pb-6 pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-neutral-600 uppercase tracking-widest">
                    <span>© Elegance</span>
                    <div className="flex gap-2 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Online</span>
                    </div>
                </div>
            </Card>
        </div>
    )
}
