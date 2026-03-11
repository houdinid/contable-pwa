"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/navigation/sidebar";
import { Menu } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [forceLoadingFinished, setForceLoadingFinished] = useState(false);
    const router = useRouter();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        console.log("DashboardLayout checking in... authLoading:", authLoading);
        // Failsafe: if it stays in loading for more than 5 seconds, force it to finish
        const timer = setTimeout(() => {
            console.log("DashboardLayout: Failsafe triggered, forcing loading to finish");
            setForceLoadingFinished(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [authLoading]);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [authLoading, isAuthenticated, router]);

    const showLoading = authLoading && !forceLoadingFinished;

    if (showLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background transition-colors">
                <div className="text-xl mb-4">Cargando...</div>
                <div className="text-xs text-muted-foreground">Auth State: {authLoading ? 'Waiting' : 'Ready'}</div>
                <button
                    onClick={() => setForceLoadingFinished(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
                >
                    Forzar entrada
                </button>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null; // Will redirect
    }

    return (
        <div className="flex bg-background min-h-screen transition-colors duration-300">
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-40 flex items-center px-4 justify-between print:hidden transition-colors duration-300">
                <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">LG Ingenieros</h1>
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-foreground/80 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-x-hidden pt-20 md:pt-8">
                {children}
            </main>
        </div>
    );
}
