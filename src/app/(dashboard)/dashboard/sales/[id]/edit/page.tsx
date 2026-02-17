"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { InvoiceForm } from "@/components/forms/invoice-form";
import type { Invoice } from "@/types";

export default function EditInvoicePage() {
    const params = useParams();
    const router = useRouter();
    const { invoices, updateInvoice, loadingData } = useData();
    const [invoice, setInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        if (!loadingData && params.id) {
            const found = invoices.find(i => i.id === params.id);
            if (found) {
                setInvoice(found);
            } else {
                router.push("/dashboard/sales");
            }
        }
    }, [params.id, invoices, loadingData, router]);

    if (loadingData || !invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const handleSubmit = async (data: any) => {
        if (invoice) {
            await updateInvoice(invoice.id, data);
        }
    };

    return <InvoiceForm initialData={invoice} onSubmit={handleSubmit} isEditing={true} />;
}
