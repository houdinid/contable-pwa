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

                // @ts-ignore
                setContacts(contactsData || []); // @ts-ignore
                setInvoices(invoicesData || []);
                setExpenses(expensesData || []);
                setBusinessIdentities(identitiesData || []);
                setSupplierCategories(categoriesData || []);
                setPaymentMethods(methodsData || []);
                setPayments(paymentsData || []);
                setExpenseCategories(expCategoriesData || []);
                setProducts(productsData || []); // @ts-ignore
                setPurchases(purchasesData || []);
                setWifiNetworks(wifiData || []); // @ts-ignore
                setServiceOrders(serviceOrdersData || []);

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
            contact_person: newContact.contactPerson,
            tax_id: newContact.taxId,
            specialty_id: newContact.specialtyId,
            default_expense_category_id: newContact.defaultExpenseCategoryId,
            google_maps_url: newContact.googleMapsUrl,
            credit_balance: newContact.creditBalance,
            bank_accounts: newContact.bankAccounts
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
        if (patch.bankAccounts) dbPatch.bank_accounts = patch.bankAccounts;
        if (patch.contactPerson) dbPatch.contact_person = patch.contactPerson;
        if (patch.taxId) dbPatch.tax_id = patch.taxId;
        if (patch.specialtyId) dbPatch.specialty_id = patch.specialtyId;
        if (patch.defaultExpenseCategoryId) dbPatch.default_expense_category_id = patch.defaultExpenseCategoryId;
        if (patch.googleMapsUrl) dbPatch.google_maps_url = patch.googleMapsUrl;
        if (patch.creditBalance) dbPatch.credit_balance = patch.creditBalance;

        // Remove camelCase keys that don't exist in DB
        delete dbPatch.bankAccounts;
        delete dbPatch.contactPerson;
        delete dbPatch.taxId;
        delete dbPatch.specialtyId;
        delete dbPatch.defaultExpenseCategoryId;
        delete dbPatch.googleMapsUrl;
        delete dbPatch.creditBalance;

        const { error } = await supabase.from('contacts').update(dbPatch).eq('id', id);
        if (error) console.error("Error updating contact:", error);
    };

    const deleteContact = async (id: string) => {
        setContacts(prev => prev.filter(c => c.id !== id));
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (error) console.error("Error deleting contact:", error);
    };

    const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt">) => {
        const newInvoice = { ...invoiceData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
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
            notes: invoiceHeader.notes,
            issuer_id: invoiceHeader.issuerId,
            due_date: invoiceHeader.dueDate,
            credit_days: invoiceHeader.creditDays,
            contact_id: invoiceHeader.contactId,
            contact_name: invoiceHeader.contactName,
            destination_account_id: invoiceHeader.destinationAccountId
        });

        if (invoiceError) {
            console.error("Error creating invoice header:", invoiceError);
            return;
        }

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                ...item,
                invoice_id: newInvoice.id
            }));
            const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
            if (itemsError) console.error("Error creating invoice items:", itemsError);
        }
    };

    const updateInvoice = async (id: string, patch: Partial<Invoice>) => {
        setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
        // Note: Logic allows updating status, but if items change, we'd need complex logic (delete old, add new).
        // For now, assuming patch is mostly status/header fields.

        const dbPatch: any = { ...patch };
        if (patch.issuerId) dbPatch.issuer_id = patch.issuerId;
        if (patch.dueDate) dbPatch.due_date = patch.dueDate;
        if (patch.creditDays) dbPatch.credit_days = patch.creditDays;
        if (patch.contactId) dbPatch.contact_id = patch.contactId;
        if (patch.contactName) dbPatch.contact_name = patch.contactName;
        if (patch.destinationAccountId) dbPatch.destination_account_id = patch.destinationAccountId;

        delete dbPatch.issuerId; delete dbPatch.dueDate; delete dbPatch.creditDays;
        delete dbPatch.contactId; delete dbPatch.contactName; delete dbPatch.destinationAccountId;
        delete dbPatch.items; // Don't update items via basic patch

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
            category_id: newExpense.categoryId,
            supplier_id: newExpense.supplierId,
            business_identity_id: newExpense.businessIdentityId,
            source_account_id: newExpense.sourceAccountId,
            receipt_url: newExpense.receiptUrl
        });
        if (error) console.error("Error adding expense:", error);
    };

    const updateExpense = async (id: string, patch: Partial<Expense>) => {
        setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));

        const dbPatch: any = { ...patch };
        if (patch.categoryId) dbPatch.category_id = patch.categoryId;
        if (patch.supplierId) dbPatch.supplier_id = patch.supplierId;
        if (patch.businessIdentityId) dbPatch.business_identity_id = patch.businessIdentityId;
        if (patch.sourceAccountId) dbPatch.source_account_id = patch.sourceAccountId;
        if (patch.receiptUrl) dbPatch.receipt_url = patch.receiptUrl;

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
            address: newIdentity.address,
            city: newIdentity.city,
            email: newIdentity.email,
            logo_url: newIdentity.logoUrl,
            is_default: newIdentity.isDefault,
            is_tax_payer: newIdentity.isTaxPayer,
            bank_accounts: newIdentity.bankAccounts
        });
        if (error) console.error("Error adding identity:", error);
    };

    const updateBusinessIdentity = async (id: string, patch: Partial<BusinessIdentity>) => {
        setBusinessIdentities(prev => prev.map(i => i.id === id ? { ...i, ...patch } : patch.isDefault ? { ...i, isDefault: false } : i));

        if (patch.isDefault) {
            await supabase.from('business_identities').update({ is_default: false }).neq('id', id);
        }

        const dbPatch: any = { ...patch };
        if (patch.taxId) dbPatch.tax_id = patch.taxId;
        if (patch.logoUrl) dbPatch.logo_url = patch.logoUrl;
        if (patch.isDefault !== undefined) dbPatch.is_default = patch.isDefault;
        if (patch.isTaxPayer !== undefined) dbPatch.is_tax_payer = patch.isTaxPayer;
        if (patch.bankAccounts) dbPatch.bank_accounts = patch.bankAccounts;

        delete dbPatch.taxId; delete dbPatch.logoUrl; delete dbPatch.isDefault; delete dbPatch.isTaxPayer; delete dbPatch.bankAccounts;

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

        const { error } = await supabase.from('payments').insert({
            id: newPayment.id,
            amount: newPayment.amount,
            date: newPayment.date,
            reference: newPayment.reference,
            notes: newPayment.notes,
            invoice_id: newPayment.invoiceId,
            method_id: newPayment.methodId,
            destination_account_id: newPayment.destinationAccountId
        });

        if (error) {
            console.error("Error adding payment:", error);
            return;
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
        if (patch.parentId) dbPatch.parent_id = patch.parentId;
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
            sku: newItem.sku,
            description: newItem.description,
            price: newItem.price,
            cost: newItem.cost,
            stock: newItem.stock,
            min_stock: newItem.minStock,
            category_id: newItem.categoryId
        });
        if (error) console.error("Error adding product:", error);
        return newItem.id;
    };

    const updateProduct = async (id: string, patch: Partial<Product>) => {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
        const dbPatch: any = { ...patch };
        if (patch.minStock) dbPatch.min_stock = patch.minStock;
        if (patch.categoryId) dbPatch.category_id = patch.categoryId;
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
            notes: purchaseHeader.notes,
            supplier_id: purchaseHeader.supplierId,
            supplier_name: purchaseHeader.supplierName,
            business_identity_id: purchaseHeader.businessIdentityId,
            receipt_url: purchaseHeader.receiptUrl
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
            password: newItem.password,
            encryption: newItem.encryption,
            model: newItem.model,
            area: newItem.area,
            gateway: newItem.gateway,
            dns: newItem.dns,
            notes: newItem.notes,
            is_hidden: newItem.isHidden,
            device_type: newItem.deviceType,
            device_brand: newItem.deviceBrand,
            client_id: newItem.clientId,
            ip_address: newItem.ipAddress,
            subnet_mask: newItem.subnetMask,
            photo_url: newItem.photoUrl
        });
        if (error) console.error("Error adding wifi:", error);
    };

    const updateWifiNetwork = async (id: string, patch: Partial<WifiNetwork>) => {
        setWifiNetworks(prev => prev.map(w => w.id === id ? { ...w, ...patch } : w));
        const dbPatch: any = { ...patch };
        if (patch.isHidden !== undefined) dbPatch.is_hidden = patch.isHidden;
        if (patch.deviceType) dbPatch.device_type = patch.deviceType;
        if (patch.deviceBrand) dbPatch.device_brand = patch.deviceBrand;
        if (patch.clientId) dbPatch.client_id = patch.clientId;
        if (patch.ipAddress) dbPatch.ip_address = patch.ipAddress;
        if (patch.subnetMask) dbPatch.subnet_mask = patch.subnetMask;
        if (patch.photoUrl) dbPatch.photo_url = patch.photoUrl;

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
        const newOrder = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
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
            notes: orderHeader.notes,
            client_id: orderHeader.clientId,
            client_name: orderHeader.clientName,
            client_email: orderHeader.clientEmail,
            client_phone: orderHeader.clientPhone,
            estimated_date: orderHeader.estimatedDate,
            technician_notes: orderHeader.technicianNotes,
            invoice_id: orderHeader.invoiceId,
            business_identity_id: orderHeader.businessIdentityId
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
        if (patch.clientId) dbPatch.client_id = patch.clientId;
        if (patch.clientName) dbPatch.client_name = patch.clientName;
        if (patch.clientEmail) dbPatch.client_email = patch.clientEmail;
        if (patch.clientPhone) dbPatch.client_phone = patch.clientPhone;
        if (patch.estimatedDate) dbPatch.estimated_date = patch.estimatedDate;
        if (patch.technicianNotes) dbPatch.technician_notes = patch.technicianNotes;
        if (patch.invoiceId) dbPatch.invoice_id = patch.invoiceId;
        if (patch.businessIdentityId) dbPatch.business_identity_id = patch.businessIdentityId;
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
        // Implement export if needed, effectively simpler just dumping tables
    };

    const importData = async (jsonData: string) => {
        // Not implemented for Supabase yet (complex to handle ID conflicts and relations)
        console.warn("Import not supported in Cloud mode yet.");
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
