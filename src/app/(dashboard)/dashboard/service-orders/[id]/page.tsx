"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { ServiceOrderForm } from "@/components/service-orders/service-order-form";
import { FileText, Loader2 } from "lucide-react";
import type { Invoice } from "@/types";

export default function EditServiceOrderPage() {
    const params = useParams();
    const router = useRouter();
    const { serviceOrders, updateServiceOrder, addInvoice, loadingData } = useData();
    const [converting, setConverting] = useState(false);

    const orderId = typeof params.id === 'string' ? params.id : '';
    const order = serviceOrders.find(o => o.id === orderId);

    if (loadingData) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;
    if (!order) return <div className="p-8 text-center text-red-500">Orden no encontrada.</div>;

    const handleSubmit = async (data: any) => {
        await updateServiceOrder(orderId, data);
    };

    const handleConvertToInvoice = async () => {
        if (!confirm("¿Estás seguro de generar una factura a partir de esta orden de servicio?")) return;

        setConverting(true);
        try {
            // Map Service Order to Invoice
            const invoiceData: Omit<Invoice, "id" | "createdAt"> = {
                number: String(Date.now()).slice(-6), // Or strictly sequential if implemented
                date: new Date().toISOString().split('T')[0],
                // dueDate? Default to date or date + credit
                contactId: order.clientId,
                contactName: order.clientName,
                // map items
                items: order.items.map(item => ({
                    id: crypto.randomUUID(),
                    description: item.description,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total
                })),
                subtotal: order.subtotal,
                tax: order.tax,
                total: order.total,
                status: 'pending', // Default to pending payment
                type: 'invoice',
                issuerId: order.businessIdentityId,
                notes: `Generado desde Orden de Servicio ${order.number}. ${order.notes || ''}`
            };

            await addInvoice(invoiceData);

            // Note: In a real app we'd get the ID back from addInvoice to redirect specificially.
            // But addInvoice returns void in our context currently.
            // We should modify Context to return ID, OR just update status here and let user find it.
            // Wait, my context update returned ID for addContact but NOT for addInvoice. 
            // I should just trust it's added. To improve UX I might want to find the latest invoice or modify context.
            // For now, let's just mark order as billed and redirect to sales list.

            await updateServiceOrder(orderId, { status: 'billed' });

            alert("Factura generada exitosamente.");
            router.push("/dashboard/sales");

        } catch (error) {
            console.error(error);
            alert("Error al convertir a factura.");
        } finally {
            setConverting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="max-w-4xl mx-auto flex justify-end gap-2">
                {order.status === 'completed' && !order.invoiceId && (
                    <button
                        onClick={handleConvertToInvoice}
                        disabled={converting}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
                    >
                        {converting ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        Generar Factura
                    </button>
                )}
                {order.status === 'billed' && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-lg text-sm font-medium">
                        <FileText size={16} />
                        Orden Facturada
                    </div>
                )}
            </div>

            <ServiceOrderForm
                initialData={order}
                onSubmit={handleSubmit}
                isEditing
            />
        </div>
    );
}
