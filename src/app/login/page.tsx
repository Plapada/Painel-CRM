import { LoginForm } from "@/components/auth/LoginForm"
import { ElegancePanel } from "@/components/auth/ElegancePanel"

export default function LoginPage() {
    return (
        <div className="dark min-h-screen w-full flex items-center justify-center p-4 bg-[#0a0a0a] overflow-hidden relative">
            {/* Ambient background glows */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-[92%] md:w-[85%] lg:w-[75%] max-w-5xl flex flex-col lg:flex-row h-auto lg:h-[680px] relative z-10 bg-[#111111] border border-white/[0.06] rounded-2xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
                {/* Left Column: Login Form */}
                <div className="w-full lg:w-[45%] px-6 sm:px-10 md:px-14 py-12 flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Subtle glow behind form */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-amber-500/[0.04] via-orange-500/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />
                    <LoginForm />
                </div>

                {/* Divider */}
                <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-white/[0.06] to-transparent" />

                {/* Right Column: Elegance Panel */}
                <div className="hidden lg:flex flex-1 relative overflow-hidden">
                    <ElegancePanel />
                </div>
            </div>
        </div>
    )
}
