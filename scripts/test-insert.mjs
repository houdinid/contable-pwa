import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    dotenv.config({ path: '.env' });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Testing insert with undefined/empty fields...");

    // Simulate what addContact does during CSV import
    const newContact = {
        id: crypto.randomUUID(),
        name: 'Test Contact CSV',
        type: 'client',
        // Optional fields from CSV that might be undefined or ""
        email: "",
        phone: "",
        address: "",
        contactPerson: "",
        taxId: "",
        specialtyId: undefined, // Suppose not provided
        website: "",
        bankAccounts: []
    };

    const { data, error } = await supabase.from('contacts').insert({
        id: newContact.id,
        name: newContact.name,
        email: newContact.email || null,
        phone: newContact.phone || null,
        address: newContact.address || null,
        type: newContact.type,
        contact_person: newContact.contactPerson || null,
        tax_id: newContact.taxId || null,
        specialty_id: newContact.specialtyId || null,
        default_expense_category_id: null,
        google_maps_url: null,
        website: newContact.website || null,
        credit_balance: 0,
        bank_accounts: newContact.bankAccounts || []
    }).select();

    if (error) {
        console.error('Insert failed:', error);
        console.error('Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } else {
        console.log('Insert success:', data);
    }
}

testInsert();
