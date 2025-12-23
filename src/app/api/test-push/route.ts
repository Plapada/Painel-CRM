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
        console.log('--- TEST PUSH NOTIFICATION ---')

        // Fetch subscriptions
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5) // Just test recent ones

        if (error) {
            console.error('Error fetching subscriptions:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ error: 'No subscriptions found' }, { status: 404 })
        }

        console.log(`Sending TEST push to ${subscriptions.length} devices...`)

        const payload = JSON.stringify({
            title: '🧪 Teste de Notificação',
            body: 'Se você está vendo isso, o sistema de Push está funcionando!',
            url: 'https://painelcrmelegance.shop/clinics'
        })

        const results = await Promise.allSettled(subscriptions.map(sub => {
            return webPush.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    auth: sub.auth,
                    p256dh: sub.p256dh
                }
            }, payload)
        }))

        const successCount = results.filter(r => r.status === 'fulfilled').length
        const failCount = results.filter(r => r.status === 'rejected').length

        console.log(`Test Results: ${successCount} sent, ${failCount} failed`)

        return NextResponse.json({ success: true, sent: successCount, failed: failCount })
    } catch (error: any) {
        console.error('Error processing test push:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
