
import { createClient } from '@supabase/supabase-js';

// Configuration (Hardcoded from .env.local for script execution)
const SUPABASE_URL = 'https://zugoozopxxemlewtvjij.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyOTE3OTAsImV4cCI6MjA4Njg2Nzc5MH0.I8WDdVhvztd_NMEYarmCa4QCP2Gw5LsTf36ZvivCogg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const expenseCategories = [
    { id: 'office', name: 'Oficina y Papelería', color: '#60a5fa' },
    { id: 'rent', name: 'Arriendo y Locales', color: '#f472b6' },
    { id: 'utilities', name: 'Servicios Públicos', color: '#fbbf24' },
    { id: 'payroll', name: 'Nómina y Salarios', color: '#4ade80' },
    { id: 'marketing', name: 'Publicidad y Marketing', color: '#a78bfa' },
    { id: 'software', name: 'Software y Suscripciones', color: '#2dd4bf' },
    { id: 'maintenance', name: 'Mantenimiento y Reparaciones', color: '#f87171' },
    { id: 'taxes', name: 'Impuestos y Legal', color: '#9ca3af' },
    { id: 'transport', name: 'Transporte y Viáticos', color: '#fb923c' },
    { id: 'inventory', name: 'Compra de Mercancía', color: '#818cf8' },
    { id: 'other', name: 'Otros Gastos', color: '#94a3b8' }
];

const paymentMethods = [
    { name: 'Efectivo', type: 'cash' },
    { name: 'Bancolombia', type: 'bank' },
    { name: 'Nequi', type: 'other' },
    { name: 'DaviPlata', type: 'other' },
    { name: 'Tarjeta de Crédito', type: 'bank' },
    { name: 'Tarjeta de Débito', type: 'bank' },
    { name: 'Transferencia Bancaria', type: 'bank' }
];

const supplierCategories = [
    { name: 'Tecnología y Equipos' },
    { name: 'Servicios Profesionales' },
    { name: 'Suministros de Oficina' },
    { name: 'Mantenimiento' },
    { name: 'Mayoristas' },
    { name: 'Servicios Públicos' }
];

async function seed() {
    console.log('🌱 Starting seed...');

    // 1. Expense Categories
    const { error: catError } = await supabase
        .from('expense_categories')
        .upsert(expenseCategories, { onConflict: 'id' });

    if (catError) console.error('❌ Error seeding expense_categories:', catError.message);
    else console.log('✅ Expense categories seeded.');

    // 2. Payment Methods
    // Need to manually generate UUIDs if we don't let DB do it, but here we can just insert and let DB handle ID if default, 
    // BUT the schema says "id uuid primary key". It does NOT say "default uuid_generate_v4()".
    // So we must generate them.
    const paymentMethodsWithIds = paymentMethods.map(pm => ({
        id: crypto.randomUUID(),
        ...pm
    }));

    const { error: payError } = await supabase
        .from('payment_methods')
        .upsert(paymentMethodsWithIds, { onConflict: 'name', ignoreDuplicates: true }); // Using name as "conflict" check logic via ignoreDuplicates if constraints allowed, but schema has PK on ID. 
    // Actually, upserting by ID is standard. If we don't know IDs, we can't easily upsert to "update".
    // Cleanest is to insert and ignore error or just insert.
    // Let's just try insert.

    // Re-reading schema: payment_methods id is just "uuid primary key". No default.
    // So we must provide ID.
    // But wait, if we run this twice, we will create duplicates if we generate new UUIDs.
    // Better to check if they exist by name first? Or just lets assume empty DB as user said "vacia".
    // I will check for existence first to be safe.

    for (const method of paymentMethods) {
        const { data: existing } = await supabase.from('payment_methods').select('id').eq('name', method.name).single();
        if (!existing) {
            await supabase.from('payment_methods').insert({ id: crypto.randomUUID(), ...method });
        }
    }
    console.log('✅ Payment methods seeded.');

    // 3. Supplier Categories
    // Schema: id uuid primary key.
    for (const cat of supplierCategories) {
        const { data: existing } = await supabase.from('supplier_categories').select('id').eq('name', cat.name).single();
        if (!existing) {
            await supabase.from('supplier_categories').insert({ id: crypto.randomUUID(), ...cat });
        }
    }
    console.log('✅ Supplier categories seeded.');

    console.log('🏁 Seed completed!');
}

seed();
