"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Contact, Invoice, Expense, BusinessIdentity, SupplierCategory, Payment, PaymentMethod, ExpenseCategoryItem, Product, Purchase, WifiNetwork, ServiceOrder } from "@/types";

interface DataContextType {
    contacts: Contact[];
    invoices: Invoice[];
    expenses: Expense[];
    businessIdentities: BusinessIdentity[];
    supplierCategories: SupplierCategory[];
    paymentMethods: PaymentMethod[];
    payments: Payment[];
    expenseCategories: ExpenseCategoryItem[];
    products: Product[];
    purchases: Purchase[];

    wifiNetworks: WifiNetwork[];
    serviceOrders: ServiceOrder[];

    addServiceOrder: (order: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt">) => Promise<string>;
    updateServiceOrder: (id: string, order: Partial<ServiceOrder>) => Promise<void>;
    deleteServiceOrder: (id: string) => Promise<void>;


    addProduct: (product: Omit<Product, "id" | "createdAt">) => Promise<string>;
    updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
    deleteProduct: (id: string) => Promise<void>;

    addPurchase: (purchase: Omit<Purchase, "id" | "createdAt">) => Promise<void>;

    addContact: (contact: Omit<Contact, "id" | "createdAt">) => Promise<string>;
    updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
    deleteContact: (id: string) => Promise<void>;

    addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Promise<void>;
    updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;

    addExpense: (expense: Omit<Expense, "id" | "createdAt">) => Promise<void>;
    updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;

    addBusinessIdentity: (identity: Omit<BusinessIdentity, "id">) => Promise<void>;
    updateBusinessIdentity: (id: string, identity: Partial<BusinessIdentity>) => Promise<void>;
    deleteBusinessIdentity: (id: string) => Promise<void>;

    addSupplierCategory: (name: string) => Promise<void>;
    deleteSupplierCategory: (id: string) => Promise<void>;

    addPaymentMethod: (data: Omit<PaymentMethod, "id">) => Promise<void>;
    deletePaymentMethod: (id: string) => Promise<void>;

    addPayment: (payment: Omit<Payment, "id" | "createdAt">) => Promise<void>;

    // New Actions for Expense Categories
    addExpenseCategory: (data: Omit<ExpenseCategoryItem, "id">) => Promise<void>;
    updateExpenseCategory: (id: string, data: Partial<ExpenseCategoryItem>) => Promise<void>;
    deleteExpenseCategory: (id: string) => Promise<void>;

    // Actions for WiFi Networks
    addWifiNetwork: (data: Omit<WifiNetwork, "id" | "createdAt">) => Promise<void>;
    updateWifiNetwork: (id: string, data: Partial<WifiNetwork>) => Promise<void>;
    deleteWifiNetwork: (id: string) => Promise<void>;

    exportData: () => Promise<void>;
    importData: (jsonData: string) => Promise<void>;

    loadingData: boolean;
}

const DataContext = createContext<DataContextType>({
    contacts: [],
    invoices: [],
    expenses: [],
    businessIdentities: [],
    supplierCategories: [],
    paymentMethods: [],
    payments: [],

    expenseCategories: [],
    products: [],
    purchases: [],

    wifiNetworks: [],
    serviceOrders: [],

    addServiceOrder: async () => "",
    updateServiceOrder: async () => { },
    deleteServiceOrder: async () => { },

    addContact: async () => "",

    updateContact: async () => { },
    deleteContact: async () => { },
    addInvoice: async () => { },
    updateInvoice: async () => { },
    addExpense: async () => { },
    updateExpense: async () => { },
    deleteExpense: async () => { },
    addBusinessIdentity: async () => { },
    updateBusinessIdentity: async () => { },
    deleteBusinessIdentity: async () => { },
    addSupplierCategory: async () => { },
    deleteSupplierCategory: async () => { },
    addPaymentMethod: async () => { },
    deletePaymentMethod: async () => { },
    addPayment: async () => { },
    addExpenseCategory: async () => { },
    updateExpenseCategory: async () => { },
    deleteExpenseCategory: async () => { },

    addProduct: async () => "",
    updateProduct: async () => { },
    deleteProduct: async () => { },
    addPurchase: async () => { },

    addWifiNetwork: async () => { },
    updateWifiNetwork: async () => { },
    deleteWifiNetwork: async () => { },

    exportData: async () => { },
    importData: async () => { },
    loadingData: true,
});

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [businessIdentities, setBusinessIdentities] = useState<BusinessIdentity[]>([]);
    const [supplierCategories, setSupplierCategories] = useState<SupplierCategory[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);

    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryItem[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [purchases, setPurchases] = useState<Purchase[]>([]);

    const [wifiNetworks, setWifiNetworks] = useState<WifiNetwork[]>([]);
    const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    // Initial Data Load from Supabase
    useEffect(() => {
        const loadRequests = async () => {
            setLoadingData(true);
            try {
                const [
                    { data: contactsData },
                    { data: invoicesData },
                    { data: expensesData },
                    { data: identitiesData },
                    { data: categoriesData },
                    { data: methodsData },
                    { data: paymentsData },
                    { data: expCategoriesData },
                    { data: productsData },
                    { data: purchasesData },
                    { data: wifiData },
                    { data: serviceOrdersData }
                ] = await Promise.all([
                    supabase.from('contacts').select('*'),
                    supabase.from('invoices').select('*, items:invoice_items(*)'),
                    supabase.from('expenses').select('*'),
                    supabase.from('business_identities').select('*'),
                    supabase.from('supplier_categories').select('*'),
                    supabase.from('payment_methods').select('*'),
                    supabase.from('payments').select('*'),
                    supabase.from('expense_categories').select('*'),
                    supabase.from('products').select('*'),
                    supabase.from('purchases').select('*, items:purchase_items(*)'),
                    supabase.from('wifi_networks').select('*'),
                    supabase.from('service_orders').select('*, items:service_order_items(*)')
                ]);

                // Mapping from snake_case to camelCase
                setContacts((contactsData || []).map((c: any) => ({
                    ...c,
                    contactPerson: c.contact_person,
                    taxId: c.tax_id,
                    specialtyId: c.specialty_id,
                    defaultExpenseCategoryId: c.default_expense_category_id,
                    googleMapsUrl: c.google_maps_url,
                    website: c.website,
                    bankAccounts: c.bank_accounts,
                    creditBalance: c.credit_balance,
                    createdAt: c.created_at
                })));

                setInvoices((invoicesData || []).map((i: any) => ({
                    ...i,
                    issuerId: i.issuer_id,
                    dueDate: i.due_date,
                    creditDays: i.credit_days,
                    contactId: i.contact_id,
                    contactName: i.contact_name,
                    destinationAccountId: i.destination_account_id,
                    createdAt: i.created_at
                })));

                setExpenses((expensesData || []).map((e: any) => ({
                    ...e,
                    categoryId: e.category_id,
                    supplierId: e.supplier_id,
                    businessIdentityId: e.business_identity_id,
                    sourceAccountId: e.source_account_id,
                    receiptUrl: e.receipt_url,
                    createdAt: e.created_at
                })));

                setBusinessIdentities((identitiesData || []).map((id: any) => ({
                    ...id,
                    taxId: id.tax_id,
                    dv: id.dv,
                    logoUrl: id.logo_url,
                    isDefault: id.is_default,
                    isTaxPayer: id.is_tax_payer,
                    bankAccounts: id.bank_accounts
                })));

                setSupplierCategories(categoriesData || []);
                setPaymentMethods(methodsData || []);
                setPayments((paymentsData || []).map((p: any) => ({
                    ...p,
                    invoiceId: p.invoice_id,
                    methodId: p.method_id,
                    destinationAccountId: p.destination_account_id,
                    createdAt: p.created_at
                })));
                setExpenseCategories(expCategoriesData || []);

                setProducts((productsData || []).map((p: any) => ({
                    ...p,
                    minStock: p.min_stock,
                    categoryId: p.category_id,
                    createdAt: p.created_at
                })));

                setPurchases((purchasesData || []).map((p: any) => ({
                    ...p,
                    supplierId: p.supplier_id,
                    supplierName: p.supplier_name,
                    businessIdentityId: p.business_identity_id,
                    receiptUrl: p.receipt_url,
                    createdAt: p.created_at,
                    items: (p.items || []).map((item: any) => ({
                        ...item,
                        productId: item.product_id,
                        productName: item.product_name,
                        unitCost: item.unit_cost
                    }))
                })));

                setWifiNetworks((wifiData || []).map((w: any) => ({
                    ...w,
                    isHidden: w.is_hidden,
                    deviceType: w.device_type,
                    deviceBrand: w.device_brand,
                    clientId: w.client_id,
                    ipAddress: w.ip_address,
                    subnet_mask: w.subnet_mask, // Wait, type says subnetMask
                    subnetMask: w.subnet_mask,
                    photoUrl: w.photo_url,
                    createdAt: w.created_at
                })));

                setServiceOrders((serviceOrdersData || []).map((o: any) => ({
                    ...o,
                    clientId: o.client_id,
                    clientName: o.client_name,
                    clientEmail: o.client_email,
                    clientPhone: o.client_phone,
                    estimatedDate: o.estimated_date,
                    technicianNotes: o.technician_notes,
                    invoiceId: o.invoice_id,
                    businessIdentityId: o.business_identity_id,
                    createdAt: o.created_at,
                    updatedAt: o.updated_at,
                    items: (o.items || []).map((item: any) => ({
                        ...item,
                        productId: item.product_id
                    }))
                })));

                // Initialize defaults if empty (Optional, strictly speaking Supabase SQL could handle this or we do it once)
                if ((!categoriesData || categoriesData.length === 0)) {
                    // Optional: Seed defaults if needed, but for now we assume empty is fine or handled by user
                }

            } catch (error) {
                console.error("Error loading data from Supabase:", error);
            } finally {
                setLoadingData(false);
            }
        };

        loadRequests();
    }, []);

    // --- Helper to refresh a specific table (optional, for stricter consistency) ---
    // For now, we will update local state optimistically or re-fetch

    // --- Actions ---

    const addContact = async (contactData: Omit<Contact, "id" | "createdAt">) => {
        const newContact = { ...contactData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        // Optimistic update
        // @ts-ignore
        setContacts(prev => [...prev, newContact]);

        const { error } = await supabase.from('contacts').insert({
            id: newContact.id,
            name: newContact.name,
            email: newContact.email,
            phone: newContact.phone,
            address: newContact.address,
            type: newContact.type,
            contact_person: newContact.contactPerson || null,
            tax_id: newContact.taxId || null,
            specialty_id: newContact.specialtyId || null,
            // default_expense_category_id: newContact.defaultExpenseCategoryId || null, // Descomentar cuando la columna exista en Supabase
            google_maps_url: newContact.googleMapsUrl || null,
            // website: newContact.website || null, // Descomentar cuando la columna exista en Supabase
            credit_balance: newContact.creditBalance || 0,
            bank_accounts: newContact.bankAccounts || []
        });

        if (error) {
            console.error("Error adding contact:", error);
            // Rollback could go here
        }
        return newContact.id;
    };

    const updateContact = async (id: string, patch: Partial<Contact>) => {
        setContacts(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));

        // Map keys for Supabase
        const dbPatch: any = { ...patch };
        if (patch.bankAccounts !== undefined) dbPatch.bank_accounts = patch.bankAccounts;
        if (patch.contactPerson !== undefined) dbPatch.contact_person = patch.contactPerson;
        if (patch.taxId !== undefined) dbPatch.tax_id = patch.taxId;
        if (patch.specialtyId !== undefined) dbPatch.specialty_id = patch.specialtyId;
        // if (patch.defaultExpenseCategoryId !== undefined) dbPatch.default_expense_category_id = patch.defaultExpenseCategoryId;
        if (patch.googleMapsUrl !== undefined) dbPatch.google_maps_url = patch.googleMapsUrl;
        // if (patch.website !== undefined) dbPatch.website = patch.website;
        if (patch.creditBalance !== undefined) dbPatch.credit_balance = patch.creditBalance;

        // Remove camelCase keys that don't exist in DB
        delete dbPatch.bankAccounts;
        delete dbPatch.contactPerson;
        delete dbPatch.taxId;
        delete dbPatch.specialtyId;
        delete dbPatch.defaultExpenseCategoryId;
        delete dbPatch.googleMapsUrl;
        delete dbPatch.creditBalance;
        delete dbPatch.website;

        const { error } = await supabase.from('contacts').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating contact:", error);
    };

    const deleteContact = async (id: string) => {
        setContacts(prev => prev.filter(c => c.id !== id));
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (error) console.error("Error deleting contact:", error);
    };

    const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt">) => {
        let finalContactId = invoiceData.contactId;

        // Auto-create contact if needed
        if (finalContactId === 'generated-on-save' && invoiceData.contactName) {
            const newId = await addContact({
                name: invoiceData.contactName,
                type: 'client'
            });
            finalContactId = newId;
        } else if (finalContactId === 'adhoc') {
            finalContactId = undefined as any;
        }

        const newInvoice = {
            ...invoiceData,
            contactId: finalContactId,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        // @ts-ignore
        setInvoices(prev => [...prev, newInvoice]);

        // Separate items from invoice structure for DB
        const { items, ...invoiceHeader } = newInvoice;

        const { error: invoiceError } = await supabase.from('invoices').insert({
            id: invoiceHeader.id,
            number: invoiceHeader.number,
            date: invoiceHeader.date,
            subtotal: invoiceHeader.subtotal,
            tax: invoiceHeader.tax,
            total: invoiceHeader.total,
            status: invoiceHeader.status,
            type: invoiceHeader.type,
            notes: invoiceHeader.notes || null,
            issuer_id: (invoiceHeader.issuerId && invoiceHeader.issuerId !== "") ? invoiceHeader.issuerId : null,
            due_date: (invoiceHeader.dueDate && invoiceHeader.dueDate !== "") ? invoiceHeader.dueDate : null,
            credit_days: invoiceHeader.creditDays ?? null,
            contact_id: (finalContactId && finalContactId !== "" && finalContactId !== "adhoc") ? finalContactId : null,
            contact_name: invoiceHeader.contactName || null,
            destination_account_id: (invoiceHeader.destinationAccountId && invoiceHeader.destinationAccountId !== "") ? invoiceHeader.destinationAccountId : null
        });

        if (invoiceError) {
            console.error("Error creating invoice header:", invoiceError);
            return;
        }

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => {
                const { id, ...rest } = item as any; // Strip original ID
                return {
                    ...rest,
                    invoice_id: newInvoice.id
                };
            });
            const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
            if (itemsError) console.error("Error creating invoice items:", itemsError);
        }
    };

    const updateInvoice = async (id: string, patch: Partial<Invoice>) => {
        setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));

        const dbPatch: any = { ...patch };
        if (patch.issuerId !== undefined) dbPatch.issuer_id = (patch.issuerId && patch.issuerId !== "") ? patch.issuerId : null;
        if (patch.dueDate !== undefined) dbPatch.due_date = (patch.dueDate && patch.dueDate !== "") ? patch.dueDate : null;
        if (patch.creditDays !== undefined) dbPatch.credit_days = patch.creditDays ?? null;
        if (patch.contactId !== undefined) dbPatch.contact_id = (patch.contactId && patch.contactId !== "" && patch.contactId !== "adhoc") ? patch.contactId : null;
        if (patch.contactName !== undefined) dbPatch.contact_name = patch.contactName || null;
        if (patch.destinationAccountId !== undefined) dbPatch.destination_account_id = (patch.destinationAccountId && patch.destinationAccountId !== "") ? patch.destinationAccountId : null;

        delete dbPatch.issuerId; delete dbPatch.dueDate; delete dbPatch.creditDays;
        delete dbPatch.contactId; delete dbPatch.contactName; delete dbPatch.destinationAccountId;

        if (patch.items) {
            delete dbPatch.items;
            // Handle items update by clear and insert
            await supabase.from('invoice_items').delete().eq('invoice_id', id);

            if (patch.items.length > 0) {
                const itemsToInsert = patch.items.map(item => {
                    const { id: itemId, ...rest } = item as any; // Ignore existing ID
                    return {
                        ...rest,
                        invoice_id: id
                    }
                });
                const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
                if (itemsError) console.error("Error updating invoice items:", itemsError);
            }
        }

        const { error } = await supabase.from('invoices').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating invoice:", error);
    };

    const addExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
        const newExpense = { ...expense, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setExpenses(prev => [newExpense, ...prev]);

        const { error } = await supabase.from('expenses').insert({
            id: newExpense.id,
            description: newExpense.description,
            amount: newExpense.amount,
            date: newExpense.date,
            status: newExpense.status,
            category_id: (newExpense.categoryId && newExpense.categoryId !== "") ? newExpense.categoryId : "other",
            supplier_id: (newExpense.supplierId && newExpense.supplierId !== "") ? newExpense.supplierId : null,
            business_identity_id: (newExpense.businessIdentityId && newExpense.businessIdentityId !== "") ? newExpense.businessIdentityId : null,
            source_account_id: (newExpense.sourceAccountId && newExpense.sourceAccountId !== "") ? newExpense.sourceAccountId : null,
            receipt_url: newExpense.receiptUrl || null
        });
        if (error) console.error("Error adding expense:", error);
    };

    const updateExpense = async (id: string, patch: Partial<Expense>) => {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

        const dbPatch: any = { ...patch };
        if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId;
        if (patch.supplierId !== undefined) dbPatch.supplier_id = patch.supplierId;
        if (patch.businessIdentityId !== undefined) dbPatch.business_identity_id = patch.businessIdentityId;
        if (patch.sourceAccountId !== undefined) dbPatch.source_account_id = patch.sourceAccountId;
        if (patch.receiptUrl !== undefined) dbPatch.receipt_url = patch.receiptUrl;

        delete dbPatch.categoryId; delete dbPatch.supplierId; delete dbPatch.businessIdentityId;
        delete dbPatch.sourceAccountId; delete dbPatch.receiptUrl;

        const { error } = await supabase.from('expenses').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating expense:", error);
    };

    const deleteExpense = async (id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) console.error("Error deleting expense:", error);
    };

    const addBusinessIdentity = async (data: Omit<BusinessIdentity, "id">) => {
        const newIdentity = { ...data, id: crypto.randomUUID() };

        // Handle Default Logic locally first
        if (newIdentity.isDefault) {
            setBusinessIdentities(prev => [...prev.map(i => ({ ...i, isDefault: false })), newIdentity]);
            // DB: Unset others
            await supabase.from('business_identities').update({ is_default: false }).neq('id', 'placeholder');
        } else {
            setBusinessIdentities(prev => [...prev, newIdentity]);
        }

        const { error } = await supabase.from('business_identities').insert({
            id: newIdentity.id,
            name: newIdentity.name,
            tax_id: newIdentity.taxId,
            dv: newIdentity.dv || null,
            address: newIdentity.address || null,
            city: newIdentity.city || null,
            email: newIdentity.email || null,
            logo_url: newIdentity.logoUrl || null,
            is_default: newIdentity.isDefault || false,
            is_tax_payer: newIdentity.isTaxPayer || false,
            bank_accounts: newIdentity.bankAccounts || []
        });
        if (error) console.error("Error adding identity:", error);
    };

    const updateBusinessIdentity = async (id: string, patch: Partial<BusinessIdentity>) => {
        setBusinessIdentities(prev => prev.map(i => i.id === id ? { ...i, ...patch } : patch.isDefault ? { ...i, isDefault: false } : i));

        if (patch.isDefault) {
            await supabase.from('business_identities').update({ is_default: false }).neq('id', id);
        }

        const dbPatch: any = { ...patch };
        if (patch.taxId !== undefined) dbPatch.tax_id = patch.taxId;
        if (patch.dv !== undefined) dbPatch.dv = patch.dv || null;
        if (patch.logoUrl !== undefined) dbPatch.logo_url = patch.logoUrl;
        if (patch.isDefault !== undefined) dbPatch.is_default = patch.isDefault;
        if (patch.isTaxPayer !== undefined) dbPatch.is_tax_payer = patch.isTaxPayer;
        if (patch.bankAccounts !== undefined) dbPatch.bank_accounts = patch.bankAccounts;

        delete dbPatch.taxId; delete dbPatch.dv; delete dbPatch.logoUrl; delete dbPatch.isDefault; delete dbPatch.isTaxPayer; delete dbPatch.bankAccounts;

        const { error } = await supabase.from('business_identities').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating identity:", error);
    };

    const deleteBusinessIdentity = async (id: string) => {
        setBusinessIdentities(prev => prev.filter(i => i.id !== id));
        const { error } = await supabase.from('business_identities').delete().eq('id', id);
        if (error) console.error("Error deleting identity:", error);
    };

    const addSupplierCategory = async (name: string) => {
        const newCat = { id: crypto.randomUUID(), name };
        setSupplierCategories(prev => [...prev, newCat]);
        const { error } = await supabase.from('supplier_categories').insert(newCat);
        if (error) console.error("Error adding supplier cat:", error);
    };

    const deleteSupplierCategory = async (id: string) => {
        setSupplierCategories(prev => prev.filter(c => c.id !== id));
        const { error } = await supabase.from('supplier_categories').delete().eq('id', id);
        if (error) console.error("Error deleting supplier cat:", error);
    };

    const addPaymentMethod = async (data: Omit<PaymentMethod, "id">) => {
        const newMethod = { ...data, id: crypto.randomUUID() };
        setPaymentMethods(prev => [...prev, newMethod]);
        const { error } = await supabase.from('payment_methods').insert(newMethod);
        if (error) console.error("Error adding payment method:", error);
    };

    const deletePaymentMethod = async (id: string) => {
        setPaymentMethods(prev => prev.filter(p => p.id !== id));
        const { error } = await supabase.from('payment_methods').delete().eq('id', id);
        if (error) console.error("Error deleting payment method:", error);
    };

    const addPayment = async (input: Omit<Payment, "id" | "createdAt">) => {
        const newPayment = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setPayments(prev => [...prev, newPayment]);

        const isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        const { error } = await supabase.from('payments').insert({
            id: newPayment.id,
            amount: newPayment.amount,
            date: newPayment.date,
            reference: newPayment.reference,
            notes: newPayment.notes,
            invoice_id: newPayment.invoiceId,
            method_id: newPayment.methodId && isValidUUID(newPayment.methodId) ? newPayment.methodId : null,
            destination_account_id: newPayment.destinationAccountId && isValidUUID(newPayment.destinationAccountId) ? newPayment.destinationAccountId : null
        });

        if (error) {
            console.error("Error adding payment:", error);
            setPayments(prev => prev.filter(p => p.id !== newPayment.id)); // Rollback local state
            throw error; // Make sure caller knows it failed
        }

        // Update Invoice Status
        // Fetch fresh payments for this invoice to be safe
        const { data: invoicePayments } = await supabase.from('payments').select('*').eq('invoice_id', input.invoiceId);
        const { data: invoiceData } = await supabase.from('invoices').select('*').eq('id', input.invoiceId).single();

        if (invoicePayments && invoiceData) {
            const totalPaid = invoicePayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
            let newStatus = invoiceData.status;

            if (totalPaid >= invoiceData.total) {
                newStatus = 'paid';
            } else if (totalPaid > 0 && invoiceData.status !== 'cancelled') {
                newStatus = 'pending';
            }

            if (newStatus !== invoiceData.status) {
                updateInvoice(invoiceData.id, { status: newStatus });
            }
        }
    };

    const addExpenseCategory = async (data: Omit<ExpenseCategoryItem, "id">) => {
        const newItem = { ...data, id: data.name.toLowerCase().replace(/\s+/g, '_') }; // Use similar ID logic or uuid
        setExpenseCategories(prev => [...prev, newItem]);
        const { error } = await supabase.from('expense_categories').insert({
            id: newItem.id,
            name: newItem.name,
            color: newItem.color,
            parent_id: newItem.parentId
        });
        if (error) console.error("Error adding expense cat:", error);
    };

    const updateExpenseCategory = async (id: string, patch: Partial<ExpenseCategoryItem>) => {
        setExpenseCategories(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
        const dbPatch: any = { ...patch };
        if (patch.parentId !== undefined) dbPatch.parent_id = patch.parentId;
        delete dbPatch.parentId;
        const { error } = await supabase.from('expense_categories').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating expense cat:", error);
    };

    const deleteExpenseCategory = async (id: string) => {
        setExpenseCategories(prev => prev.filter(c => c.id !== id && c.parentId !== id));
        const { error } = await supabase.from('expense_categories').delete().eq('id', id);
        if (error) console.error("Error deleting expense cat:", error);
    };

    const addProduct = async (data: Omit<Product, "id" | "createdAt">) => {
        const newItem = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setProducts(prev => [...prev, newItem]);
        const { error } = await supabase.from('products').insert({
            id: newItem.id,
            name: newItem.name,
            sku: newItem.sku || null,
            description: newItem.description || null,
            price: newItem.price,
            cost: newItem.cost,
            stock: newItem.stock,
            min_stock: newItem.minStock ?? null,
            category_id: (newItem.categoryId && newItem.categoryId !== "") ? newItem.categoryId : null
        });
        if (error) console.error("Error adding product:", error);
        return newItem.id;
    };

    const updateProduct = async (id: string, patch: Partial<Product>) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
        const dbPatch: any = { ...patch };
        if (patch.minStock !== undefined) dbPatch.min_stock = patch.minStock;
        if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId;
        delete dbPatch.minStock; delete dbPatch.categoryId;

        const { error } = await supabase.from('products').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating product:", error);
    };

    const deleteProduct = async (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) console.error("Error deleting product:", error);
    };

    const addPurchase = async (data: Omit<Purchase, "id" | "createdAt">) => {
        const newPurchase = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        // Optimistic UI
        // @ts-ignore
        setPurchases(prev => [newPurchase, ...prev]);

        // Insert Purchase
        const { items, ...purchaseHeader } = newPurchase;
        const { error } = await supabase.from('purchases').insert({
            id: purchaseHeader.id,
            date: purchaseHeader.date,
            number: purchaseHeader.number,
            total: purchaseHeader.total,
            status: purchaseHeader.status,
            notes: purchaseHeader.notes || null,
            supplier_id: (purchaseHeader.supplierId && purchaseHeader.supplierId !== "") ? purchaseHeader.supplierId : null,
            supplier_name: purchaseHeader.supplierName || null,
            business_identity_id: (purchaseHeader.businessIdentityId && purchaseHeader.businessIdentityId !== "") ? purchaseHeader.businessIdentityId : null,
            receipt_url: purchaseHeader.receiptUrl || null
        });

        if (error) { console.error("Error creating purchase:", error); return; }

        // Insert Items
        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                purchase_id: newPurchase.id,
                product_id: item.productId,
                product_name: item.productName,
                unit_cost: item.unitCost
            }));

            // Map keys
            const dbItems = itemsToInsert.map(i => {
                const { productId, productName, unitCost, ...rest } = i;
                return { ...rest, product_id: productId, product_name: productName, unit_cost: unitCost };
            });

            const { error: itemsError } = await supabase.from('purchase_items').insert(dbItems);
            if (itemsError) console.error("Error creating purchase items:", itemsError);

            // Update Stock
            // This is cleaner to do server-side via triggers, but we'll do client-side for now to match logic
            // Assuming no concurrent users for now
            for (const item of items) {
                const { data: product } = await supabase.from('products').select('*').eq('id', item.productId).single();
                if (product) {
                    const currentTotalValue = Number(product.stock) * Number(product.cost);
                    const newIncomingValue = Number(item.quantity) * Number(item.unitCost);
                    const newStock = Number(product.stock) + Number(item.quantity);
                    const newCost = newStock > 0 ? (currentTotalValue + newIncomingValue) / newStock : item.unitCost;

                    await updateProduct(product.id, { stock: newStock, cost: newCost });
                }
            }
        }
    };

    const addWifiNetwork = async (data: Omit<WifiNetwork, "id" | "createdAt">) => {
        const newItem = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setWifiNetworks(prev => [...prev, newItem]);
        const { error } = await supabase.from('wifi_networks').insert({
            id: newItem.id,
            ssid: newItem.ssid,
            password: newItem.password || null,
            encryption: newItem.encryption || null,
            model: newItem.model || null,
            area: newItem.area || null,
            gateway: newItem.gateway || null,
            dns: newItem.dns || null,
            notes: newItem.notes || null,
            is_hidden: newItem.isHidden ?? null,
            device_type: newItem.deviceType,
            device_brand: newItem.deviceBrand || null,
            client_id: (newItem.clientId && newItem.clientId !== "") ? newItem.clientId : null,
            ip_address: newItem.ipAddress || null,
            subnet_mask: newItem.subnetMask || null,
            photo_url: newItem.photoUrl || null
        });
        if (error) console.error("Error adding wifi:", error);
    };

    const updateWifiNetwork = async (id: string, patch: Partial<WifiNetwork>) => {
        setWifiNetworks(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
        const dbPatch: any = { ...patch };
        if (patch.isHidden !== undefined) dbPatch.is_hidden = patch.isHidden;
        if (patch.deviceType !== undefined) dbPatch.device_type = patch.deviceType;
        if (patch.deviceBrand !== undefined) dbPatch.device_brand = patch.deviceBrand;
        if (patch.clientId !== undefined) dbPatch.client_id = patch.clientId;
        if (patch.ipAddress !== undefined) dbPatch.ip_address = patch.ipAddress;
        if (patch.subnetMask !== undefined) dbPatch.subnet_mask = patch.subnetMask;
        if (patch.photoUrl !== undefined) dbPatch.photo_url = patch.photoUrl;

        delete dbPatch.isHidden; delete dbPatch.deviceType; delete dbPatch.deviceBrand;
        delete dbPatch.clientId; delete dbPatch.ipAddress; delete dbPatch.subnetMask; delete dbPatch.photoUrl;

        const { error } = await supabase.from('wifi_networks').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating wifi:", error);
    };

    const deleteWifiNetwork = async (id: string) => {
        setWifiNetworks(prev => prev.filter(w => w.id !== id));
        const { error } = await supabase.from('wifi_networks').delete().eq('id', id);
        if (error) console.error("Error deleting wifi:", error);
    };

    const addServiceOrder = async (data: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt">) => {
        let finalClientId = data.clientId;

        // Auto-create client if needed
        if (finalClientId === 'generated-on-save' && data.clientName) {
            const newId = await addContact({
                name: data.clientName,
                type: 'client',
                email: data.clientEmail,
                phone: data.clientPhone
            });
            finalClientId = newId;
        }

        const now = new Date().toISOString();
        const newOrder = {
            ...data,
            clientId: finalClientId,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now
        };
        // @ts-ignore
        setServiceOrders(prev => [newOrder, ...prev]);

        const { items, ...orderHeader } = newOrder;

        const { error } = await supabase.from('service_orders').insert({
            id: orderHeader.id,
            number: orderHeader.number,
            date: orderHeader.date,
            status: orderHeader.status,
            subtotal: orderHeader.subtotal,
            tax: orderHeader.tax,
            total: orderHeader.total,
            notes: orderHeader.notes || null,
            client_id: (finalClientId && finalClientId !== "" && finalClientId !== "generated-on-save") ? finalClientId : null,
            client_name: orderHeader.clientName || null,
            client_email: orderHeader.clientEmail || null,
            client_phone: orderHeader.clientPhone || null,
            estimated_date: (orderHeader.estimatedDate && orderHeader.estimatedDate !== "") ? orderHeader.estimatedDate : null,
            technician_notes: orderHeader.technicianNotes || null,
            invoice_id: (orderHeader.invoiceId && orderHeader.invoiceId !== "") ? orderHeader.invoiceId : null,
            business_identity_id: (orderHeader.businessIdentityId && orderHeader.businessIdentityId !== "") ? orderHeader.businessIdentityId : null
        });

        if (error) { console.error("Error adding service order:", error); return ""; }

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                service_order_id: newOrder.id,
                product_id: item.productId
            }));
            // Map keys
            const dbItems = itemsToInsert.map(i => {
                const { productId, ...rest } = i;
                return { ...rest, product_id: productId };
            });
            const { error: itemsError } = await supabase.from('service_order_items').insert(dbItems);
            if (itemsError) console.error("Error adding service order items:", itemsError);
        }

        return newOrder.id;
    };

    const updateServiceOrder = async (id: string, patch: Partial<ServiceOrder>) => {
        const now = new Date().toISOString();
        setServiceOrders(prev => prev.map(o => o.id === id ? { ...o, ...patch, updatedAt: now } : o));

        const dbPatch: any = { ...patch, updated_at: now };
        if (patch.clientId !== undefined) dbPatch.client_id = patch.clientId;
        if (patch.clientName !== undefined) dbPatch.client_name = patch.clientName;
        if (patch.clientEmail !== undefined) dbPatch.client_email = patch.clientEmail;
        if (patch.clientPhone !== undefined) dbPatch.client_phone = patch.clientPhone;
        if (patch.estimatedDate !== undefined) dbPatch.estimated_date = patch.estimatedDate;
        if (patch.technicianNotes !== undefined) dbPatch.technician_notes = patch.technicianNotes;
        if (patch.invoiceId !== undefined) dbPatch.invoice_id = patch.invoiceId;
        if (patch.businessIdentityId !== undefined) dbPatch.business_identity_id = patch.businessIdentityId;
        if (patch.updatedAt) delete dbPatch.updatedAt; // we set updated_at manually

        delete dbPatch.clientId; delete dbPatch.clientName; delete dbPatch.clientEmail;
        delete dbPatch.clientPhone; delete dbPatch.estimatedDate; delete dbPatch.technicianNotes;
        delete dbPatch.invoiceId; delete dbPatch.businessIdentityId; delete dbPatch.items;

        const { error } = await supabase.from('service_orders').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating service order:", error);
    };

    const deleteServiceOrder = async (id: string) => {
        setServiceOrders(prev => prev.filter(o => o.id !== id));
        const { error } = await supabase.from('service_orders').delete().eq('id', id);
        if (error) console.error("Error deleting service order:", error);
    };

    const exportData = async () => {
        try {
            setLoadingData(true);
            const tables = [
                'contacts', 'business_identities', 'supplier_categories', 'expense_categories',
                'products', 'payment_methods', 'wifi_networks', 'cctv_systems', 'cctv_users',
                'invoices', 'invoice_items',
                'expenses',
                'purchases', 'purchase_items',
                'service_orders', 'service_order_items', 'payments'
            ];

            const backupData: any = {};

            // Fetch all data in parallel
            await Promise.all(tables.map(async (table) => {
                const { data, error } = await supabase.from(table).select('*');
                if (error) throw error;
                backupData[table] = data;
            }));

            // Create and download file
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_contable_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Export failed:", error);
            alert("Error al exportar datos. Revisa la consola.");
            throw error;
        } finally {
            setLoadingData(false);
        }
    };

    const importData = async (jsonData: string) => {
        if (!confirm("⚠️ ADVERTENCIA: Esta acción intentará fusionar/actualizar los datos existentes. Se recomienda tener una copia de seguridad previa. ¿Continuar?")) {
            return;
        }

        try {
            setLoadingData(true);
            const data = JSON.parse(jsonData);

            // Import Order Matters due to Foreign Keys
            const tableOrder = [
                'contacts', 'business_identities', 'supplier_categories', 'expense_categories',
                'products', 'payment_methods', 'wifi_networks', 'cctv_systems', 'cctv_users',
                'invoices', 'invoice_items',
                'expenses',
                'purchases', 'purchase_items',
                'service_orders', 'service_order_items', 'payments'
            ];

            for (const table of tableOrder) {
                if (data[table] && Array.isArray(data[table]) && data[table].length > 0) {
                    console.log(`Importing ${table}...`);
                    const { error } = await supabase.from(table).upsert(data[table], { onConflict: 'id' }); // Upsert by ID
                    if (error) {
                        console.error(`Error importing table ${table}:`, error);
                        // Don't break completely, try next table, but warn
                        alert(`Error importando ${table}. Revisa la consola.`);
                    }
                }
            }
            // Reload data to reflect changes
            window.location.reload();

        } catch (error) {
            console.error("Import failed:", error);
            alert("Error al importar el archivo JSON. Verifica el formato.");
        } finally {
            setLoadingData(false);
        }
    };

    return (
        <DataContext.Provider
            value={{
                contacts, invoices, expenses, businessIdentities, supplierCategories, paymentMethods, payments, expenseCategories, products, purchases, wifiNetworks, serviceOrders,
                addContact, updateContact, deleteContact,

                addInvoice, updateInvoice,
                addExpense, updateExpense, deleteExpense,
                addBusinessIdentity, updateBusinessIdentity, deleteBusinessIdentity,
                addSupplierCategory, deleteSupplierCategory,
                addPaymentMethod, deletePaymentMethod, addPayment,
                addExpenseCategory, updateExpenseCategory, deleteExpenseCategory,
                addProduct, updateProduct, deleteProduct,
                addPurchase,
                addWifiNetwork, updateWifiNetwork, deleteWifiNetwork,
                addServiceOrder, updateServiceOrder, deleteServiceOrder,
                exportData, importData, loadingData,
            }}
        >
            {children}
        </DataContext.Provider>
    );
}

export const useData = () => useContext(DataContext);
