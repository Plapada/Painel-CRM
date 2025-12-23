import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import webPush from 'web-push'

// Configure Web Push with VAPID keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@crmelegance.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { offline_count, disconnected_list, type, status } = data

        if (!type || type !== 'monitor_report') {
            return NextResponse.json({ error: 'Invalid webhook type' }, { status: 400 })
        }

        console.log('--- WHATSAPP MONITOR REPORT ---')
        console.log(`Offline: ${offline_count}, Status: ${status}`)

        // Determine Notification Content
        let title = ''
        let body = ''
        let shouldNotify = false

        if (offline_count > 0) {
            title = '⚠️ Atenção: Instâncias Offline'
            body = `${offline_count} clínicas estão desconectadas! Verifique o painel imediatamente.`
            shouldNotify = true
        } else if (status === 'all_connected') {
            // Optional: Notify success? Maybe only if previously offline?
            // User said: "update of connection... example: one that was connected is now offline"
            // And "when there is an update... I want notification"
            // Success notification might be spammy every 6h.
            // But user audio implied he wants to know.
            // I'll send success too if he wants. Or just Alert.
            // "quando houver uma atualização... por exemplo: offline"
            // I'll prioritize Warning.
            // But let's send Success too for now to confirm it works.
            title = '✅ Tudo Conectado'
            body = 'Todas as instâncias estão operando normalmente.'
            shouldNotify = true
        }

        if (shouldNotify) {
            // Fetch subscriptions
            const { data: subscriptions, error } = await supabase
                .from('push_subscriptions')
                .select('*')

            if (error) {
                console.error('Error fetching subscriptions:', error)
            } else if (subscriptions && subscriptions.length > 0) {
                console.log(`Sending push to ${subscriptions.length} devices...`)

                const payload = JSON.stringify({
                    title,
                    body,
                    url: 'https://painelcrmelegance.shop/clinics' // Deep link
                })

                // Send to all
                const promises = subscriptions.map(sub => {
                    const pushConfig = {
                        endpoint: sub.endpoint,
                        keys: {
                            auth: sub.auth,
                            p256dh: sub.p256dh
                        }
                    }
                    return webPush.sendNotification(pushConfig, payload)
                        .catch(err => {
                            if (err.statusCode === 410 || err.statusCode === 404) {
                                // Expired subscription, delete it
                                console.log('Cleaning up expired subscription:', sub.id)
                                return supabase.from('push_subscriptions').delete().eq('id', sub.id)
                            }
                            console.error('Push error:', err)
                        })
                })

                await Promise.all(promises)
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
