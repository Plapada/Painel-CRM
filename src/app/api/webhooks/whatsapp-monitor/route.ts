import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
    try {
        const data = await request.json()
        const { offline_count, disconnected_list, type } = data

        // Check if valid data
        if (!type || type !== 'monitor_report') {
            return NextResponse.json({ error: 'Invalid webhook type' }, { status: 400 })
        }

        // Save to database notification/alert logs
        // Assuming we have a 'system_logs' or 'notifications' table, or we just log it for now.
        // Since I don't see a specific table for system-wide alerts in the previous context,
        // I will log it to console and return success. 
        // Ideally, you would want to insert this into a 'notifications' table for the admin.

        console.log('--- WHATSAPP MONITOR REPORT ---')
        console.log(`Offline Count: ${offline_count}`)
        console.log('Disconnected Instances:', disconnected_list)

        // Example: Insert into a table if it existed
        // await supabase.from('admin_notifications').insert({ ... })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
