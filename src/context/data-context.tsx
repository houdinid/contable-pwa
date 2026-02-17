"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./auth-context";
import { encryptData, decryptData } from "@/lib/encryption";
import type { Contact, Invoice, Expense, BusinessIdentity, SupplierCategory, Payment, PaymentMethod, ExpenseCategoryItem, Product, Purchase, WifiNetwork, ServiceOrder } from "@/types";

interface DataContextType {
    contacts: Contact[];
    invoices: Invoice[];
    expenses: Expense[];
    businessIdentities: BusinessIdentity[];
    supplierCategories: SupplierCategory[];
    paymentMethods: PaymentMethod[];
    payments: Payment[];
    expenseCategories: ExpenseCategoryItem[]; // New State
    products: Product[];
    purchases: Purchase[];

    wifiNetworks: WifiNetwork[];
    serviceOrders: ServiceOrder[]; // New State

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

const STORAGE_KEYS = {
    CONTACTS: "data_contacts",
    INVOICES: "data_invoices",
    EXPENSES: "data_expenses",
    IDENTITIES: "data_identities",
    SUPPLIER_CATEGORIES: "data_supplier_categories",
    PAYMENT_METHODS: "data_payment_methods",
    PAYMENTS: "data_payments",

    EXPENSE_CATEGORIES: "data_expense_categories", // New Key
    PRODUCTS: "data_products",
    PURCHASES: "data_purchases",

    WIFI_NETWORKS: "data_wifi_networks",
    SERVICE_ORDERS: "data_service_orders",

};

export function DataProvider({ children }: { children: React.ReactNode }) {
    const { encryptionKey, isAuthenticated } = useAuth();
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


    // Load data when authenticated
    useEffect(() => {
        if (!isAuthenticated || !encryptionKey) {
            setContacts([]);
            setInvoices([]);
            setExpenses([]);
            setBusinessIdentities([]);
            setSupplierCategories([]);
            setPaymentMethods([]);
            setPayments([]);

            setExpenseCategories([]);
            setProducts([]);
            setPurchases([]);

            setWifiNetworks([]);
            setServiceOrders([]);
            setLoadingData(false);

            return;
        }

        const loadData = async () => {
            setLoadingData(true);
            try {
                const [contactsData, invoicesData, expensesData, identitiesData, categoriesData, methodsData, paymentsData, expCategoriesData, productsData, purchasesData, wifiData, serviceOrdersData] = await Promise.all([
                    loadEncrypted<Contact[]>(STORAGE_KEYS.CONTACTS, encryptionKey),
                    loadEncrypted<Invoice[]>(STORAGE_KEYS.INVOICES, encryptionKey),
                    loadEncrypted<Expense[]>(STORAGE_KEYS.EXPENSES, encryptionKey),
                    loadEncrypted<BusinessIdentity[]>(STORAGE_KEYS.IDENTITIES, encryptionKey),
                    loadEncrypted<SupplierCategory[]>(STORAGE_KEYS.SUPPLIER_CATEGORIES, encryptionKey),
                    loadEncrypted<PaymentMethod[]>(STORAGE_KEYS.PAYMENT_METHODS, encryptionKey),
                    loadEncrypted<Payment[]>(STORAGE_KEYS.PAYMENTS, encryptionKey),
                    loadEncrypted<ExpenseCategoryItem[]>(STORAGE_KEYS.EXPENSE_CATEGORIES, encryptionKey),
                    loadEncrypted<Product[]>(STORAGE_KEYS.PRODUCTS, encryptionKey),
                    loadEncrypted<Purchase[]>(STORAGE_KEYS.PURCHASES, encryptionKey),
                    loadEncrypted<WifiNetwork[]>(STORAGE_KEYS.WIFI_NETWORKS, encryptionKey),
                    loadEncrypted<ServiceOrder[]>(STORAGE_KEYS.SERVICE_ORDERS, encryptionKey),
                ]);

                setContacts(contactsData || []);
                setInvoices(invoicesData || []);
                setExpenses(expensesData || []);
                setBusinessIdentities(identitiesData || []);
                setPayments(paymentsData || []);
                setExpenseCategories(expCategoriesData || []);
                setProducts(productsData || []); // @ts-ignore
                setPurchases(purchasesData || []);

                setWifiNetworks(wifiData || []);
                setServiceOrders(serviceOrdersData || []);


                // Initialize default categories
                if (!categoriesData || categoriesData.length === 0) {
                    const defaults = [
                        { id: '1', name: 'Tecnología' },
                        { id: '2', name: 'Servicios' },
                        { id: '3', name: 'Suministros' },
                        { id: '4', name: 'Materia Prima' }
                    ];
                    setSupplierCategories(defaults);
                    saveEncrypted(STORAGE_KEYS.SUPPLIER_CATEGORIES, defaults);
                } else {
                    setSupplierCategories(categoriesData);
                }

                // Initialize default payment methods
                if (!methodsData || methodsData.length === 0) {
                    const defaults: PaymentMethod[] = [
                        { id: '1', name: 'Efectivo', type: 'cash' },
                        { id: '2', name: 'Bancolombia', type: 'bank' },
                        { id: '3', name: 'Nequi', type: 'bank' },
                        { id: '4', name: 'Daviplata', type: 'bank' },
                        { id: '5', name: 'USDT (Cripto)', type: 'crypto' },
                    ];
                    setPaymentMethods(defaults);
                    saveEncrypted(STORAGE_KEYS.PAYMENT_METHODS, defaults);
                } else {
                    setPaymentMethods(methodsData);
                }

                // Initialize default expense categories
                if (!expCategoriesData || expCategoriesData.length === 0) {
                    const defaults: ExpenseCategoryItem[] = [
                        { id: 'office', name: 'Oficina y Papelería' },
                        { id: 'transport', name: 'Transporte y Viáticos' },
                        { id: 'salary', name: 'Nómina y Salarios' },
                        { id: 'utilities', name: 'Servicios Públicos' },
                        { id: 'other', name: 'Otros Gastos' },
                    ];
                    setExpenseCategories(defaults);
                    saveEncrypted(STORAGE_KEYS.EXPENSE_CATEGORIES, defaults);
                } else {
                    setExpenseCategories(expCategoriesData);
                }

            } catch (e) {
                console.error("Failed to load data", e);
            } finally {
                setLoadingData(false);
            }
        };

        loadData();
    }, [isAuthenticated, encryptionKey]);

    // Helper to load encrypted data
    const loadEncrypted = async <T,>(key: string, cryptoKey: CryptoKey): Promise<T | null> => {
        const stored = localStorage.getItem(key);
        if (!stored) return null;
        return decryptData<T>(stored, cryptoKey);
    };

    // Helper to save encrypted data
    const saveEncrypted = async (key: string, data: any) => {
        if (!encryptionKey) return;
        const encrypted = await encryptData(data, encryptionKey);
        localStorage.setItem(key, encrypted);
    };

    // --- Actions ---

    // ... (Keep existing actions for Contacts, Expenses, Identities, Categories) ...

    const addContact = async (contactData: Omit<Contact, "id" | "createdAt">) => {
        const newContact: Contact = { ...contactData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const updated = [...contacts, newContact];
        setContacts(updated);
        await saveEncrypted(STORAGE_KEYS.CONTACTS, updated);
        return newContact.id;
    };

    const updateContact = async (id: string, patch: Partial<Contact>) => {
        const updated = contacts.map(c => c.id === id ? { ...c, ...patch } : c);
        setContacts(updated);
        await saveEncrypted(STORAGE_KEYS.CONTACTS, updated);
    };

    const deleteContact = async (id: string) => {
        const updated = contacts.filter(c => c.id !== id);
        setContacts(updated);
        await saveEncrypted(STORAGE_KEYS.CONTACTS, updated);
    };

    const addInvoice = async (invoiceData: Omit<Invoice, "id" | "createdAt">) => {
        const newInvoice: Invoice = { ...invoiceData, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const updated = [...invoices, newInvoice];
        setInvoices(updated);
        await saveEncrypted(STORAGE_KEYS.INVOICES, updated);
    };

    const updateInvoice = async (id: string, patch: Partial<Invoice>) => {
        const updated = invoices.map(i => i.id === id ? { ...i, ...patch } : i);
        setInvoices(updated);
        await saveEncrypted(STORAGE_KEYS.INVOICES, updated);
    };

    const addExpense = async (expense: Omit<Expense, "id" | "createdAt">) => {
        const newExpense: Expense = { ...expense, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const updated = [newExpense, ...expenses];
        setExpenses(updated);
        await saveEncrypted(STORAGE_KEYS.EXPENSES, updated);
    };

    const updateExpense = async (id: string, patch: Partial<Expense>) => {
        const updated = expenses.map(e => e.id === id ? { ...e, ...patch } : e);
        setExpenses(updated);
        await saveEncrypted(STORAGE_KEYS.EXPENSES, updated);
    };

    const deleteExpense = async (id: string) => {
        const updated = expenses.filter(e => e.id !== id);
        setExpenses(updated);
        await saveEncrypted(STORAGE_KEYS.EXPENSES, updated);
    };

    const addBusinessIdentity = async (data: Omit<BusinessIdentity, "id">) => {
        const newIdentity: BusinessIdentity = { ...data, id: crypto.randomUUID() };
        let updated = [...businessIdentities, newIdentity];
        if (newIdentity.isDefault) updated = updated.map(id => id.id === newIdentity.id ? id : { ...id, isDefault: false });
        else if (updated.length === 1) updated[0].isDefault = true;
        setBusinessIdentities(updated);
        await saveEncrypted(STORAGE_KEYS.IDENTITIES, updated);
    };

    const updateBusinessIdentity = async (id: string, patch: Partial<BusinessIdentity>) => {
        let updated = businessIdentities.map(i => i.id === id ? { ...i, ...patch } : i);
        if (patch.isDefault) updated = updated.map(i => i.id === id ? i : { ...i, isDefault: false });
        setBusinessIdentities(updated);
        await saveEncrypted(STORAGE_KEYS.IDENTITIES, updated);
    };

    const deleteBusinessIdentity = async (id: string) => {
        const updated = businessIdentities.filter(i => i.id !== id);
        setBusinessIdentities(updated);
        await saveEncrypted(STORAGE_KEYS.IDENTITIES, updated);
    };

    const addSupplierCategory = async (name: string) => {
        const newCat: SupplierCategory = { id: crypto.randomUUID(), name };
        const updated = [...supplierCategories, newCat];
        setSupplierCategories(updated);
        await saveEncrypted(STORAGE_KEYS.SUPPLIER_CATEGORIES, updated);
    };

    const deleteSupplierCategory = async (id: string) => {
        const updated = supplierCategories.filter(c => c.id !== id);
        setSupplierCategories(updated);
        await saveEncrypted(STORAGE_KEYS.SUPPLIER_CATEGORIES, updated);
    };

    // --- Payments ---

    const addPaymentMethod = async (data: Omit<PaymentMethod, "id">) => {
        const newMethod: PaymentMethod = { ...data, id: crypto.randomUUID() };
        const updated = [...paymentMethods, newMethod];
        setPaymentMethods(updated);
        await saveEncrypted(STORAGE_KEYS.PAYMENT_METHODS, updated);
    };

    const deletePaymentMethod = async (id: string) => {
        const updated = paymentMethods.filter(p => p.id !== id);
        setPaymentMethods(updated);
        await saveEncrypted(STORAGE_KEYS.PAYMENT_METHODS, updated);
    };

    const addPayment = async (input: Omit<Payment, "id" | "createdAt">) => {
        const newPayment: Payment = {
            ...input,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        const updatedPayments = [...payments, newPayment];
        setPayments(updatedPayments);
        await saveEncrypted(STORAGE_KEYS.PAYMENTS, updatedPayments);

        // Update Invoice Status logic
        // Calculate total paid for this invoice
        const invoicePayments = updatedPayments.filter(p => p.invoiceId === input.invoiceId);
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);

        const invoice = invoices.find(i => i.id === input.invoiceId);
        if (invoice) {
            let newStatus = invoice.status;
            if (totalPaid >= invoice.total) {
                newStatus = 'paid';
            } else if (totalPaid > 0 && invoice.status !== 'cancelled') {
                newStatus = 'pending'; // Or 'partial' if we had that status, but 'pending' implies not fully paid
            }

            if (newStatus !== invoice.status) {
                await updateInvoice(invoice.id, { status: newStatus });
            }
        }
    };

    // --- Expense Categories ---

    const addExpenseCategory = async (data: Omit<ExpenseCategoryItem, "id">) => {
        const newItem: ExpenseCategoryItem = { ...data, id: crypto.randomUUID() };
        const updated = [...expenseCategories, newItem];
        setExpenseCategories(updated);
        await saveEncrypted(STORAGE_KEYS.EXPENSE_CATEGORIES, updated);
    };

    const updateExpenseCategory = async (id: string, patch: Partial<ExpenseCategoryItem>) => {
        const updated = expenseCategories.map(c => c.id === id ? { ...c, ...patch } : c);
        setExpenseCategories(updated);
        await saveEncrypted(STORAGE_KEYS.EXPENSE_CATEGORIES, updated);
    };

    const deleteExpenseCategory = async (id: string) => {
        // Also delete subcategories? For now, we'll keep it simple, maybe prevent deletion if has children in UI
        const updated = expenseCategories.filter(c => c.id !== id && c.parentId !== id);
        setExpenseCategories(updated);
        await saveEncrypted(STORAGE_KEYS.EXPENSE_CATEGORIES, updated);
    };

    // --- Products ---

    const addProduct = async (data: Omit<Product, "id" | "createdAt">) => {
        const newItem: Product = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const updated = [...products, newItem];
        setProducts(updated);
        await saveEncrypted(STORAGE_KEYS.PRODUCTS, updated);
        return newItem.id;
    };

    const updateProduct = async (id: string, patch: Partial<Product>) => {
        const updated = products.map(p => p.id === id ? { ...p, ...patch } : p);
        setProducts(updated);
        await saveEncrypted(STORAGE_KEYS.PRODUCTS, updated);
    };

    const deleteProduct = async (id: string) => {
        const updated = products.filter(p => p.id !== id);
        setProducts(updated);
        await saveEncrypted(STORAGE_KEYS.PRODUCTS, updated);
    };

    // --- Purchases ---

    const addPurchase = async (data: Omit<Purchase, "id" | "createdAt">) => {
        const newPurchase: Purchase = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };

        // 1. Save Purchase
        const updatedPurchases = [newPurchase, ...purchases];
        setPurchases(updatedPurchases);
        await saveEncrypted(STORAGE_KEYS.PURCHASES, updatedPurchases);

        // 2. Update Stock
        let updatedProducts = [...products];
        let stockChanged = false;

        data.items.forEach(item => {
            const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
            if (productIndex >= 0) {
                const product = updatedProducts[productIndex];

                // Calculate new cost average
                // New Cost Avg = ((OldStock * OldCost) + (NewQty * NewCost)) / (OldStock + NewQty)
                const currentTotalValue = product.stock * product.cost;
                const newIncomingValue = item.quantity * item.unitCost;
                const newStock = product.stock + item.quantity;
                const newCost = newStock > 0 ? (currentTotalValue + newIncomingValue) / newStock : item.unitCost;

                updatedProducts[productIndex] = {
                    ...product,
                    stock: newStock,
                    cost: newCost
                };
                stockChanged = true;
            }
        });

        if (stockChanged) {
            setProducts(updatedProducts);
            await saveEncrypted(STORAGE_KEYS.PRODUCTS, updatedProducts);
        }
    };

    // --- WiFi Networks ---

    const addWifiNetwork = async (data: Omit<WifiNetwork, "id" | "createdAt">) => {
        const newItem: WifiNetwork = { ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        const updated = [...wifiNetworks, newItem];
        setWifiNetworks(updated);
        await saveEncrypted(STORAGE_KEYS.WIFI_NETWORKS, updated);
    };

    const updateWifiNetwork = async (id: string, patch: Partial<WifiNetwork>) => {
        const updated = wifiNetworks.map(w => w.id === id ? { ...w, ...patch } : w);
        setWifiNetworks(updated);
        await saveEncrypted(STORAGE_KEYS.WIFI_NETWORKS, updated);
    };

    const deleteWifiNetwork = async (id: string) => {
        const updated = wifiNetworks.filter(w => w.id !== id);
        setWifiNetworks(updated);
        await saveEncrypted(STORAGE_KEYS.WIFI_NETWORKS, updated);
    };

    // --- Service Orders ---

    const addServiceOrder = async (data: Omit<ServiceOrder, "id" | "createdAt" | "updatedAt">) => {
        const newOrder: ServiceOrder = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const updated = [newOrder, ...serviceOrders];
        setServiceOrders(updated);
        await saveEncrypted(STORAGE_KEYS.SERVICE_ORDERS, updated);
        return newOrder.id;
    };

    const updateServiceOrder = async (id: string, patch: Partial<ServiceOrder>) => {
        const updated = serviceOrders.map(o => o.id === id ? { ...o, ...patch, updatedAt: new Date().toISOString() } : o);
        setServiceOrders(updated);
        await saveEncrypted(STORAGE_KEYS.SERVICE_ORDERS, updated);
    };

    const deleteServiceOrder = async (id: string) => {
        const updated = serviceOrders.filter(o => o.id !== id);
        setServiceOrders(updated);
        await saveEncrypted(STORAGE_KEYS.SERVICE_ORDERS, updated);
    };


    const exportData = async () => {
        if (!encryptionKey) return;
        const store = {
            contacts, invoices, expenses, businessIdentities, supplierCategories, paymentMethods, payments, expenseCategories, products, purchases, wifiNetworks, serviceOrders,
            exportDate: new Date().toISOString(),

            version: "1.5" // Version bump
        };
        const blob = new Blob([JSON.stringify(store, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `backup-contable-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    };

    const importData = async (jsonData: string) => {
        if (!encryptionKey) return;
        try {
            const data = JSON.parse(jsonData);
            setContacts(data.contacts || []);
            setInvoices(data.invoices || []);
            setExpenses(data.expenses || []);
            setBusinessIdentities(data.businessIdentities || []);
            setSupplierCategories(data.supplierCategories || []);
            setPaymentMethods(data.paymentMethods || []);
            setPayments(data.payments || []);
            setExpenseCategories(data.expenseCategories || []);
            setProducts(data.products || []);
            setPurchases(data.purchases || []);
            setWifiNetworks(data.wifiNetworks || []);
            setServiceOrders(data.serviceOrders || []);

            await saveEncrypted(STORAGE_KEYS.CONTACTS, data.contacts || []);

            await saveEncrypted(STORAGE_KEYS.INVOICES, data.invoices || []);
            await saveEncrypted(STORAGE_KEYS.EXPENSES, data.expenses || []);
            await saveEncrypted(STORAGE_KEYS.IDENTITIES, data.businessIdentities || []);
            await saveEncrypted(STORAGE_KEYS.SUPPLIER_CATEGORIES, data.supplierCategories || []);
            await saveEncrypted(STORAGE_KEYS.PAYMENT_METHODS, data.paymentMethods || []);
            await saveEncrypted(STORAGE_KEYS.PAYMENTS, data.payments || []);
            await saveEncrypted(STORAGE_KEYS.EXPENSE_CATEGORIES, data.expenseCategories || []);
            await saveEncrypted(STORAGE_KEYS.PRODUCTS, data.products || []);
            await saveEncrypted(STORAGE_KEYS.PURCHASES, data.purchases || []);
            await saveEncrypted(STORAGE_KEYS.WIFI_NETWORKS, data.wifiNetworks || []);
            await saveEncrypted(STORAGE_KEYS.SERVICE_ORDERS, data.serviceOrders || []);
        } catch (e) {

            console.error("Import failed", e);
            throw e;
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
