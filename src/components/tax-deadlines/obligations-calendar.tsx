"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid, List, Send, Info } from "lucide-react";
import { TaxDeadline, TaxType } from "@/types/infrastructure";
import Link from "next/link";

interface ObligationsCalendarProps {
    deadlines: TaxDeadline[];
    taxTypes: TaxType[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export function ObligationsCalendar({ deadlines, taxTypes, onEdit, onDelete }: ObligationsCalendarProps) {
    const [view, setView] = useState<'month' | 'year'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const today = new Date();

    // Helper: get color for a tax type
    const getColorForTaxType = (typeName: string) => {
        const t = taxTypes.find(t => t.name === typeName);
        return t?.color || "#3b82f6"; // default blue
    };

    // Helper: check if two dates are same day
    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    };

    const getDeadlinesForDate = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const dStr = String(date.getDate()).padStart(2, '0');
        const dateString = `${y}-${m}-${dStr}`;

        return deadlines.filter(d => {
            if (!d.expirationDate) return false;
            const expStr = d.expirationDate.split('T')[0];
            return expStr === dateString;
        });
    };

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    const prevYear = () => setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
    const nextYear = () => setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));

    const handleSendWhatsApp = (deadline: TaxDeadline) => {
        const phone = deadline.contactNumber ? deadline.contactNumber.replace(/\D/g, '') : '';
        const dateStr = new Date(deadline.expirationDate + 'T00:00:00').toLocaleDateString();
        const amountStr = deadline.amount ? ` por un valor estimado de $${deadline.amount}` : '';
        const message = `Recordatorio: Tienes un vencimiento de *${deadline.taxType}* para la empresa *${deadline.businessName}* el día *${dateStr}*${amountStr}.`;
        
        const url = phone 
            ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
            : `https://wa.me/?text=${encodeURIComponent(message)}`;
            
        window.open(url, '_blank');
    };

    // --- MONTH VIEW LOGIC ---
    const renderMonthView = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // empty slots before first day
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="min-h-[50px] sm:h-24 bg-muted/10 border border-border/50 rounded-lg"></div>);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dayDeadlines = getDeadlinesForDate(date);
            const isToday = isSameDay(date, today);
            const isSelected = selectedDate && isSameDay(date, selectedDate);

            days.push(
                <div 
                    key={i} 
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[50px] sm:h-24 p-1 sm:p-2 border rounded-lg cursor-pointer transition-all flex flex-col relative overflow-hidden group
                        ${isToday ? 'border-amber-500 bg-amber-50/10' : 'border-border/50 hover:border-amber-300 bg-card'}
                        ${isSelected ? 'ring-2 ring-amber-500 shadow-md' : ''}
                    `}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`text-[10px] sm:text-sm font-medium ${isToday ? 'bg-amber-500 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center' : 'text-muted-foreground group-hover:text-foreground'}`}>
                            {i}
                        </span>
                        {dayDeadlines.length > 0 && (
                            <span className="text-[9px] sm:text-[10px] font-bold bg-muted px-1 sm:px-1.5 py-0.5 rounded-full hidden sm:inline-block">
                                {dayDeadlines.length}
                            </span>
                        )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-1 hide-scrollbar hidden sm:block">
                        {dayDeadlines.map((d) => {
                            const color = getColorForTaxType(d.taxType);
                            return (
                                <div key={d.id} className="text-[10px] truncate px-1.5 py-0.5 rounded flex items-center gap-1 font-medium" style={{ backgroundColor: `${color}20`, color: color }}>
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                                    <span className="truncate">{d.taxType}</span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Mobile only dots */}
                    <div className="flex sm:hidden flex-wrap gap-1 mt-auto mb-0.5 justify-center">
                        {dayDeadlines.map((d) => {
                            const color = getColorForTaxType(d.taxType);
                            return (
                                <div key={d.id} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold capitalize">{currentDate.toLocaleString('es', { month: 'long', year: 'numeric' })}</h2>
                    <div className="flex gap-2">
                        <button onClick={prevMonth} className="p-2 hover:bg-muted rounded-lg border border-border"><ChevronLeft size={20}/></button>
                        <button onClick={nextMonth} className="p-2 hover:bg-muted rounded-lg border border-border"><ChevronRight size={20}/></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center text-[10px] sm:text-xs font-bold text-muted-foreground uppercase">
                    <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {days}
                </div>
            </div>
        );
    };

    // --- YEAR VIEW LOGIC ---
    const renderYearView = () => {
        const year = currentDate.getFullYear();
        const months = [];

        for (let m = 0; m < 12; m++) {
            const firstDay = new Date(year, m, 1).getDay();
            const daysInMonth = new Date(year, m + 1, 0).getDate();
            
            const days = [];
            for (let i = 0; i < firstDay; i++) days.push(<div key={`e${i}`} className="w-4 h-4"></div>);
            
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(year, m, i);
                const dayDeadlines = getDeadlinesForDate(date);
                
                // If there are deadlines, show the color of the first one, or mix
                let bgClass = "bg-muted/30 border border-border/50";
                let style = {};
                if (dayDeadlines.length > 0) {
                    const color = getColorForTaxType(dayDeadlines[0].taxType);
                    style = { backgroundColor: color };
                    bgClass = "shadow-sm";
                } else if (isSameDay(date, today)) {
                    bgClass = "border border-amber-500 bg-transparent";
                }

                days.push(
                    <div 
                        key={i} 
                        className={`w-4 h-4 rounded-sm cursor-pointer hover:opacity-80 transition-opacity ${bgClass}`}
                        style={style}
                        title={`${i} ${new Date(year, m, 1).toLocaleString('es',{month:'short'})} - ${dayDeadlines.length} obligaciones`}
                        onClick={() => {
                            setCurrentDate(new Date(year, m, 1));
                            setSelectedDate(date);
                            setView('month');
                        }}
                    ></div>
                );
            }

            months.push(
                <div key={m} className="p-4 border border-border rounded-xl bg-card hover:border-amber-300 transition-colors cursor-pointer" onClick={() => { setCurrentDate(new Date(year, m, 1)); setView('month'); }}>
                    <h3 className="text-sm font-bold capitalize mb-3">{new Date(year, m, 1).toLocaleString('es', { month: 'long' })}</h3>
                    <div className="grid grid-cols-7 gap-1">
                        {days}
                    </div>
                </div>
            );
        }

        return (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                 <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">{year}</h2>
                    <div className="flex gap-2">
                        <button onClick={prevYear} className="p-2 hover:bg-muted rounded-lg border border-border"><ChevronLeft size={20}/></button>
                        <button onClick={nextYear} className="p-2 hover:bg-muted rounded-lg border border-border"><ChevronRight size={20}/></button>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {months}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Calendar Area */}
            <div className="flex-1 space-y-4">
                {/* View Switcher */}
                <div className="flex justify-end gap-2 bg-muted/30 p-1.5 rounded-xl border border-border w-fit ml-auto">
                    <button 
                        onClick={() => setView('month')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'month' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <CalendarIcon size={16} />
                        Mes
                    </button>
                    <button 
                        onClick={() => setView('year')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'year' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        <Grid size={16} />
                        Año
                    </button>
                </div>

                {view === 'month' ? renderMonthView() : renderYearView()}
            </div>

            {/* Sidebar: Day View Details */}
            {selectedDate && (
                <div className="w-full lg:w-96 bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-fit">
                    <div className="p-5 border-b border-border bg-amber-50/50 dark:bg-amber-900/10 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg">{selectedDate.toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                            <p className="text-sm text-muted-foreground">Detalle del día</p>
                        </div>
                        <button onClick={() => setSelectedDate(null)} className="text-muted-foreground hover:text-foreground text-sm font-medium">Cerrar</button>
                    </div>
                    <div className="p-5 overflow-y-auto max-h-[600px] space-y-4">
                        {getDeadlinesForDate(selectedDate).length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
                                <Info size={32} className="mb-2 opacity-20" />
                                <p>No hay obligaciones registradas para este día.</p>
                            </div>
                        ) : (
                            getDeadlinesForDate(selectedDate).map(deadline => {
                                const color = getColorForTaxType(deadline.taxType);
                                return (
                                    <div key={deadline.id} className="p-4 rounded-xl border border-border bg-background hover:border-amber-200 transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                                                <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{deadline.taxType}</span>
                                            </div>
                                            {deadline.amount && (
                                                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                                                    ${deadline.amount.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-base leading-tight mb-1">{deadline.businessName}</h4>
                                        <p className="text-sm text-muted-foreground font-mono mb-4">NIT: {deadline.taxId}</p>
                                        
                                        <div className="flex items-center justify-between pt-3 border-t border-border">
                                            <div className="flex gap-1.5">
                                                <Link 
                                                    href={`/dashboard/tax-deadlines/${deadline.id}/edit`}
                                                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    Editar
                                                </Link>
                                            </div>
                                            
                                            {/* WhatsApp Button */}
                                            <button 
                                                onClick={() => handleSendWhatsApp(deadline)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800"
                                            >
                                                <Send size={14} />
                                                Enviar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
