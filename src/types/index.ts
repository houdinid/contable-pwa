export type ContactType = 'client' | 'supplier';

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountType: 'savings' | 'checking';
  notes?: string;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string; // Nombre del contacto en la empresa
  taxId?: string; // NIT/RUT/VAT
  type: ContactType;
  specialtyId?: string; // ID de la especialidad (solo para proveedores)
  defaultExpenseCategoryId?: string; // Categoría de gasto por defecto
  googleMapsUrl?: string; // Enlace a ubicación
  bankAccounts?: BankAccount[]; // Multiples cuentas bancarias
  creditBalance?: number; // Saldo a favor del cliente
  createdAt: string;
}

export interface SupplierCategory {
  id: string;
  name: string;
}

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}




export interface ExpenseCategoryItem {
  id: string;
  name: string;
  parentId?: string; // If present, it's a subcategory
  color?: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  categoryId: string; // References ExpenseCategoryItem.id
  supplierId?: string; // Optional link to supplier
  businessIdentityId?: string; // ID de la Razón Social receptora
  sourceAccountId?: string; // ID de la cuenta bancaria de origen (BusinessIdentity.bankAccounts)
  status: 'pending' | 'paid';
  receiptUrl?: string; // For future file upload
  createdAt: string;
}

export interface BusinessIdentity {
  id: string;
  name: string;      // Razón Social
  taxId: string;     // NIT
  address: string;
  phone?: string;
  email?: string;
  logoUrl?: string;  // Opcional por ahora
  city?: string;     // Ciudad
  isDefault: boolean;
  isTaxPayer?: boolean; // Responsable de IVA
  bankAccounts?: BankAccount[]; // Cuentas bancarias propias
}

// Update Invoice to reference an issuer
export interface Invoice {
  id: string;
  issuerId?: string; // ID de la Razón Social emisora
  number: string;
  date: string;
  dueDate?: string;
  creditDays?: number; // Días de crédito (opcional)
  contactId: string;
  contactName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  type: 'invoice' | 'quote';
  destinationAccountId?: string; // ID de la cuenta bancaria de destino (BusinessIdentity.bankAccounts)
  notes?: string;
  createdAt: string;
}


export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'check' | 'other' | 'crypto';
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  methodId: string;
  destinationAccountId?: string; // ID de la cuenta bancaria de destino (BusinessIdentity.bankAccounts)
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku?: string; // Código de barras o referencia
  description?: string;
  price: number; // Precio de venta
  cost: number; // Costo promedio
  stock: number;
  minStock?: number; // Alerta de stock bajo
  categoryId?: string;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string; // Snapshot
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string; // Snapshot
  date: string;
  number?: string; // Factura del proveedor
  items: PurchaseItem[];
  total: number;
  status: 'pending' | 'paid';
  businessIdentityId?: string; // ID de la Razón Social receptora
  receiptUrl?: string; // Foto del recibo/factura física
  notes?: string;
  createdAt: string;
}

export type WifiDeviceType = 'router' | 'access_point' | 'repeater' | 'switch' | 'other';

export interface WifiNetwork {
  id: string;
  // Network Info
  ssid: string;
  password?: string;
  encryption?: string; // e.g. WPA2, WPA3, Open
  isHidden?: boolean;

  // Device Info
  deviceType: WifiDeviceType;
  deviceBrand?: string;
  model?: string;

  // Location / Client Info
  clientId?: string; // Link to a Contact (Client)
  area?: string; // e.g. "Gerencia", "Recepción", "Piso 2"

  // IP Configuration
  ipAddress?: string;
  subnetMask?: string;
  gateway?: string;
  dns?: string;

  // Visuals
  photoUrl?: string; // Base64 or URL

  notes?: string;
  createdAt: string;
}

export type ServiceOrderStatus = 'pending' | 'in_progress' | 'completed' | 'billed' | 'cancelled';

export interface ServiceOrderItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
  productId?: string; // Optional link to inventory
}

export interface ServiceOrder {
  id: string;
  number: string; // e.g. OS-001
  clientId: string;
  clientName: string; // Snapshot
  clientEmail?: string;
  clientPhone?: string;

  date: string;
  estimatedDate?: string;

  status: ServiceOrderStatus;
  items: ServiceOrderItem[];

  subtotal: number;
  tax: number; // If applicable
  total: number;

  notes?: string;
  technicianNotes?: string; // Internal notes

  invoiceId?: string; // If converted to invoice

  businessIdentityId?: string; // Issuer

  createdAt: string;
  updatedAt: string;
}
