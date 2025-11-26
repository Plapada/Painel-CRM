import { LoginForm } from "@/components/auth/LoginForm"
import { ElegancePanel } from "@/components/auth/ElegancePanel"

export default function LoginPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-black overflow-hidden relative dark">
            {/* Background Glow */}
            <div className="absolute -bottom-1/2 left-1/2 w-[150%] pointer-events-none z-0 -translate-x-1/2 opacity-30 blur-3xl bg-primary/20 h-[1000px] rounded-full"></div>

            <div className="w-[90%] md:w-[80%] lg:w-[70%] max-w-5xl flex flex-col lg:flex-row h-auto lg:h-[650px] relative z-10 bg-card border rounded-2xl shadow-2xl overflow-hidden">
                {/* Left Column: Form */}
                <div className="w-full lg:w-1/2 px-4 sm:px-8 md:px-16 py-10 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute pointer-events-none w-[500px] h-[500px] bg-gradient-to-r from-yellow-300/10 via-orange-300/10 to-amber-300/10 rounded-full blur-3xl -z-10"></div>
                    <LoginForm />
                </div>

                {/* Right Column: Elegance Panel */}
                <div className="hidden lg:flex w-1/2 relative overflow-hidden">
                    <ElegancePanel />
                </div>
            </div>
        </div>
    )
}

