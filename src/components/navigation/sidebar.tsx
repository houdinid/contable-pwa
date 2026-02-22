"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
    LayoutDashboard,
    Users,
    ShoppingCart,
    Receipt,
    BarChart3,
    Settings,
    LogOut,
    Package,
    Wifi,
    Wallet,
    FileText,
    Camera,
    MonitorSmartphone,
    Shield,
    Mail,
    Key,
    Landmark
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const menuGroups = [
    {
        title: "Principal",
        items: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            { name: "Inventario", href: "/dashboard/inventory", icon: Package },
            { name: "Compras", href: "/dashboard/purchases", icon: ShoppingCart },
            { name: "Ordenes de Servicio", href: "/dashboard/service-orders", icon: FileText },
            { name: "Contactos", href: "/dashboard/contacts", icon: Users },
            { name: "Ingresos", href: "/dashboard/sales", icon: ShoppingCart },
            { name: "Gastos", href: "/dashboard/expenses", icon: Receipt },
            { name: "Tesorería", href: "/dashboard/treasury", icon: Wallet },
            { name: "Reportes", href: "/dashboard/reports", icon: BarChart3 },
            { name: "Configuración", href: "/dashboard/settings", icon: Settings },
        ]
    },
    {
        title: "Infraestructura y Soporte",
        items: [
            { name: "Redes WiFi", href: "/dashboard/wifi", icon: Wifi },
            { name: "CCTV", href: "/dashboard/cctv", icon: Camera },
            { name: "Acceso Remoto", href: "/dashboard/remote-access", icon: MonitorSmartphone },
            { name: "Antivirus", href: "/dashboard/antivirus", icon: Shield },
            { name: "Cuentas Correo", href: "/dashboard/corporate-emails", icon: Mail },
            { name: "Lic. Software", href: "/dashboard/software-licenses", icon: Key },
        ]
    },
    {
        title: "Gestión Administrativa",
        items: [
            { name: "Obligaciones", href: "/dashboard/tax-deadlines", icon: Landmark },
        ]
    }
];

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col h-screen transition-transform duration-300 ease-in-out
            ${isOpen ? "translate-x-0" : "-translate-x-full"}
            md:translate-x-0 md:fixed md:inset-y-0 md:left-0 md:shadow-none shadow-xl
            print:hidden
        `}>
            <div className="h-24 flex flex-col items-center justify-center border-b border-border bg-card/50">
                {/* Logo - User needs to add logo.png to public folder */}
                <img
                    src="/logo.png"
                    alt="Logo Empresa"
                    className="h-12 w-auto object-contain mb-1"
                    onError={(e) => {
                        // Fallback if image not found
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">LG Ingenieros</h1>
            </div>

            <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
                {menuGroups.map((group, idx) => (
                    <div key={idx}>
                        <h3 className="px-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                            {group.title}
                        </h3>
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onClose} // Auto-close on mobile click
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                            ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                                            }`}
                                    >
                                        <Icon size={20} />
                                        {item.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-border bg-gray-50/30 dark:bg-gray-900/30">
                <div className="flex justify-center mb-4">
                    <ThemeToggle />
                </div>

                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mb-4"
                >
                    <LogOut size={20} />
                    Cerrar Sesión
                </button>

                <div className="text-xs text-center text-gray-400 dark:text-gray-500 space-y-1 border-t border-gray-100 dark:border-gray-800 pt-4">
                    <p className="font-semibold text-gray-500 dark:text-gray-400">© 2026 LG Ingenieros</p>
                    <p>Todos los derechos reservados.</p>
                    <p className="text-[10px] text-red-400 dark:text-red-500 font-medium uppercase tracking-wide">
                        Cualquier copia o reproducción es ilegal
                    </p>
                </div>
            </div>
        </aside>
    );
}
