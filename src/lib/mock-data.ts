export const mockDashboardData = {
    stats: {
        totalRevenue: 128500,
        todayAppointments: 12,
        newPatients: 45,
        roi: 320,
        attendanceRate: 92,
        avgTicket: 450,
        patientSatisfaction: 4.8,
        treatmentSuccess: 88,
        avgWaitTime: 15 // minutes
    },
    patientsData: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        data: [28, 35, 42, 38, 55, 62]
    },
    originData: {
        labels: ['Google Ads', 'Instagram', 'Indicação Médica', 'Retorno', 'Facebook'],
        data: [35, 25, 20, 15, 5]
    },
    aiPerformance: [
        { name: 'Agendamentos', value: 145 },
        { name: 'Dúvidas Clínicas', value: 89 },
        { name: 'Triagem Inicial', value: 210 },
        { name: 'Renovação Receita', value: 65 },
    ],
    costPerChannel: [
        { name: 'Google Ads', value: 45 },
        { name: 'Instagram', value: 32 },
        { name: 'Facebook', value: 28 },
        { name: 'Indicação', value: 0 },
    ],
    appointments: [
        { id: 1, patient: "Ana Clara Souza", time: "09:00", type: "Primeira Consulta", status: "Confirmado", condition: "Enxaqueca Crônica" },
        { id: 2, patient: "Roberto Mendes", time: "10:30", type: "Retorno", status: "Em Andamento", condition: "Epilepsia" },
        { id: 3, patient: "Lúcia Ferreira", time: "11:45", type: "Avaliação", status: "Aguardando", condition: "Transtorno do Sono" },
        { id: 4, patient: "Carlos Oliveira", time: "14:00", type: "Procedimento", status: "Confirmado", condition: "Botox Terapêutico" },
        { id: 5, patient: "Fernanda Lima", time: "15:30", type: "Retorno", status: "Confirmado", condition: "Esclerose Múltipla" },
    ],
    recentPatients: [
        { id: 1, name: "Juliana Paes", date: "Hoje", condition: "Cefaleia Tensional", status: "Novo" },
        { id: 2, name: "Marcos Silva", date: "Ontem", condition: "Neuropatia", status: "Retorno" },
        { id: 3, name: "Patricia Gomes", date: "Ontem", condition: "Alzheimer (Acompanhante)", status: "Novo" },
    ]
}
