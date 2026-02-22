"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { Printer, ArrowLeft, Mail, Edit, FileText, DollarSign, Upload } from "lucide-react";
import type { Invoice } from "@/types";
import { OCRService } from "@/lib/ocr-service";
import { generatePDF, sharePDF } from "@/lib/pdf-generator";
import { MoneyInput } from "@/components/ui/money-input";

export default function InvoiceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { invoices, loadingData, businessIdentities, addInvoice, payments, paymentMethods, addPayment, contacts, updateContact } = useData();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const handleDownloadPDF = async () => {
        if (!invoice) return;
        setIsGenerating(true);
        try {
            const filename = `${invoice.type === 'quote' ? 'Cotizacion' : 'Factura'}-${invoice.number}.pdf`;
            await generatePDF({ elementId: 'invoice-content', filename });
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Error al generar el PDF: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSend = async () => {
        if (!invoice) return;
        setIsGenerating(true);
        try {
            const filename = `${invoice.type === 'quote' ? 'Cotizacion' : 'Factura'}-${invoice.number}.pdf`;

            // Copiar el correo al portapapeles si existe, para que el usuario solo tenga que pegarlo
            if (contact?.email) {
                try {
                    await navigator.clipboard.writeText(contact.email);
                } catch (e) {
                    console.error("No se pudo copiar el correo", e);
                }
            }

            await sharePDF({ elementId: 'invoice-content', filename });
        } catch (error) {
            console.error("Error sharing PDF:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const [paymentForm, setPaymentForm] = useState({
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        methodId: '',
        destinationAccountId: '',
        reference: '',
        notes: ''
    });

    useEffect(() => {
        if (!loadingData && params.id) {
            const found = invoices.find(i => i.id === params.id);
            setInvoice(found || null);
        }
    }, [params.id, invoices, loadingData]);

    const relatedPayments = invoice ? payments.filter(p => p.invoiceId === invoice.id) : [];
    const totalPaid = relatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = invoice ? invoice.total - totalPaid : 0;
    const isPaid = remainingBalance <= 0;
    const contact = invoice ? contacts.find(c => c.id === invoice.contactId) : null;
    const emitter = businessIdentities.find(b => b.id === invoice?.issuerId) || businessIdentities[0];


    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!invoice) return;

        const amountToPay = Number(paymentForm.amount);
        const surplus = amountToPay - remainingBalance;
        const actualPaymentAmount = surplus > 0 ? remainingBalance : amountToPay;

        // Validation for Credit Payment
        if (paymentForm.methodId === 'CREDIT_BALANCE') {
            const currentCredit = contact?.creditBalance || 0;
            if (currentCredit < actualPaymentAmount) {
                alert("El saldo a favor es insuficiente para cubrir este monto.");
                return;
            }
        }

        if (confirm(surplus > 0 ? `Se registrará un pago de $${actualPaymentAmount.toLocaleString()} a la factura y $${surplus.toLocaleString()} se abonará al saldo a favor del cliente. ¿Continuar?` : "¿Registrar pago?")) {
            try {
                // 1. Register Invoice Payment
                await addPayment({
                    invoiceId: invoice.id,
                    amount: actualPaymentAmount,
                    date: paymentForm.date,
                    methodId: paymentForm.methodId === 'CREDIT_BALANCE' ? 'CREDIT' : paymentForm.methodId, // Store as special ID or name? context expects ID. Let's assume 'CREDIT' is a valid ID we handle plain text or we should map it. 
                    // Actually DataContext doesn't validate methodId strongly against the array, it's just a string fk. 
                    // But if we want it to look nice, maybe we should Ensure a method exists? 
                    // For now, let's just use the ID 'CREDIT' and we handle display logic if needed or just let it be.
                    destinationAccountId: paymentForm.destinationAccountId,
                    reference: paymentForm.reference,
                    notes: paymentForm.methodId === 'CREDIT_BALANCE' ? `Pagado con Saldo a Favor. ${paymentForm.notes}` : paymentForm.notes
                });

                // 2. Handle Surplus (Add to Credit)
                if (surplus > 0 && contact) {
                    const newBalance = (contact.creditBalance || 0) + surplus;
                    await updateContact(contact.id, { creditBalance: newBalance });
                }

                // 3. Handle Credit Usage (Deduct from Credit)
                if (paymentForm.methodId === 'CREDIT_BALANCE' && contact) {
                    const newBalance = (contact.creditBalance || 0) - actualPaymentAmount;
                    await updateContact(contact.id, { creditBalance: newBalance });
                }

                setShowPaymentModal(false);
                setPaymentForm({
                    amount: 0,
                    date: new Date().toISOString().split('T')[0],
                    methodId: '',
                    destinationAccountId: '',
                    reference: '',
                    notes: ''
                });
                alert("Pago registrado exitosamente");
            } catch (error) {
                alert("Error al registrar pago");
                console.error(error);
            }
        }
    };

    const [isScanning, setIsScanning] = useState(false);

    const handleOCRScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        try {
            const text = await OCRService.recognizeText(file);

            // Parse Amount and Date
            // We pass contacts just in case, but primary goal is Amount/Date
            const parsedData = OCRService.parseTransferReceipt(text, contacts);

            // Find Destination Account (My Account)
            // Logic: OCRService.findSourceAccount searches for My Business Accounts in the text
            const myAccountMatch = OCRService.findSourceAccount(text, businessIdentities);

            setPaymentForm(prev => ({
                ...prev,
                // Update amount if found and looks valid (not greater than remaining)
                amount: parsedData.amount ? Math.min(parsedData.amount, remainingBalance) : prev.amount,
                date: parsedData.date || prev.date,
                destinationAccountId: myAccountMatch.sourceAccountId || prev.destinationAccountId,
                notes: (prev.notes || "") + (prev.notes ? "\n" : "") + `Comprobante escaneado.`
            }));

            // Optional: reference
            // if (parsedData.reference) ... (OCRService doesn't extract reference yet)

        } catch (error) {
            console.error("OCR Error:", error);
            alert("No se pudo leer el comprobante. Intenta ingresarlo manualmente.");
        } finally {
            setIsScanning(false);
        }
    };

    const openPaymentModal = () => {
        if (paymentMethods.length === 0) {
            alert("Primero debes configurar métodos de pago en Configuración.");
            return;
        }
        setPaymentForm(prev => ({
            ...prev,
            amount: remainingBalance,
            methodId: paymentMethods[0].id
        }));
        setShowPaymentModal(true);
    };

    if (loadingData) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Documento no encontrado</h2>
                <button
                    onClick={() => router.back()}
                    className="mt-4 text-indigo-600 hover:underline"
                >
                    Volver atrás
                </button>
            </div>
        );
    }

    const handlePrint = () => {
        window.print();
    };

    const handleConvertToInvoice = async () => {
        if (!invoice) return;
        if (!confirm("¿Deseas convertir esta cotización en una Factura de Venta?")) return;

        try {
            // Find next number
            const invoiceCount = invoices.filter(i => i.type === 'invoice').length;
            const nextNumber = (invoiceCount + 1).toString().padStart(4, '0');

            const { id: _, createdAt: __, ...rest } = invoice;

            // Create new invoice data
            const newInvoiceData = {
                ...rest,
                type: 'invoice' as const,
                number: nextNumber,
                date: new Date().toISOString().split('T')[0],
                status: 'pending' as const,
            };

            await addInvoice(newInvoiceData);

            alert(`Cotización convertida exitosamente a Factura #${nextNumber}`);
            router.push('/dashboard/sales');
        } catch (error) {
            console.error(error);
            alert("Error al convertir la cotización");
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Actions Bar - Hidden on Print */}
            <div className="flex flex-col gap-4 print:hidden">
                <div className="flex justify-between items-center w-full">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Volver
                    </button>
                    {invoice && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => router.push(`/dashboard/sales/${invoice.id}/edit`)}
                                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-900 transition-colors"
                            >
                                <Edit size={20} />
                                <span className="hidden sm:inline">Editar</span>
                            </button>
                            {invoice.type === 'quote' && (
                                <button
                                    onClick={handleConvertToInvoice}
                                    className="flex items-center gap-2 text-green-600 hover:text-green-900 transition-colors"
                                    title="Convertir a Factura"
                                >
                                    <FileText size={20} />
                                    <span className="hidden sm:inline">Convertir a Factura</span>
                                    <span className="sm:hidden">Convertir</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full sm:flex sm:justify-end">
                    <button
                        onClick={handleDownloadPDF}
                        disabled={isGenerating}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50"
                    >
                        <FileText size={18} />
                        {isGenerating ? '...' : 'PDF'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors shadow-sm w-full sm:w-auto"
                    >
                        <Printer size={18} />
                        Imprimir
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={isGenerating}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50"
                    >
                        <Mail size={18} />
                        {isGenerating ? '...' : 'Enviar'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Invoice Document */}
                <div id="invoice-content" className="lg:col-span-2 bg-card rounded-none shadow-none print:shadow-none print:border-0 print:p-0 overflow-hidden" style={{ minHeight: '297mm', padding: '20px' }}>
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-6 border-b pb-4 gap-4 sm:gap-0">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">
                                {emitter?.name || "SYSCOM COLOMBIA S.A.S."}
                            </h1>
                            <div className="text-gray-500 text-sm space-y-0.5">
                                <p>NIT: {emitter?.taxId}</p>
                                <p>{emitter?.address}</p>
                                <p>{emitter?.phone} | {emitter?.email}</p>
                            </div>
                        </div>
                        <div className="sm:text-right">
                            <h2 className="text-2xl font-light text-gray-400 uppercase tracking-wider mb-1">
                                {invoice.type === 'quote' ? 'Cotización' : 'Factura'}
                            </h2>
                            <div className="text-gray-900 font-medium text-lg">
                                #{invoice.number}
                            </div>
                            <div className="text-gray-500 text-sm mt-0.5">
                                Fecha: {invoice.date?.split('T')[0]}
                            </div>
                            {invoice.type === 'invoice' && (
                                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-[10px] font-semibold ${isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {isPaid ? 'PAGADA' : 'PENDIENTE'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Client Info */}
                    <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4 sm:gap-0">
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Facturar A</h3>
                            <p className="font-semibold text-gray-900 text-base">{invoice.contactName}</p>
                            {contact ? (
                                <div className="text-gray-600 text-sm mt-1 space-y-0.5">
                                    {contact.taxId && <p>NIT: {contact.taxId}</p>}
                                    {contact.address && <p>{contact.address}</p>}
                                    {contact.phone && <p>{contact.phone}</p>}
                                    {contact.email && <p>{contact.email}</p>}
                                </div>
                            ) : (
                                <p className="italic text-gray-400 text-xs">Datos no vinculados a contacto</p>
                            )}
                        </div>
                        <div className="sm:text-right">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Detalles</h3>
                            <div className="text-gray-600 text-sm space-y-0.5">
                                {invoice.dueDate && <p><span className="font-medium">Vence:</span> {invoice.dueDate.split('T')[0]}</p>}
                                {invoice.creditDays && <p><span className="font-medium">Plazo:</span> {invoice.creditDays} días</p>}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-6">
                        <table className="w-full text-xs text-left">
                            <thead>
                                <tr className="border-b border-gray-300 text-gray-900">
                                    <th className="py-2 font-semibold w-[60%]">Descripción</th>
                                    <th className="py-2 text-center font-semibold w-[10%]">Cant.</th>
                                    <th className="py-2 text-right font-semibold w-[15%]">V. Unitario</th>
                                    <th className="py-2 text-right font-semibold w-[15%]">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-2 text-gray-900 break-words whitespace-pre-wrap">{item.description}</td>
                                        <td className="py-2 text-center text-gray-700">{item.quantity}</td>
                                        <td className="py-2 text-right text-gray-700">${item.price.toLocaleString()}</td>
                                        <td className="py-2 text-right font-medium text-gray-900">${item.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end mb-8">
                        <div className="w-56 space-y-1.5">
                            <div className="flex justify-between text-gray-600 text-xs">
                                <span>Subtotal</span>
                                <span>${invoice.subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 text-xs">
                                <span>IVA (19%)</span>
                                <span>${invoice.tax.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-300">
                                <span>Total</span>
                                <span>${invoice.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Notes */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="text-gray-500 text-[10px] leading-tight">
                            {invoice.notes && (
                                <div className="mb-2">
                                    <p className="font-bold text-gray-700 mb-0.5">Notas:</p>
                                    <p>{invoice.notes}</p>
                                </div>
                            )}
                            <p>Favor realizar sus pagos a nombre de {emitter?.name}.</p>
                            <p className="mt-0.5">Esta factura de venta se asimila en todos sus efectos a una letra de cambio según los términos del Art. 774 del Código de Comercio.</p>
                            <p className="mt-2 text-gray-400">Generado por Contable PWA</p>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Payments & Status (Hidden on Print) */}
                <div className="space-y-6 print:hidden">
                    {/* Payment Status Card */}
                    <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                        <h3 className="font-semibold text-gray-900 mb-4">Estado del Pago</h3>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Total Facturado</p>
                                <p className="text-lg font-bold text-gray-900">${invoice.total.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Total Pagado</p>
                                <p className="text-lg font-bold text-green-600">${totalPaid.toLocaleString()}</p>
                            </div>
                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500">Saldo Pendiente</p>
                                <p className="text-xl font-bold text-red-600">${remainingBalance.toLocaleString()}</p>
                            </div>

                            {!isPaid && invoice.type === 'invoice' && (
                                <button
                                    onClick={openPaymentModal}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <DollarSign size={20} /> Registrar Abono
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Payment History */}
                    {invoice.type === 'invoice' && (
                        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                            <h3 className="font-semibold text-gray-900 mb-4">Historial de Pagos</h3>
                            {relatedPayments.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No hay pagos registrados</p>
                            ) : (
                                <div className="space-y-3">
                                    {relatedPayments.map(payment => {
                                        const method = paymentMethods.find(m => m.id === payment.methodId);
                                        return (
                                            <div key={payment.id} className="p-3 bg-card rounded-lg border border-border">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-medium text-gray-900">${payment.amount.toLocaleString()}</span>
                                                    <span className="text-xs text-gray-500">{payment.date}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <span className="text-indigo-600 font-medium">{method ? method.name : 'Desconocido'}</span>
                                                    {payment.destinationAccountId && (
                                                        <span className="text-green-600 ml-2">
                                                            ➔ {emitter?.bankAccounts?.find(a => a.id === payment.destinationAccountId)?.bankName} (...{emitter?.bankAccounts?.find(a => a.id === payment.destinationAccountId)?.accountNumber.slice(-4)})
                                                        </span>
                                                    )}
                                                    {payment.reference && <span className="text-gray-500 ml-auto">Ref: {payment.reference}</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Modal */}
            {
                showPaymentModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 border border-border">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Nuevo Pago</h3>

                            {/* OCR Upload Button */}
                            <div className="mb-6">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-border border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors">
                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                        {isScanning ? (
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                                        ) : (
                                            <Upload className="w-8 h-8 text-indigo-500 mb-2" />
                                        )}
                                        <p className="text-sm text-gray-500">
                                            {isScanning ? "Leyendo comprobante..." : "Subir Comprobante (Autocompletar)"}
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleOCRScan}
                                        disabled={isScanning}
                                    />
                                </label>
                            </div>

                            <form onSubmit={handlePaymentSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto a pagar</label>
                                    <MoneyInput
                                        required
                                        value={paymentForm.amount}
                                        onValueChange={(val) => setPaymentForm({ ...paymentForm, amount: val })}
                                        placeholder="0.00"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Saldo pendiente: ${remainingBalance.toLocaleString()}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={paymentForm.date}
                                        onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                    <select
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={paymentForm.methodId}
                                        onChange={e => setPaymentForm({ ...paymentForm, methodId: e.target.value })}
                                    >
                                        {paymentMethods.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.type})</option>
                                        ))}
                                        {contact?.creditBalance && contact.creditBalance > 0 && (
                                            <option value="CREDIT_BALANCE" className="font-bold text-green-600">
                                                Usar Saldo a Favor (${contact.creditBalance.toLocaleString()})
                                            </option>
                                        )}
                                    </select>
                                </div>

                                {emitter?.bankAccounts && emitter.bankAccounts.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta de Destino (Donde entra el dinero)</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={paymentForm.destinationAccountId}
                                            onChange={e => setPaymentForm({ ...paymentForm, destinationAccountId: e.target.value })}
                                            title="Seleccionar Cuenta"
                                        >
                                            <option value="">-- Seleccionar Cuenta --</option>
                                            {emitter.bankAccounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.bankName} - {acc.accountNumber} ({acc.accountType === 'savings' ? 'Ahorros' : 'Corriente'})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}


                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Referencia / Comprobante (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. #1234, Transferencia Nequi..."
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        value={paymentForm.reference}
                                        onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                                    <textarea
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        rows={2}
                                        value={paymentForm.notes}
                                        onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowPaymentModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Registrar Pago
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
