import { NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const maxDuration = 60; // Set max duration for serverless function (optional)

// Bypassing RLS with Service Role Key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Map months for Spanish formatting
const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", 
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export async function GET(req: Request) {
    try {
        // Simple security: Check cron secret (Authorization Bearer or a custom header/query param)
        const url = new URL(req.url);
        const authHeader = req.headers.get('authorization');
        const token = url.searchParams.get('token');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}` && token !== cronSecret) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const today = new Date();
        const currentDay = today.getDate();
        const currentMonthName = monthNames[today.getMonth()];
        const currentYear = today.getFullYear();

        // 1. Fetch clients eligible for today
        const { data: contacts, error: contactsError } = await supabaseAdmin
            .from('contacts')
            .select('*')
            .eq('type', 'client')
            .eq('isRecurringBilling', true)
            .eq('recurringDayOfMonth', currentDay);

        if (contactsError) throw contactsError;

        if (!contacts || contacts.length === 0) {
            return NextResponse.json({ message: 'No hay clientes para facturar hoy.' });
        }

        // Configure Nodemailer for Zoho
        const transporter = nodemailer.createTransport({
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.ZOHO_EMAIL,
                pass: process.env.ZOHO_APP_PASSWORD,
            },
        });

        const invoicesGenerated = [];
        let totalBilled = 0;

        // Process each client
        for (const client of contacts) {
            // Dynamic description (e.g. "Servicio de Mantenimiento - Septiembre 2026")
            const baseDescription = client.recurringDescription || "Servicio mensual";
            const dynamicDescription = `${baseDescription} - ${currentMonthName} ${currentYear}`;
            const amount = client.recurringAmount || 0;

            const invoiceId = crypto.randomUUID();
            const invoiceNumber = `FAC-${String(Date.now()).slice(-6)}`;
            
            // 2. Insert Invoice
            const invoiceHeader = {
                id: invoiceId,
                number: invoiceNumber,
                date: today.toISOString(),
                subtotal: amount,
                tax: 0,
                total: amount,
                status: 'pending',
                type: 'invoice',
                contact_id: client.id,
                contact_name: client.name,
                created_at: new Date().toISOString()
            };

            const { error: invoiceError } = await supabaseAdmin.from('invoices').insert(invoiceHeader);
            if (invoiceError) {
                console.error(`Error creando factura para ${client.name}:`, invoiceError);
                continue;
            }

            // Insert Invoice Item
            const invoiceItem = {
                id: crypto.randomUUID(),
                invoice_id: invoiceId,
                description: dynamicDescription,
                quantity: 1,
                price: amount,
                total: amount
            };

            await supabaseAdmin.from('invoice_items').insert(invoiceItem);
            invoicesGenerated.push(client.name);
            totalBilled += amount;

            // 3. Send Email to Client (if they have an email)
            if (client.email && process.env.ZOHO_EMAIL && process.env.ZOHO_APP_PASSWORD) {
                try {
                    await transporter.sendMail({
                        from: `"Administración" <${process.env.ZOHO_EMAIL}>`,
                        to: client.email,
                        subject: `Nueva Factura Generada: ${invoiceNumber}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                                <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: white;">
                                    <h2 style="margin: 0;">Factura de Servicios</h2>
                                </div>
                                <div style="padding: 20px;">
                                    <p>Hola <strong>${client.name}</strong>,</p>
                                    <p>Se ha generado tu factura <strong>#${invoiceNumber}</strong> correspondiente al mes actual.</p>
                                    
                                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                                        <p style="margin: 5px 0;"><strong>Concepto:</strong> ${dynamicDescription}</p>
                                        <p style="margin: 5px 0;"><strong>Total a pagar:</strong> $${amount.toLocaleString('es-CO')}</p>
                                    </div>

                                    <p>Por favor, realiza el pago a tu mayor brevedad posible. Para cualquier duda, contáctanos.</p>
                                </div>
                                <div style="background-color: #f9fafb; padding: 10px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb;">
                                    Este es un correo automático generado por Contable PWA.
                                </div>
                            </div>
                        `
                    });
                } catch (emailError) {
                    console.error(`Error enviando correo a ${client.email}:`, emailError);
                }
            }
        }

        // 4. Send WhatsApp Notification to Admin via CallMeBot
        if (invoicesGenerated.length > 0 && process.env.CALLMEBOT_PHONE && process.env.CALLMEBOT_API_KEY) {
            try {
                const message = `✅ *Agente PWA Automático*\n\nSe generaron facturas recurrentes exitosamente:\n\n*Clientes:* ${invoicesGenerated.join(', ')}\n*Total Facturado:* $${totalBilled.toLocaleString('es-CO')}\n*Mes:* ${currentMonthName} ${currentYear}`;
                const encodedMessage = encodeURIComponent(message);
                
                const wappUrl = `https://api.callmebot.com/whatsapp.php?phone=${process.env.CALLMEBOT_PHONE}&text=${encodedMessage}&apikey=${process.env.CALLMEBOT_API_KEY}`;
                await fetch(wappUrl);
            } catch (wappError) {
                console.error("Error enviando WhatsApp:", wappError);
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Proceso completado. Facturas generadas: ${invoicesGenerated.length}`,
            clients: invoicesGenerated
        });

    } catch (error: any) {
        console.error("Error en cron job recurrente:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
