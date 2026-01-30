import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
                <div className="mb-8">
                    <Button variant="ghost" asChild className="mb-4">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para o Início
                        </Link>
                    </Button>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
                        Política de Privacidade
                    </h1>
                    <p className="text-muted-foreground">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                </div>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introdução</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Esta Política de Privacidade descreve como coletamos, usamos, processamos e protegemos suas informações pessoais ao utilizar nosso sistema de CRM ("Serviço"). Estamos comprometidos em proteger sua privacidade e seus dados.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Coleta de Informações</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Coletamos diferentes tipos de informações para fornecer e melhorar nosso Serviço:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li><strong>Dados Pessoais:</strong> Nome, endereço de e-mail, número de telefone e outras informações de contato.</li>
                            <li><strong>Dados de Uso:</strong> Informações sobre como o Serviço é acessado e usado (por exemplo, duração da visita, páginas visualizadas).</li>
                            <li><strong>Dados do Paciente:</strong> Informações inseridas no sistema para fins de gestão de relacionamento, protegidas por rigorosos padrões de segurança.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Uso das Informações</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Utilizamos as informações coletadas para diversos fins:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li>Para fornecer e manter nosso Serviço.</li>
                            <li>Para notificar sobre alterações em nosso Serviço.</li>
                            <li>Para permitir recursos interativos do Serviço.</li>
                            <li>Para fornecer suporte ao cliente.</li>
                            <li>Para monitorar o uso do Serviço e detectar problemas técnicos.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Segurança dos Dados</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            A segurança dos seus dados é importante para nós, mas lembre-se que nenhum método de transmissão pela Internet ou método de armazenamento eletrônico é 100% seguro. Embora nos esforcemos para usar meios comercialmente aceitáveis para proteger seus Dados Pessoais, não podemos garantir sua segurança absoluta.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Compartilhamento de Dados</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Não vendemos, trocamos ou transferimos suas informações pessoais identificáveis para terceiros sem o seu consentimento, exceto para terceiros de confiança que nos auxiliam na operação do nosso site ou na condução dos nossos negócios, desde que essas partes concordem em manter essas informações confidenciais.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Seus Direitos</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Você tem o direito de acessar, corrigir ou excluir suas informações pessoais. Se desejar exercer esses direitos, entre em contato conosco através dos canais de suporte fornecidos.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Alterações nesta Política</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Podemos atualizar nossa Política de Privacidade periodicamente. Publicaremos a nova Política de Privacidade nesta página e atualizaremos a "data de validade" no topo desta Política de Privacidade.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t">
                    <p className="text-center text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} CRM System. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
