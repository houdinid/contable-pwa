"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { ServiceOrderForm } from "@/components/service-orders/service-order-form";
import { FileText, Loader2, Trash, Printer } from "lucide-react";
import type { Invoice } from "@/types";
import { generatePDF } from "@/lib/pdf-generator";

export default function EditServiceOrderPage() {
    const params = useParams();
    const router = useRouter();
    const { serviceOrders, updateServiceOrder, deleteServiceOrder, addInvoice, loadingData, invoices, businessIdentities, contacts } = useData();
    const [converting, setConverting] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
            const invoiceCount = invoices.filter(i => i.type === 'invoice').length;
            const nextNumber = (invoiceCount + 1).toString().padStart(4, '0');

            // Map Service Order to Invoice
            const invoiceData: Omit<Invoice, "id" | "createdAt"> = {
                number: nextNumber,
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

            await updateServiceOrder(orderId, { status: 'billed', invoiceId: 'generated' });

            alert(`Factura #${nextNumber} generada exitosamente.`);
            router.push("/dashboard/sales");

        } catch (error) {
            console.error(error);
            alert("Error al convertir a factura.");
        } finally {
            setConverting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta orden de servicio? Esta acción no se puede deshacer.")) return;

        setDeleting(true);
        try {
            await deleteServiceOrder(orderId);
            router.push("/dashboard/service-orders");
        } catch (error) {
            console.error(error);
            alert("Error al eliminar la orden de servicio.");
            setDeleting(false);
        }
    };

    const handleDownloadPDF = async () => {
        setIsGeneratingPdf(true);
        try {
            const filename = `OrdenServicio-${order.number}.pdf`;
            await generatePDF({ elementId: 'service-order-pdf-content', filename });
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error al generar el PDF: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const emitter = businessIdentities.find(b => b.id === order.businessIdentityId) || businessIdentities[0];
    const contact = contacts.find(c => c.id === order.clientId);

    return (
        <div className="space-y-6">
            <div className="max-w-4xl mx-auto flex justify-end gap-2">
                <button
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPdf}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
                >
                    {isGeneratingPdf ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
                    PDF
                </button>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm text-sm font-medium"
                >
                    {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash size={16} />}
                    Eliminar
                </button>
                {order.status !== 'billed' && !order.invoiceId && (
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

            {/* Hidden PDF Template */}
            <div className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
                <div id="service-order-pdf-content" className="bg-white text-black p-8 w-[800px] font-sans">
                    <div className="flex justify-between items-start mb-6 border-b pb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-1">
                                {emitter?.name || "SYSCOM COLOMBIA S.A.S."}
                            </h1>
                            <div className="text-gray-600 text-sm space-y-0.5">
                                <p>NIT: {emitter?.taxId}</p>
                                <p>{emitter?.address}</p>
                                <p>{emitter?.phone} | {emitter?.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <h2 className="text-2xl font-light text-gray-500 uppercase tracking-wider mb-1">
                                Orden de Servicio
                            </h2>
                            <div className="font-medium text-lg">
                                #{order.number}
                            </div>
                            <div className="text-gray-600 text-sm mt-0.5">
                                Fecha: {order.date?.split('T')[0]}
                            </div>
                            <div className={`mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-semibold ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'billed' ? 'bg-purple-100 text-purple-800' :
                                    order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                }`}>
                                {order.status === 'completed' ? 'COMPLETADA' :
                                    order.status === 'billed' ? 'FACTURADA' :
                                        order.status === 'in_progress' ? 'EN PROGRESO' :
                                            order.status === 'cancelled' ? 'CANCELADA' : 'PENDIENTE'}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 flex justify-between">
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Cliente</h3>
                            <p className="font-semibold text-base">{order.clientName}</p>
                            {contact ? (
                                <div className="text-gray-600 text-sm mt-1 space-y-0.5">
                                    {contact.taxId && <p>NIT: {contact.taxId}</p>}
                                    {contact.address && <p>{contact.address}</p>}
                                    {order.clientPhone && <p>{order.clientPhone}</p>}
                                    {order.clientEmail && <p>{order.clientEmail}</p>}
                                </div>
                            ) : (
                                <div className="text-gray-600 text-sm mt-1 space-y-0.5">
                                    {order.clientPhone && <p>{order.clientPhone}</p>}
                                    {order.clientEmail && <p>{order.clientEmail}</p>}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Detalles</h3>
                            <div className="text-gray-600 text-sm space-y-0.5">
                                {order.estimatedDate && <p><span className="font-medium">Entrega Estimada:</span> {order.estimatedDate.split('T')[0]}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <table className="w-full text-sm text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-gray-300">
                                    <th className="py-2 font-semibold w-[60%]">Descripción</th>
                                    <th className="py-2 text-center font-semibold w-[10%]">Cant.</th>
                                    <th className="py-2 text-right font-semibold w-[15%]">V. Unitario</th>
                                    <th className="py-2 text-right font-semibold w-[15%]">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {order.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2 break-words whitespace-pre-wrap">{item.description}</td>
                                        <td className="py-2 text-center text-gray-700">{item.quantity}</td>
                                        <td className="py-2 text-right text-gray-700">${item.price.toLocaleString()}</td>
                                        <td className="py-2 text-right font-medium">${item.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end mb-8">
                        <div className="w-56 space-y-1.5">
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span>Subtotal</span>
                                <span>${order.subtotal.toLocaleString()}</span>
                            </div>
                            {order.tax > 0 && (
                                <div className="flex justify-between text-gray-600 text-sm">
                                    <span>IVA</span>
                                    <span>${order.tax.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-300">
                                <span>Total</span>
                                <span>${order.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-300 pt-4">
                        <div className="text-gray-600 text-xs leading-tight">
                            {order.notes && (
                                <div className="mb-2">
                                    <p className="font-bold mb-0.5">Notas de la Orden:</p>
                                    <p className="whitespace-pre-wrap">{order.notes}</p>
                                </div>
                            )}
                            {order.technicianNotes && (
                                <div className="mb-2">
                                    <p className="font-bold mb-0.5">Reporte Técnico:</p>
                                    <p className="whitespace-pre-wrap">{order.technicianNotes}</p>
                                </div>
                            )}
                            <p className="mt-4 text-center text-gray-400">Generado por Contable PWA</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
