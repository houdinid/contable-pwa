"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useData } from "@/context/data-context";
import { ExpenseForm } from "@/components/forms/expense-form";
import type { Expense } from "@/types";

export default function EditExpensePage() {
    const params = useParams();
    const router = useRouter();
    const { expenses, updateExpense, loadingData } = useData();
    const [expense, setExpense] = useState<Expense | null>(null);

    useEffect(() => {
        if (!loadingData && params.id) {
            const found = expenses.find(e => e.id === params.id);
            if (found) {
                setExpense(found);
            } else {
                router.push("/dashboard/expenses");
            }
        }
    }, [params.id, expenses, loadingData, router]);

    const handleSubmit = async (data: any) => {
        if (expense) {
            await updateExpense(expense.id, data);
        }
    };

    if (loadingData || !expense) {
        return <div className="p-8 text-center">Cargando...</div>;
    }

    return <ExpenseForm initialData={expense} onSubmit={handleSubmit} isEditing={true} />;
}
