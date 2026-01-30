"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientDatabaseTab } from "@/components/clients/client-database-tab"
import { Users, MessageCircle } from "lucide-react"
import { WhatsAppClientsTab } from "@/components/clients/whatsapp-clients-tab"

export default function ClientsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Pacientes</h1>
            </div>

            <Tabs defaultValue="database" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="database" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Banco de Dados
                    </TabsTrigger>
                    <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        Pacientes WhatsApp
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="database">
                    <ClientDatabaseTab />
                </TabsContent>

                <TabsContent value="whatsapp">
                    <WhatsAppClientsTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}
