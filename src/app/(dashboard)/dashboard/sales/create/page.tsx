"use client";

import { useData } from "@/context/data-context";
import { InvoiceForm } from "@/components/forms/invoice-form";

export default function CreateInvoicePage() {
    const { addInvoice } = useData();

    const handleSubmit = async (data: any) => {
        await addInvoice(data);
    };

    return <InvoiceForm onSubmit={handleSubmit} />;
}
