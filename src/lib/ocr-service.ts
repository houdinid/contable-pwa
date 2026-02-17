import { createWorker } from 'tesseract.js';
import { Contact } from '@/types';

export interface ParsedExpenseData {
    amount?: number;
    date?: string;
    accountNumber?: string;
    matchedContactId?: string;
    rawText: string;
}

export const OCRService = {
    /**
     * Recognize text from an image file using Tesseract.js
     */
    recognizeText: async (imageFile: File, onProgress?: (progress: number) => void): Promise<string> => {
        const worker = await createWorker('spa'); // Spanish language

        if (onProgress) {
            // Tesseract doesn't expose a clean progress hook in the simple API, 
            // but we can simulate or just wait. 
            // For better UX in future, we could capture logger output.
            onProgress(0.5);
        }

        const ret = await worker.recognize(imageFile);
        const text = ret.data.text;
        await worker.terminate();

        if (onProgress) onProgress(1);
        return text;
    },

    /**
     * Parse text to find Amount, Date, and Account Number
     */
    parseTransferReceipt: (text: string, contacts: Contact[]): ParsedExpenseData => {
        const result: ParsedExpenseData = { rawText: text };

        // 1. Clean text
        const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

        // 2. Extract Amount (Looking for patterns like $ 16.000 or 16,000.00)
        // Matches: $ 16.000, 16.000, $16000
        const amountRegex = /\$\s?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)|([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2})?)/g;
        const potentialAmounts = text.match(amountRegex);

        if (potentialAmounts) {
            // Filter and find the largest number which is usually the total
            const amounts = potentialAmounts.map(val => {
                // Normalize: remove $ and dots, replace comma with dot if it looks like decimal
                // Heuristic for Colombia: 16.000 is 16000. 16,000.00 is 16000.
                let numStr = val.replace(/\$/g, '').trim();

                if (numStr.includes('.') && numStr.includes(',')) {
                    // 16,000.00 -> 16000.00
                    numStr = numStr.replace(/,/g, '');
                } else if (numStr.split('.').length > 1 && numStr.split('.')[1].length === 3) {
                    // 16.000 -> 16000 (thousands separator)
                    numStr = numStr.replace(/\./g, '');
                } else if (numStr.includes(',')) {
                    // 16,000 -> 16000 (if comma likely decimal but no cents, or thousands)
                    // Let's assume comma is decimal if 2 digits follow, or thousands if 3
                    const parts = numStr.split(',');
                    if (parts[1] && parts[1].length === 3) {
                        numStr = numStr.replace(/,/g, '');
                    } else {
                        numStr = numStr.replace(/,/g, '.');
                    }
                } else if (numStr.split('.').length > 1 && numStr.split('.')[1].length !== 3) {
                    // 1.50 -> 1.50 (decimal)
                    // Keep as is
                } else {
                    // 16.000 -> 16000
                    numStr = numStr.replace(/\./g, '');
                }

                return parseFloat(numStr);
            }).filter(n => !isNaN(n));

            if (amounts.length > 0) {
                // Try to pick the one that looks like a total (often the largest, or specific position)
                // For now, max value is a safe bet for receipts
                result.amount = Math.max(...amounts);
            }
        }

        // 3. Extract Date (DD MMM YYYY, DD/MM/YYYY)
        // 14 Feb 2026, 14/02/2026
        const dateRegex = /(\d{1,2})\s?(?:Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?(\d{4})|(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i;
        const dateMatch = text.match(dateRegex);

        if (dateMatch) {
            try {
                // Determine format
                if (dateMatch[3]) {
                    // DD/MM/YYYY
                    const day = dateMatch[3].padStart(2, '0');
                    const month = dateMatch[4].padStart(2, '0');
                    const year = dateMatch[5];
                    result.date = `${year}-${month}-${day}`;
                } else {
                    // DD Month YYYY
                    const day = dateMatch[1].padStart(2, '0');
                    const year = dateMatch[2];
                    const monthStr = text.match(/(?:Ene|Feb|Mar|Abr|May|Jun|Jul|Ago|Sep|Oct|Nov|Dic|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)?.[0];

                    const months: { [key: string]: string } = {
                        'ene': '01', 'jan': '01', 'feb': '02', 'mar': '03', 'abr': '04', 'apr': '04',
                        'may': '05', 'jun': '06', 'jul': '07', 'ago': '08', 'aug': '08',
                        'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12', 'dec': '12'
                    };

                    if (monthStr) {
                        const month = months[monthStr.toLowerCase().substring(0, 3)];
                        result.date = `${year}-${month}-${day}`;
                    }
                }
            } catch (e) {
                console.warn("Date parsing error", e);
            }
        }

        // 4. Extract Potential Account Numbers and Match
        // Strategy: Look for sequences of digits (6+) and check if they match any known contact account
        // Nequi usually 10 digits (cellphone). Savings usually 10-14.

        // Flatten all contact accounts into a searchable map
        // Map<AccountNumber, ContactId>
        const accountMap = new Map<string, string>();
        contacts.forEach(c => {
            if (c.bankAccounts) {
                c.bankAccounts.forEach(acc => {
                    // Strip non-digits for comparison
                    const cleanNum = acc.accountNumber.replace(/[^0-9]/g, '');
                    if (cleanNum.length > 4) { // Min length to be safe
                        accountMap.set(cleanNum, c.id);
                    }
                });
            }
        });

        // Find matches in text
        // We iterate known accounts because OCR might have noise around the number
        // checking "Does text contain AccountX?" is safer than "Extract all numbers and check"
        for (const [accNum, contactId] of accountMap.entries()) {
            if (cleanText.replace(/[^0-9]/g, '').includes(accNum)) {
                result.accountNumber = accNum; // Found one!
                result.matchedContactId = contactId;
                break; // Stop at first match for now
            }
        }

        return result;
    },

    /**
     * Parse text to find Source Account (Business Identity) - e.g. "Producto Origen: *1234"
     */
    findSourceAccount: (text: string, businessIdentities: any[]): { businessIdentityId?: string, sourceAccountId?: string } => {
        const result: { businessIdentityId?: string, sourceAccountId?: string } = {};

        for (const identity of businessIdentities) {
            if (identity.bankAccounts) {
                for (const acc of identity.bankAccounts) {
                    const fullNum = acc.accountNumber.replace(/[^0-9]/g, '');
                    const last4 = fullNum.slice(-4);

                    if (fullNum.length > 4 && text.replace(/[^0-9]/g, '').includes(fullNum)) {
                        result.businessIdentityId = identity.id;
                        result.sourceAccountId = acc.id;
                        return result;
                    }

                    if (last4.length === 4 && text.includes(last4)) {
                        if (!result.sourceAccountId) {
                            result.businessIdentityId = identity.id;
                            result.sourceAccountId = acc.id;
                        }
                    }
                }
            }
        }

        return result;
    }
};
