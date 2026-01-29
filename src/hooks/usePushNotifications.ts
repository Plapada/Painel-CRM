"use client"

import { useState, useEffect } from 'react'
import { notify } from "@/lib/notify"
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

export function usePushNotifications() {
    const [permission, setPermission] = useState<NotificationPermission>('default')
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isSupported, setIsSupported] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true)
            setPermission(Notification.permission)

            // Check existing subscription
            navigator.serviceWorker.ready.then(registration => {
                registration.pushManager.getSubscription().then(sub => {
                    setSubscription(sub)
                })
            })
        }
    }, [])

    const subscribe = async () => {
        if (!isSupported) return

        try {
            setLoading(true)

            if (!VAPID_PUBLIC_KEY) {
                notify.error('Chave de notificação VAPID não encontrada.', 'Erro Interno')
                return
            }

            const registration = await navigator.serviceWorker.ready

            // Request permission
            const perm = await Notification.requestPermission()
            setPermission(perm)

            if (perm !== 'granted') {
                notify.error('Permissão para notificações foi negada. Por favor, habilite nas configurações do site (ícone de cadeado).', 'Permissão Negada')
                return
            }

            // Subscribe
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            })

            setSubscription(sub)

            // Save to Supabase
            const { keys, endpoint } = sub.toJSON() as any
            const { error } = await supabase.from('push_subscriptions').insert({
                endpoint,
                p256dh: keys?.p256dh,
                auth: keys?.auth
            })

            if (error) {
                console.error('Database error:', error)
            } else {
                notify.success("Notificações ativadas com sucesso!")
            }

        } catch (error: any) {
            console.error('Subscription failed:', error)
            notify.error(`${error.message || JSON.stringify(error)}`, 'Falha ao ativar')
        } finally {
            setLoading(false)
        }
    }

    return { isSupported, subscription, subscribeToNotifications: subscribe, isLoading: loading }
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}
