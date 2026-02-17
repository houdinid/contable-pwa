export interface ParsedInvoice {
    supplierName: string;
    supplierTaxId: string; // NIT
    supplierAddress?: string;
    supplierPhone?: string;
    supplierEmail?: string;
    customerName?: string;
    customerTaxId?: string; // NIT del Adquirente
    date: string;
    total: number;
    number: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];
}

export function parseDianXml(xmlContent: string): ParsedInvoice | null {
    try {
        const parser = new DOMParser();
        let xmlDoc = parser.parseFromString(xmlContent, "text/xml");

        // Helper to find a node ignoring namespace prefix
        const findNode = (parent: Element | Document, localName: string): Element | null => {
            // 1. Try exact match (fastest)
            let node = parent.getElementsByTagName(localName)[0];
            if (node) return node;

            // 2. Try with common prefixes
            const prefixes = ["cac:", "cbc:", "ext:", "sts:", "fe:"];
            for (const prefix of prefixes) {
                node = parent.getElementsByTagName(prefix + localName)[0];
                if (node) return node;
            }

            // 3. Fallback: Iterate all elements (slowest but most robust)
            const allElements = parent.getElementsByTagName("*");
            for (let i = 0; i < allElements.length; i++) {
                if (allElements[i].localName === localName || allElements[i].tagName.endsWith(":" + localName)) {
                    return allElements[i];
                }
            }
            return null;
        };

        // Helper to find ALL nodes ignoring namespace prefix
        const findNodes = (parent: Element | Document, localName: string): Element[] => {
            const result: Element[] = [];
            const allElements = parent.getElementsByTagName("*");
            for (let i = 0; i < allElements.length; i++) {
                if (allElements[i].localName === localName || allElements[i].tagName.endsWith(":" + localName)) {
                    result.push(allElements[i]);
                }
            }
            return result;
        };

        const getText = (localName: string, parent: Element | Document = xmlDoc): string => {
            const node = findNode(parent, localName);
            return node ? node.textContent || "" : "";
        };

        // --- Handle AttachedDocument Container (DIAN ZIP structure) ---
        const rootNode = xmlDoc.documentElement;
        if (rootNode.localName === "AttachedDocument" || rootNode.tagName.endsWith(":AttachedDocument")) {
            console.log("Detected AttachedDocument container. Attempting to extract inner Invoice...");
            const attachment = findNode(xmlDoc, "Attachment");
            if (attachment) {
                const externalRef = findNode(attachment, "ExternalReference");
                if (externalRef) {
                    const description = findNode(externalRef, "Description");
                    if (description && description.textContent) {
                        const innerXml = description.textContent.trim();
                        if (innerXml.startsWith("<") && innerXml.endsWith(">")) {
                            return parseDianXml(innerXml);
                        }
                    }
                }
            }
        }
        // -----------------------------------------------------------

        // Supplier Info
        const supplierParty = findNode(xmlDoc, "AccountingSupplierParty");

        if (!supplierParty) {
            console.warn("XML Structure:", new XMLSerializer().serializeToString(xmlDoc).substring(0, 500) + "...");
            throw new Error("No valid Invoice found in XML (missing AccountingSupplierParty).");
        }

        let supplierTaxId = "";
        let supplierName = "";
        let supplierAddress = "";
        let supplierPhone = "";
        let supplierEmail = "";

        const party = findNode(supplierParty, "Party"); // Often nested inside AccountingSupplierParty

        // 1. Identification (TaxId / Name)
        const partyTaxScheme = findNode(supplierParty, "PartyTaxScheme");
        if (partyTaxScheme) {
            const companyId = findNode(partyTaxScheme, "CompanyID");
            if (companyId) supplierTaxId = companyId.textContent || "";

            const registrationName = findNode(partyTaxScheme, "RegistrationName");
            if (registrationName) supplierName = registrationName.textContent || "";
        }

        if (!supplierName) {
            const partyLegalEntity = findNode(supplierParty, "PartyLegalEntity");
            if (partyLegalEntity) {
                const regName = findNode(partyLegalEntity, "RegistrationName");
                if (regName) supplierName = regName.textContent || "";
            }
        }

        if (!supplierName && party) {
            // Fallback: PartyName -> Name
            const partyName = findNode(party, "PartyName");
            if (partyName) {
                const name = findNode(partyName, "Name");
                if (name) supplierName = name.textContent || "";
            }
        }

        // 2. Contact Info (Phone / Email)
        if (party) {
            const contact = findNode(party, "Contact");
            if (contact) {
                const telephone = findNode(contact, "Telephone");
                if (telephone) supplierPhone = telephone.textContent || "";

                const electronicMail = findNode(contact, "ElectronicMail");
                if (electronicMail) supplierEmail = electronicMail.textContent || "";
            }

            // 3. Address
            // PhysicalLocation -> Address -> CityName, CountrySubentity, AddressLine
            const physicalLocation = findNode(party, "PhysicalLocation");
            const addressRoot = physicalLocation ? findNode(physicalLocation, "Address") : findNode(party, "PostalAddress"); // Sometimes directly in PostalAddress

            if (addressRoot) {
                const cityName = findNode(addressRoot, "CityName")?.textContent || "";
                const countrySubentity = findNode(addressRoot, "CountrySubentity")?.textContent || ""; // Department
                const addressLine = findNode(addressRoot, "AddressLine");
                const line = addressLine ? findNode(addressLine, "Line")?.textContent || "" : "";

                supplierAddress = [line, cityName, countrySubentity].filter(Boolean).join(", ");
            }
        }

        // --- Customer Info (Receiver) ---
        let customerTaxId = "";
        let customerName = "";
        const customerParty = findNode(xmlDoc, "AccountingCustomerParty");
        if (customerParty) {
            // 1. Try Tax Scheme (Most common)
            const customerTaxScheme = findNode(customerParty, "PartyTaxScheme");
            if (customerTaxScheme) {
                const companyId = findNode(customerTaxScheme, "CompanyID");
                if (companyId) customerTaxId = companyId.textContent || "";

                const registrationName = findNode(customerTaxScheme, "RegistrationName");
                if (registrationName) customerName = registrationName.textContent || "";
            }

            // 2. Try PartyIdentification (Fallback for ID)
            if (!customerTaxId) {
                const partyIdentification = findNode(customerParty, "PartyIdentification");
                if (partyIdentification) {
                    const idNode = findNode(partyIdentification, "ID");
                    if (idNode) customerTaxId = idNode.textContent || "";
                }
            }

            // 3. Try Legal Entity (Fallback for Name)
            if (!customerName) {
                const customerLegalEntity = findNode(customerParty, "PartyLegalEntity");
                if (customerLegalEntity) {
                    const regName = findNode(customerLegalEntity, "RegistrationName");
                    if (regName) customerName = regName.textContent || "";
                }
            }

            // 4. Try PartyName (Fallback for Name)
            if (!customerName) {
                const partyName = findNode(customerParty, "PartyName");
                if (partyName) {
                    const name = findNode(partyName, "Name");
                    if (name) customerName = name.textContent || "";
                }
            }
        }


        // Invoice Info
        const number = getText("ID", xmlDoc) || "";
        const date = getText("IssueDate", xmlDoc) || new Date().toISOString().split('T')[0];

        // Totals
        const legalMonetaryTotal = findNode(xmlDoc, "LegalMonetaryTotal");
        let total = 0;
        if (legalMonetaryTotal) {
            const payableAmount = findNode(legalMonetaryTotal, "PayableAmount");
            if (payableAmount) total = parseFloat(payableAmount.textContent || "0");
        }

        // Items
        const invoiceLines = findNodes(xmlDoc, "InvoiceLine");
        const items = [];

        for (const line of invoiceLines) {
            const itemNode = findNode(line, "Item");
            let description = "Item";
            if (itemNode) {
                const descNode = findNode(itemNode, "Description");
                if (descNode) description = descNode.textContent || "";
            }

            const qtyNode = findNode(line, "InvoicedQuantity");
            const quantity = qtyNode ? parseFloat(qtyNode.textContent || "1") : 1;

            const priceNode = findNode(line, "Price");
            let unitPrice = 0;
            if (priceNode) {
                const amountNode = findNode(priceNode, "PriceAmount");
                if (amountNode) unitPrice = parseFloat(amountNode.textContent || "0");
            }

            const lineTotalNode = findNode(line, "LineExtensionAmount");
            const lineTotal = lineTotalNode ? parseFloat(lineTotalNode.textContent || "0") : quantity * unitPrice;

            items.push({
                description,
                quantity,
                unitPrice,
                total: lineTotal
            });
        }

        return {
            supplierName,
            supplierTaxId,
            supplierAddress,
            supplierPhone,
            supplierEmail,
            customerName,
            customerTaxId,
            date,
            number,
            total,
            items
        };

    } catch (e) {
        console.error("XML Parsing Error", e);
        // Rethrow to show alert in UI with details
        throw e;
    }
}
