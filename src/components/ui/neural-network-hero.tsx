'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useTheme } from 'next-themes';

export function NeuralNetworkHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const subtitleRef = useRef<HTMLParagraphElement>(null);
    const ctaRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (titleRef.current) {
            tl.fromTo(
                titleRef.current,
                { opacity: 0, y: 50, filter: 'blur(10px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2 },
            );
        }

        if (subtitleRef.current) {
            tl.fromTo(
                subtitleRef.current,
                { opacity: 0, y: 30, filter: 'blur(5px)' },
                { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1, delay: -0.8 },
            );
        }

        if (ctaRef.current) {
            tl.fromTo(
                ctaRef.current,
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: 0.8, delay: -0.6 },
            );
        }

        return () => {
            tl.kill();
        };
    }, []);

    // Prevent hydration mismatch by not rendering theme-dependent classes until mounted
    if (!mounted) {
        return (
            <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
                <div className="absolute inset-0 z-0 opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500 via-transparent to-transparent animate-pulse" />
                </div>
                <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center pointer-events-none">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40 mb-6">
                        Neural Intelligence
                        <br />
                        <span className="text-indigo-400">Evolved</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mb-10">
                        Experience the next generation of AI-powered analytics and decision making.
                    </p>
                </div>
            </div>
        );
    }

    // Theme-aware gradient classes
    const bgGradient = theme === 'light'
        ? 'bg-gradient-to-br from-amber-50 via-orange-100 to-yellow-50'
        : 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900';

    const textColor = theme === 'light' ? 'text-slate-900' : 'text-white';

    const titleGradient = theme === 'light'
        ? 'from-slate-900 to-slate-600'
        : 'from-white to-white/40';

    const accentColor = theme === 'light' ? 'text-orange-600' : 'text-indigo-400';

    const subtitleColor = theme === 'light' ? 'text-slate-600' : 'text-zinc-400';

    const glowColor = theme === 'light'
        ? 'from-amber-400 via-transparent to-transparent'
        : 'from-purple-500 via-transparent to-transparent';

    const buttonClass = theme === 'light'
        ? 'bg-slate-900 text-white hover:bg-slate-800'
        : 'bg-white text-black hover:bg-zinc-200';

    return (
        <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${bgGradient} ${textColor} transition-colors duration-300`}>
            {/* Animated background glow */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] ${glowColor} animate-pulse`} />
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center pointer-events-none">
                <h1
                    ref={titleRef}
                    className={`text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b ${titleGradient} mb-6`}
                >
                    Neural Intelligence
                    <br />
                    <span className={accentColor}>Evolved</span>
                </h1>
                <p ref={subtitleRef} className={`text-xl md:text-2xl ${subtitleColor} max-w-2xl mb-10`}>
                    Experience the next generation of AI-powered analytics and decision making.
                </p>
                <div ref={ctaRef} className="pointer-events-auto">
                    <button className={`px-8 py-4 ${buttonClass} rounded-full font-semibold text-lg transition-colors duration-300`}>
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
