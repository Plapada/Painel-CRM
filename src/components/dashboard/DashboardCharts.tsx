"use client"

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
)

interface ChartProps {
    data?: any
}

export function NewPatientsChart({ data }: ChartProps) {
    const chartData = {
        labels: data?.labels || [],
        datasets: [
            {
                label: 'Novos Pacientes',
                data: data?.data || [],
                backgroundColor: 'rgba(245, 158, 11, 0.8)',
                borderRadius: 4,
            },
        ],
    }
    return <Bar data={chartData} options={{ responsive: true }} />
}

export function PatientOriginChart({ data }: ChartProps) {
    const chartData = {
        labels: data?.labels || [],
        datasets: [
            {
                data: data?.data || [],
                backgroundColor: [
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                ],
                borderWidth: 1,
            },
        ],
    }
    return <div className="h-[300px] flex justify-center"><Pie data={chartData} options={{ responsive: true, maintainAspectRatio: false }} /></div>
}

export function CostPerChannelChart() {
    const data = {
        labels: ['Instagram', 'Google', 'Facebook', 'Indicação'],
        datasets: [
            {
                label: 'Custo por Lead (R$)',
                data: [15, 25, 18, 5],
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
            },
        ],
    }
    return <Bar data={data} options={{ responsive: true }} />
}

export function IaPerformanceChart() {
    const data = {
        labels: ['Agendamentos', 'Dúvidas', 'Triagem', 'Outros'],
        datasets: [
            {
                label: 'Interações da IA',
                data: [65, 59, 80, 81],
                backgroundColor: 'rgba(16, 185, 129, 0.5)',
            },
        ],
    }
    return <Bar data={data} options={{ responsive: true }} />
}
