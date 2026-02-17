"use client";

import * as React from "react";
import { Moon, Sun, Monitor, Sunset } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
    const { setTheme, theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    return (
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 gap-1">
            <button
                onClick={() => setTheme("light")}
                className={`p-2 rounded-md transition-all ${theme === "light"
                        ? "bg-white text-yellow-500 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    }`}
                title="Tema Claro"
            >
                <Sun size={18} />
            </button>
            <button
                onClick={() => setTheme("warm")}
                className={`p-2 rounded-md transition-all ${theme === "warm"
                        ? "bg-white text-orange-500 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    }`}
                title="Modo Lectura (Cálido)"
            >
                <Sunset size={18} />
            </button>
            <button
                onClick={() => setTheme("system")}
                className={`p-2 rounded-md transition-all ${theme === "system"
                        ? "bg-white dark:bg-gray-600 text-indigo-500 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    }`}
                title="Automático"
            >
                <Monitor size={18} />
            </button>
            <button
                onClick={() => setTheme("dark")}
                className={`p-2 rounded-md transition-all ${theme === "dark"
                        ? "bg-gray-700 text-purple-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                    }`}
                title="Tema Oscuro"
            >
                <Moon size={18} />
            </button>
        </div>
    );
}
