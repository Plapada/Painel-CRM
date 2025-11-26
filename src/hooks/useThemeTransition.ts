"use client"

import { useTheme } from "next-themes"
import { useCallback } from "react"

interface ViewTransition {
    ready: Promise<void>
    finished: Promise<void>
    updateCallbackDone: Promise<void>
}

interface Document {
    startViewTransition?: (callback: () => void | Promise<void>) => ViewTransition
}

export function useThemeTransition() {
    const { setTheme, theme } = useTheme()

    const transitionTheme = useCallback(
        async (newTheme: string, centerX?: number, centerY?: number) => {
            const doc = document as Document

            // Check if View Transition API is supported
            if (!doc.startViewTransition) {
                // Fallback: direct theme change without animation
                setTheme(newTheme)
                return
            }

            // Calculate center point (default to center of viewport)
            const x = centerX ?? window.innerWidth / 2
            const y = centerY ?? window.innerHeight / 2

            // Calculate maximum distance for the circular reveal
            const maxDistance = Math.hypot(
                Math.max(x, window.innerWidth - x),
                Math.max(y, window.innerHeight - y)
            )

            // Start the view transition
            const transition = doc.startViewTransition(() => {
                setTheme(newTheme)
            })

            // Wait for the transition to be ready
            await transition.ready

            // Animate the reveal using a circular clip-path
            document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${maxDistance}px at ${x}px ${y}px)`,
                    ],
                },
                {
                    duration: 600,
                    easing: "ease-in-out",
                    pseudoElement: "::view-transition-new(root)",
                }
            )

            return transition.finished
        },
        [setTheme]
    )

    return { transitionTheme, theme, setTheme }
}
