"use client";

import Link from "next/link";
import { useData } from "@/context/data-context";
import { Plus, FileText, Calendar, User, Search, Wrench } from "lucide-react";
import { useState } from "react";

export default function ServiceOrdersPage() {
    const { serviceOrders, loadingData } = useData();
    const [searchTerm, setSearchTerm] = useState("");

    if (loadingData) {
        return <div className="p-8 text-center text-muted-foreground">Cargando órdenes de servicio...</div>;
    }

    const filteredOrders = serviceOrders.filter(order =>
        order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.number.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Órdenes de Servicio</h1>
                    <p className="text-muted-foreground">Gestiona los servicios y reparaciones.</p>
                </div>
                <Link
                    href="/dashboard/service-orders/create"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={20} />
                    Nueva Orden
                </Link>
            </div>

            {/* Search and Filter */}
            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center gap-4 bg-muted/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente o número..."
                            className="w-full pl-10 pr-4 py-2 border border-border bg-background rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Orden</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Recepción</th>
                                <th className="px-6 py-4">Entrega Est.</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                        No se encontraron órdenes de servicio.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-6 py-4 font-medium text-foreground flex items-center gap-2">
                                            <Wrench size={16} className="text-indigo-500" />
                                            {order.number}
                                        </td>
                                        <td className="px-6 py-4 text-foreground">{order.clientName}</td>
                                        <td className="px-6 py-4 text-muted-foreground">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-muted-foreground">
                                            {order.estimatedDate ? new Date(order.estimatedDate).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status} />
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-foreground">
                                            ${order.total.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <Link href={`/dashboard/service-orders/${order.id}`} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium transition-colors">
                                                Ver / Editar
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredOrders.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border border-border">
                        No hay órdenes registradas.
                    </div>
                ) : (
                    filteredOrders.map((order) => (
                        <div key={order.id} className="bg-card p-4 rounded-lg shadow-sm border border-border space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    <Wrench size={20} className="text-indigo-500" />
                                    <div>
                                        <span className="font-bold text-foreground block">
                                            {order.number}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(order.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <StatusBadge status={order.status} />
                            </div>

                            <div className="pt-2">
                                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <User size={14} className="text-muted-foreground" />
                                    {order.clientName}
                                </p>
                            </div>

                            <div className="flex justify-between items-center border-t border-border pt-3 mt-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">Total</p>
                                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                        ${order.total.toLocaleString()}
                                    </p>
                                </div>
                                <Link
                                    href={`/dashboard/service-orders/${order.id}`}
                                    className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Ver Detalle
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
        completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
        billed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
        cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };

    const labels = {
        pending: "Pendiente",
        in_progress: "En Progreso",
        completed: "Completado",
        billed: "Facturado",
        cancelled: "Cancelado",
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}>
            {labels[status as keyof typeof labels] || status}
        </span>
    );
}
