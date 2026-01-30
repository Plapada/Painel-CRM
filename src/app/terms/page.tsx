import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
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
                        Termos de Serviço
                    </h1>
                    <p className="text-muted-foreground">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                </div>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Aceitação dos Termos</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Ao acessar e usar este sistema de CRM ("Serviço"), você concorda em cumprir e estar vinculado aos seguintes termos e condições ("Termos de Serviço"). Se você não concordar com estes termos, não deverá acessar ou usar o Serviço.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Uso do Serviço</h2>
                        <p className="text-muted-foreground leading-relaxed mb-4">
                            Você concorda em usar o Serviço apenas para fins legais e de acordo com estes Termos. Você não deve usar o Serviço:
                        </p>
                        <ul className="list-disc pl-6 text-muted-foreground space-y-2">
                            <li>De qualquer forma que viole qualquer lei ou regulamento local, nacional ou internacional aplicável.</li>
                            <li>Para transmitir, ou procurar o envio de, qualquer material publicitário ou promocional não solicitado ou não autorizado.</li>
                            <li>Para personificar ou tentar personificar a empresa, um funcionário da empresa, outro usuário ou qualquer outra pessoa ou entidade.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Privacidade e Proteção de Dados</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Respeitamos sua privacidade e a proteção de seus dados pessoais. O tratamento de quaisquer dados pessoais fornecidos ou coletados através do Serviço é regido por nossa Política de Privacidade.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Propriedade Intelectual</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            O Serviço e seu conteúdo original, recursos e funcionalidades são e permanecerão de propriedade exclusiva da empresa e de seus licenciadores. O Serviço é protegido por direitos autorais, marcas registradas e outras leis.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Limitação de Responsabilidade</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Em nenhum caso a empresa, seus diretores, funcionários, parceiros, agentes, fornecedores ou afiliados serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo, sem limitação, perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Alterações nos Termos</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de antecedência antes que quaisquer novos termos entrem em vigor.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold mb-4 text-foreground">7. Contato</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Se você tiver alguma dúvida sobre estes Termos, entre em contato conosco.
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
