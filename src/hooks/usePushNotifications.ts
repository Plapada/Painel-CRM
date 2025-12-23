"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function usePushNotifications() {
    const [isSupported, setIsSupported] = useState(false)
    const [subscription, setSubscription] = useState<PushSubscription | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
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

        setIsLoading(true)
        try {
            const registration = await navigator.serviceWorker.ready
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            })

            setSubscription(sub)

            // Save to Supabase
            if (sub) {
                const { keys, endpoint } = sub.toJSON() as any
                await supabase.from('push_subscriptions').insert({
                    endpoint,
                    p256dh: keys?.p256dh,
                    auth: keys?.auth
                })
            }
        } catch (error) {
            console.error('Subscription failed:', error)
            alert('Não foi possível ativar as notificações. Verifique as permissões do navegador.')
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
