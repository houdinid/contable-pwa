"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { Printer, ArrowLeft, Download, Mail, Edit, FileText, DollarSign, Upload, Camera } from "lucide-react";
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

            const { id, createdAt, ...rest } = invoice;

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
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto disabled:opacity-50"
                    >
                        <FileText size={18} />
                        {isGenerating ? '...' : 'PDF'}
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm w-full sm:w-auto"
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
                <div id="invoice-content" className="lg:col-span-2 bg-white p-8 md:p-12 rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-0 print:p-0">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {invoice.type === 'quote' ? 'COTIZACIÓN' : 'FACTURA'}
                            </h1>
                            <p className="text-gray-500 mt-1"># {invoice.number}</p>
                            {invoice.type === 'invoice' && (
                                <div className={`mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                    {isPaid ? 'PAGADA' : 'PENDIENTE'}
                                </div>
                            )}
                        </div>
                        <div className="text-right">
                            {emitter ? (
                                <>
                                    <h2 className="text-xl font-bold text-indigo-600">{emitter.name}</h2>
                                    <p className="text-sm text-gray-500 mt-1">NIT: {emitter.taxId}</p>
                                    <p className="text-sm text-gray-500">{emitter.address}</p>
                                    {emitter.email && <p className="text-sm text-gray-500">{emitter.email}</p>}
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-indigo-600">Mi Empresa</h2>
                                    <p className="text-sm text-gray-500 mt-1">Configura tu Razón Social</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Cliente</h3>
                            <p className="font-semibold text-gray-900 text-lg">{invoice.contactName}</p>
                            {contact ? (
                                <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                                    {contact.taxId && <p>NIT: {contact.taxId}</p>}
                                    {contact.address && <p>{contact.address}</p>}
                                    {contact.phone && <p>Tel: {contact.phone}</p>}
                                    {contact.email && <p>{contact.email}</p>}
                                    {contact.creditBalance && contact.creditBalance > 0 && (
                                        <p className="mt-2 text-green-600 font-bold bg-green-50 inline-block px-2 py-1 rounded-md text-xs border border-green-200">
                                            Saldo a Favor: ${contact.creditBalance.toLocaleString()}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-xs text-red-400">Datos de contacto no disponibles</p>
                            )}
                        </div>
                        <div className="text-right">
                            <div className="mb-4">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Fecha Emisión</h3>
                                <p className="font-semibold text-gray-900">{invoice.date}</p>
                            </div>
                            {invoice.dueDate && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Vencimiento</h3>
                                    <p className="font-semibold text-gray-900">{invoice.dueDate}</p>
                                </div>
                            )}
                            {invoice.creditDays && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Crédito</h3>
                                    <p className="font-semibold text-gray-900">{invoice.creditDays} Días</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-8">
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-gray-50 text-gray-700 font-medium">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg w-[50%]">Descripción</th>
                                    <th className="px-4 py-3 text-center w-[15%]">Cant.</th>
                                    <th className="px-4 py-3 text-right w-[15%]">Precio</th>
                                    <th className="px-4 py-3 text-right rounded-r-lg w-[20%]">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {invoice.items.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-4 py-3 text-gray-900 break-words whitespace-pre-wrap">{item.description}</td>
                                        <td className="px-4 py-3 text-center text-gray-600 align-top">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-gray-600 align-top">${item.price.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900 align-top">${item.total.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end border-t border-gray-100 pt-8">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${invoice.subtotal.toLocaleString()}</span>
                            </div>
                            {invoice.tax > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Impuestos (19%)</span>
                                    <span>${invoice.tax.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="pt-3 border-t border-gray-200 flex justify-between font-bold text-xl text-indigo-600">
                                <span>Total</span>
                                <span>${invoice.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-12 text-center text-sm text-gray-500 border-t border-gray-100 pt-8 print:block">
                        {invoice.type === 'quote' ? null : (
                            <>
                                <p>Gracias por su compra.</p>
                                <p className="mt-1">Esta factura se asimila en todos sus efectos a una letra de cambio (Art. 774 C.Co).</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Sidebar: Payments & Status (Hidden on Print) */}
                <div className="space-y-6 print:hidden">
                    {/* Payment Status Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
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
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Historial de Pagos</h3>
                            {relatedPayments.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No hay pagos registrados</p>
                            ) : (
                                <div className="space-y-3">
                                    {relatedPayments.map(payment => {
                                        const method = paymentMethods.find(m => m.id === payment.methodId);
                                        return (
                                            <div key={payment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
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
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Nuevo Pago</h3>

                            {/* OCR Upload Button */}
                            <div className="mb-6">
                                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
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

                                {emitter && emitter.bankAccounts && emitter.bankAccounts.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta de Destino (Donde entra el dinero)</label>
                                        <select
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            value={paymentForm.destinationAccountId}
                                            onChange={e => setPaymentForm({ ...paymentForm, destinationAccountId: e.target.value })}
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
                    </div >
                )
            }
        </div >
    );
}
