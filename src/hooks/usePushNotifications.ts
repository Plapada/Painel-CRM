"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
            setIsSupported(true)
            registerServiceWorker()
        }
    }, [])

    const registerServiceWorker = async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            const sub = await registration.pushManager.getSubscription()
            setSubscription(sub)
        } catch (error) {
            console.error('Service Worker registration failed:', error)
        }
    }

    const subscribeToNotifications = async () => {
        if (!isSupported) return

        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidKey) {
            console.error('Missing VAPID key')
            alert('Erro interno: Chave de notificação VAPID não encontrada.')
            return
        }

        setIsLoading(true)
        try {
            // Check Permissions
            let permission = Notification.permission
            if (permission === 'default') {
                permission = await Notification.requestPermission()
            }

            if (permission !== 'granted') {
                alert('Permissão para notificações foi negada. Por favor, habilite nas configurações do site (ícone de cadeado).')
                setIsLoading(false)
                return
            }

            const registration = await navigator.serviceWorker.ready

            // Force unsubscribe to ensure clean slate (fixes "different application server key" errors)
            const existingSub = await registration.pushManager.getSubscription()
            if (existingSub) {
                await existingSub.unsubscribe()
                console.log('Existing subscription unsubscribed.')
            }

            // Attempt new subscription
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidKey)
            })

            setSubscription(sub)

            // Save to Supabase
            if (sub) {
                const { keys, endpoint } = sub.toJSON() as any
                const { error } = await supabase.from('push_subscriptions').insert({
                    endpoint,
                    p256dh: keys?.p256dh,
                    auth: keys?.auth
                })

                if (error) {
                    console.error('Database error:', error)
                    // Optional: alert user if strictly necessary, but usually we proceed
                }
            }
        } catch (error: any) {
            console.error('Subscription failed:', error)
            // Show the actual error message or object for better debugging
            alert(`Falha ao ativar notificações: ${error.message || JSON.stringify(error)}`)
        } finally {
            setIsLoading(false)
        }
    }

    return { isSupported, subscription, subscribeToNotifications, isLoading }
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
