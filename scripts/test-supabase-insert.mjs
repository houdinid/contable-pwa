import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zugoozopxxemlewtvjij.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1Z29vem9weHhlbWxld3R2amlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTI5MTc5MCwiZXhwIjoyMDg2ODY3NzkwfQ.lIDsOdomnqtnvjMTXLAipugyCdMI9v17PQKmy7sw4Qs';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    const id = crypto.randomUUID();
    const invoiceHeader = {
        id: id,
        number: "0001",
        date: new Date().toISOString().split('T')[0],
        subtotal: 100,
        tax: 19,
        total: 119,
        status: "pending",
        type: "invoice",
        notes: null,
        issuer_id: null,
        due_date: null,
        credit_days: null,
        contact_id: null,
        contact_name: "Test Contact",
        destination_account_id: null
    };

    const { error: invoiceError } = await supabase.from('invoices').insert(invoiceHeader);

    if (invoiceError) {
        console.error("HEADER ERROR:", invoiceError);
        return;
    }
    
    console.log("Header success. Now testing items...");

    const itemsToInsert = [{
        id: crypto.randomUUID(),
        description: "Test Item",
        quantity: 1,
        price: 100,
        total: 100,
        invoice_id: id
    }];

    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);

    if (itemsError) {
        console.error("ITEMS ERROR:", itemsError);
    } else {
        console.log("Items inserted successfully!");
    }
}

testInsert();
