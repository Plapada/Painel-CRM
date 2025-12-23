
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    try {
        const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_CHECK_STATUS

        if (!webhookUrl) {
            return NextResponse.json(
                { error: 'Webhook URL not configured' },
                { status: 500 }
            )
        }

        const { searchParams } = new URL(request.url)
        const queryString = searchParams.toString()
        const finalUrl = queryString ? `${webhookUrl}?${queryString}` : webhookUrl

        const response = await fetch(finalUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            return NextResponse.json(
                { error: `Webhook error: ${response.status}`, details: errorText },
                { status: response.status }
            )
        }

        const data = await response.json()
        return NextResponse.json(data)
    } catch (error: any) {
        console.error('Proxy error:', error)
        return NextResponse.json(
            { error: 'Internal Server Error', details: error.message },
            { status: 500 }
        )
    }
}
