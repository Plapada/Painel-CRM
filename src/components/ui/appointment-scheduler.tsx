"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Clock, Globe, Video } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface TimeSlot {
    time: string
    available: boolean
    data?: any // Extra data for the slot (e.g., appointment details)
}

export interface AvailableDate {
    date: number
    hasSlots: boolean
}

export interface AppointmentSchedulerProps {
    userName?: string
    userAvatar?: string
    meetingTitle?: string
    meetingType?: string
    duration?: string
    timezone?: string
    availableDates: AvailableDate[]
    timeSlots: TimeSlot[]
    onDateSelect?: (date: number) => void
    onTimeSelect?: (time: string, slot?: TimeSlot) => void
    onTimezoneChange?: (timezone: string) => void
    onMonthChange?: (month: number, year: number) => void
    brandName?: string
    renderSlot?: (slot: TimeSlot) => React.ReactNode
    loading?: boolean
    hideSidebar?: boolean
}

export function AppointmentScheduler({
    userName = "Dr. Pedro",
    userAvatar,
    meetingTitle = "Agendamentos",
    meetingType = "Presencial / Online",
    duration = "30 min",
    timezone = "America/Sao_Paulo",
    availableDates,
    timeSlots,
    onDateSelect,
    onTimeSelect,
    onTimezoneChange,
    onMonthChange,
    brandName = "Antigravity CRM",
    renderSlot,
    loading = false,
    hideSidebar = false,
}: AppointmentSchedulerProps) {
    const now = new Date()
    const [currentMonth, setCurrentMonth] = useState(now.getMonth())
    const [currentYear, setCurrentYear] = useState(now.getFullYear())
    const [selectedDate, setSelectedDate] = useState(now.getDate())
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [timeFormat, setTimeFormat] = useState<"12h" | "24h">("24h")

    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro",
    ]

    const dayNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"]

    const getDaysInMonth = (month: number, year: number) => {
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (month: number, year: number) => {
        return new Date(year, month, 1).getDay()
    }

    const handlePrevMonth = () => {
        let newMonth = currentMonth
        let newYear = currentYear
        if (currentMonth === 0) {
            newMonth = 11
            newYear = currentYear - 1
        } else {
            newMonth = currentMonth - 1
        }
        setCurrentMonth(newMonth)
        setCurrentYear(newYear)
        onMonthChange?.(newMonth, newYear)
    }

    const handleNextMonth = () => {
        let newMonth = currentMonth
        let newYear = currentYear
        if (currentMonth === 11) {
            newMonth = 0
            newYear = currentYear + 1
        } else {
            newMonth = currentMonth + 1
        }
        setCurrentMonth(newMonth)
        setCurrentYear(newYear)
        onMonthChange?.(newMonth, newYear)
    }

    const handleDateClick = (date: number) => {
        // Allow selecting any date, not just those with slots, so we can see empty days too if needed
        // Or keep behavior to only select available?
        // For admin, we might want to see any day.
        // But let's stick to "availableDates" logic for highlighting, but allow clicking if we want to add?
        // For now, let's just update selectedDate and trigger callback
        setSelectedDate(date)
        onDateSelect?.(date)
    }

    const handleTimeClick = (time: string, slot: TimeSlot) => {
        setSelectedTime(time)
        onTimeSelect?.(time, slot)
    }

    const daysInMonth = getDaysInMonth(currentMonth, currentYear)
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear)

    const calendarDays = []
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
        calendarDays.push(i)
    }

    const getSelectedDayName = () => {
        const date = new Date(currentYear, currentMonth, selectedDate)
        return date.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase()
    }

    const getSelectedDateFormatted = () => {
        const date = new Date(currentYear, currentMonth, selectedDate)
        return date.toLocaleDateString("pt-BR", { month: "short", day: "numeric" })
    }

    const formatTime = (time: string) => {
        if (timeFormat === "24h") return time

        const [hours, minutes] = time.split(":")
        const hour = Number.parseInt(hours)
        const ampm = hour >= 12 ? "PM" : "AM"
        const hour12 = hour % 12 || 12
        return `${hour12}:${minutes} ${ampm}`
    }

    return (
        <div className="flex flex-col lg:flex-row w-full h-full min-h-[600px] gap-0 rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            {/* Left Panel - Meeting Info */}
            {!hideSidebar && (
                <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-muted/10 p-6 space-y-6">
                    <div className="flex items-center gap-3 animate-fade-in">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{userName}</span>
                    </div>

                    <div className="space-y-4 animate-fade-in animate-delay-100">
                        <h2 className="text-2xl font-semibold text-foreground">{meetingTitle}</h2>

                        <div className="space-y-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Video className="h-4 w-4" />
                                <span>{meetingType}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{duration}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                <button
                                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                                    onClick={() => onTimezoneChange?.(timezone)}
                                >
                                    <span>{timezone}</span>
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Center Panel - Calendar */}
            <div className="flex-1 p-4 md:p-6 border-r border-border">
                <div className="space-y-4">
                    {/* Month Navigation */}
                    <div className="flex items-center justify-between animate-fade-in">
                        <h3 className="text-lg font-medium text-foreground">
                            {monthNames[currentMonth]} <span className="text-muted-foreground">{currentYear}</span>
                        </h3>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {/* Day Headers */}
                        {dayNames.map((day) => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}

                        {/* Calendar Days */}
                        {calendarDays.map((day, index) => {
                            if (day === null) {
                                return <div key={`empty-${index}`} />
                            }

                            const isAvailable = availableDates.find((d) => d.date === day && d.hasSlots)
                            const isSelected = day === selectedDate
                            const hasIndicator = isAvailable && !isSelected

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    className={cn(
                                        "relative h-12 rounded-lg text-sm font-medium transition-all duration-200",
                                        "hover:scale-105 active:scale-95",
                                        isSelected && "bg-primary text-primary-foreground shadow-lg scale-105",
                                        !isSelected && "bg-secondary/30 text-foreground hover:bg-secondary",
                                        // !isAvailable && "text-muted-foreground/40", // Don't disable, just style differently
                                        "animate-fade-in",
                                    )}
                                    style={{
                                        animationDelay: `${index * 10}ms`,
                                    }}
                                >
                                    {day}
                                    {hasIndicator && (
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Right Panel - Time Slots */}
            <div className="w-full lg:w-80 bg-card p-6 flex flex-col">
                <div className="flex items-center justify-between animate-fade-in mb-4">
                    <div className="text-sm">
                        <span className="font-medium text-foreground">{getSelectedDayName()}</span>
                        <span className="text-muted-foreground">, {getSelectedDateFormatted()}</span>
                    </div>
                    <div className="flex gap-1 rounded-lg bg-secondary p-1">
                        <button
                            onClick={() => setTimeFormat("12h")}
                            className={cn(
                                "px-2 py-1 text-xs font-medium rounded transition-colors",
                                timeFormat === "12h" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            12h
                        </button>
                        <button
                            onClick={() => setTimeFormat("24h")}
                            className={cn(
                                "px-2 py-1 text-xs font-medium rounded transition-colors",
                                timeFormat === "24h" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground",
                            )}
                        >
                            24h
                        </button>
                    </div>
                </div>

                {/* Time Slots */}
                <div className="space-y-2 overflow-y-auto pr-2 scrollbar-thin flex-1">
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
                    ) : timeSlots.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">Nenhum agendamento.</div>
                    ) : (
                        timeSlots.map((slot, index) => {
                            const isSelected = slot.time === selectedTime
                            return (
                                <div
                                    key={`${slot.time}-${index}`}
                                    className="animate-fade-in"
                                    style={{ animationDelay: `${index * 30}ms` }}
                                >
                                    {renderSlot ? (
                                        renderSlot(slot)
                                    ) : (
                                        <button
                                            onClick={() => handleTimeClick(slot.time, slot)}
                                            disabled={!slot.available}
                                            className={cn(
                                                "w-full py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                                                "hover:scale-[1.02] active:scale-[0.98]",
                                                isSelected && "bg-primary text-primary-foreground shadow-lg scale-[1.02]",
                                                !isSelected && slot.available && "bg-secondary/50 text-foreground hover:bg-secondary",
                                                !slot.available && "text-muted-foreground/40 cursor-not-allowed",
                                            )}
                                        >
                                            {formatTime(slot.time)}
                                        </button>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Removed powered by footer */}
            </div>
        </div>
    )
}
