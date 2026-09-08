"use client";

import { useEffect, useRef } from "react";
import { useData } from "@/context/data-context";

export function useObligationAlerts() {
    const { taxDeadlines } = useData();
    const checkedRef = useRef(false);

    useEffect(() => {
        // Prevent running multiple times per session unless data changes significantly
        // For a simple PWA, we just check once when the app loads or data refreshes
        if (typeof window === 'undefined' || taxDeadlines.length === 0) return;

        const checkAlerts = async () => {
            // Check Notification permission
            if (!("Notification" in window)) {
                console.log("Este navegador no soporta notificaciones de escritorio");
                return;
            }

            let permission = Notification.permission;
            if (permission === "default") {
                permission = await Notification.requestPermission();
            }

            if (permission !== "granted") return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Get obligations that are due soon based on their alert_days_before setting
            const upcoming = taxDeadlines.filter(deadline => {
                // Ignore completed
                if (deadline.completed) return false;

                const expDate = new Date(deadline.expirationDate + 'T00:00:00');
                const diffTime = expDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                const alertDays = deadline.alertDaysBefore ?? 3;

                // Show alert if the deadline is between today and the alert limit, or exactly overdue
                return diffDays >= 0 && diffDays <= alertDays;
            });

            if (upcoming.length > 0) {
                // To avoid spamming, we only notify once per session/day 
                // We can use sessionStorage to track if we already alerted today
                const lastAlertDate = sessionStorage.getItem('last_obligation_alert_date');
                const todayStr = today.toISOString().split('T')[0];

                if (lastAlertDate !== todayStr) {
                    sessionStorage.setItem('last_obligation_alert_date', todayStr);
                    
                    if (upcoming.length === 1) {
                        const d = upcoming[0];
                        new Notification("Vencimiento Próximo", {
                            body: `La obligación ${d.taxType} para ${d.businessName} vence en pocos días.`,
                            icon: "/icon-192x192.png" // Assuming standard PWA icon
                        });
                    } else {
                        new Notification("Vencimientos Próximos", {
                            body: `Tienes ${upcoming.length} obligaciones que vencen pronto. Revisa tu calendario.`,
                            icon: "/icon-192x192.png"
                        });
                    }
                }
            }
        };

        checkAlerts();
    }, [taxDeadlines]);

    return null;
}
