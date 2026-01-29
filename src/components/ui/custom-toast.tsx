"use client"

import { cn } from "@/lib/utils";
import { Check, X, AlertCircle, Info, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import React from "react";

interface CustomToastProps {
    id: string | number;
    title?: string;
    description: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
}

export function CustomToast({ id, title, description, variant = 'default' }: CustomToastProps) {
    const icons = {
        default: Info,
        success: CheckCircle2,
        error: AlertCircle,
        warning: AlertTriangle
    }
    const colors = {
        default: "text-zinc-500 dark:text-zinc-400",
        success: "text-emerald-500",
        error: "text-red-500",
        warning: "text-amber-500"
    }
    const Icon = icons[variant];
    const iconColor = colors[variant];

    return (
        <div className="w-full max-w-sm">
            <div className="relative bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-[0_1px_6px_0_rgba(0,0,0,0.02)] rounded-xl p-4">
                <div className="flex items-start gap-4">
                    <div className="relative h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <Icon className={cn("w-5 h-5", iconColor)} />
                        {/* Status dot */}
                        <div className={cn("absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900",
                            variant === 'success' ? "bg-emerald-500" :
                                variant === 'error' ? "bg-red-500" :
                                    variant === 'warning' ? "bg-amber-500" : "bg-blue-500"
                        )} />
                    </div>

                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                {title && (
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                        {title}
                                    </p>
                                )}
                                <p className={cn("text-[13px] text-zinc-500 dark:text-zinc-400", title ? "mt-0.5" : "")}>
                                    {description}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => toast.dismiss(id)}
                            type="button"
                            className="rounded-lg flex items-center justify-center h-8 w-8 p-0 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
