"use client";

import { useData } from "@/context/data-context";
import { ServiceOrderForm } from "@/components/service-orders/service-order-form";

export default function CreateServiceOrderPage() {
    const { addServiceOrder } = useData();

    const handleSubmit = async (data: any) => {
        await addServiceOrder(data);
    };

    return <ServiceOrderForm onSubmit={handleSubmit} />;
}
