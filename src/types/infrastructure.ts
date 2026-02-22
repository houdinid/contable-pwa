// Types exclusively for Infrastructure Modules
export interface RemoteAccess {
    id: string;
    clientId: string; // Refers to Contact
    softwareType: string; // AnyDesk | RustDesk
    connectionCode: string;
    password?: string;
    hostname?: string;
    createdAt: string;

    // Additional relational data fetched
    clientName?: string;
}

export interface AntivirusDevice {
    id: string;
    licenseId: string;
    hostname: string;
    createdAt: string;
}

export interface AntivirusLicense {
    id: string;
    supplierId: string; // Refers to Contact
    licenseName: string;
    productKey?: string;
    startDate?: string;
    expirationDate?: string;
    deviceLimit: number;
    devices?: AntivirusDevice[]; // 1:N relations
    createdAt: string;

    // Extra computed
    supplierName?: string;
}

export interface CorporateEmail {
    id: string;
    emailAddress: string;
    password?: string;
    assignedTo?: string;
    recoveryPhone?: string;
    recoveryEmail?: string;
    clientId?: string; // Opt to link to a client
    createdAt: string;

    clientName?: string;
}

export interface SoftwareLicense {
    id: string;
    softwareType: string; // Windows, Office...
    productKey?: string;
    purchaseDate?: string;
    assignedTo?: string;
    clientId?: string; // Opt to link to a client
    createdAt: string;

    clientName?: string;
}

export interface TaxDeadline {
    id: string;
    businessName: string;
    taxId: string; // NIT
    taxType: string; // Renta, IVA, ICA, Cámara de Comercio, Retefuente
    expirationDate: string;
    createdAt: string;
}
