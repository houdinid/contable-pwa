"use client";

import { useData } from "@/context/data-context";
import { ExpenseForm } from "@/components/forms/expense-form";

export default function CreateExpensePage() {
    const { addExpense } = useData();

    const handleSubmit = async (data: any) => {
        await addExpense(data);
    };

    return <ExpenseForm onSubmit={handleSubmit} />;
}

