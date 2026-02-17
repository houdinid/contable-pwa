-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Contacts
create table if not exists contacts (
  id uuid primary key,
  name text not null,
  email text,
  phone text,
  address text,
  contact_person text,
  tax_id text,
  type text not null, -- 'client' | 'supplier'
  specialty_id text,
  default_expense_category_id text,
  google_maps_url text,
  bank_accounts jsonb, -- Storing array of objects as JSONB for simplicity
  credit_balance numeric default 0,
  created_at timestamptz default now()
);

-- Business Identities (Razones Sociales)
create table if not exists business_identities (
  id uuid primary key,
  name text not null,
  tax_id text not null,
  address text,
  phone text,
  email text,
  logo_url text,
  city text,
  is_default boolean default false,
  is_tax_payer boolean,
  bank_accounts jsonb
);

-- Supplier Categories
create table if not exists supplier_categories (
  id uuid primary key,
  name text not null
);

-- Expense Categories
create table if not exists expense_categories (
  id text primary key, -- IDs like 'office', 'transport' are used in code, so text is fine
  name text not null,
  parent_id text,
  color text
);

-- Expenses
create table if not exists expenses (
  id uuid primary key,
  description text not null,
  amount numeric not null,
  date timestamptz not null,
  category_id text not null, -- references expense_categories(id)
  supplier_id uuid references contacts(id),
  business_identity_id uuid references business_identities(id),
  source_account_id text,
  status text not null, -- 'pending' | 'paid'
  receipt_url text,
  created_at timestamptz default now()
);

-- Products (Inventory)
create table if not exists products (
  id uuid primary key,
  name text not null,
  sku text,
  description text,
  price numeric not null,
  cost numeric not null,
  stock numeric not null,
  min_stock numeric,
  category_id text,
  created_at timestamptz default now()
);

-- Purchases
create table if not exists purchases (
  id uuid primary key,
  supplier_id uuid references contacts(id),
  supplier_name text, -- version stored at time of purchase
  date timestamptz not null,
  number text,
  total numeric not null,
  status text not null, -- 'pending' | 'paid'
  business_identity_id uuid references business_identities(id),
  receipt_url text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists purchase_items (
  id uuid default uuid_generate_v4() primary key,
  purchase_id uuid references purchases(id) on delete cascade,
  product_id uuid references products(id),
  product_name text,
  quantity numeric not null,
  unit_cost numeric not null,
  total numeric not null
);

-- Invoices
create table if not exists invoices (
  id uuid primary key,
  issuer_id uuid references business_identities(id),
  number text not null,
  date timestamptz not null,
  due_date timestamptz,
  credit_days numeric,
  contact_id uuid references contacts(id),
  contact_name text,
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  status text not null, -- 'draft' | 'pending' | 'paid' | 'cancelled'
  type text not null, -- 'invoice' | 'quote'
  destination_account_id text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists invoice_items (
  id uuid default uuid_generate_v4() primary key,
  invoice_id uuid references invoices(id) on delete cascade,
  description text not null,
  quantity numeric not null,
  price numeric not null,
  total numeric not null
);

-- Payment Methods
create table if not exists payment_methods (
  id uuid primary key,
  name text not null,
  type text not null -- 'cash' | 'bank' | 'check' | 'other' | 'crypto'
);

-- Payments
create table if not exists payments (
  id uuid primary key,
  invoice_id uuid references invoices(id),
  amount numeric not null,
  date timestamptz not null,
  method_id uuid references payment_methods(id),
  destination_account_id text,
  reference text,
  notes text,
  created_at timestamptz default now()
);

-- WiFi Networks
create table if not exists wifi_networks (
  id uuid primary key,
  ssid text not null,
  password text,
  encryption text,
  is_hidden boolean,
  device_type text not null,
  device_brand text,
  model text,
  client_id uuid references contacts(id),
  area text,
  ip_address text,
  subnet_mask text,
  gateway text,
  dns text,
  photo_url text,
  notes text,
  created_at timestamptz default now()
);

-- Service Orders
create table if not exists service_orders (
  id uuid primary key,
  number text not null,
  client_id uuid references contacts(id),
  client_name text,
  client_email text,
  client_phone text,
  date timestamptz not null,
  estimated_date timestamptz,
  status text not null, -- 'pending' | 'in_progress' | 'completed' | 'billed' | 'cancelled'
  subtotal numeric not null,
  tax numeric default 0,
  total numeric not null,
  notes text,
  technician_notes text,
  invoice_id uuid references invoices(id),
  business_identity_id uuid references business_identities(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists service_order_items (
  id uuid default uuid_generate_v4() primary key,
  service_order_id uuid references service_orders(id) on delete cascade,
  description text not null,
  quantity numeric not null,
  price numeric not null,
  total numeric not null,
  product_id uuid references products(id)
);

-- Enable Row Level Security (RLS) on all tables (Best Practice)
-- For now, we create a policy to allow all access since there is no user authentication system yet
-- In a real production app with login, these would be restricted to auth.uid()

alter table contacts enable row level security;
create policy "Allow all access" on contacts for all using (true) with check (true);

alter table business_identities enable row level security;
create policy "Allow all access" on business_identities for all using (true) with check (true);

alter table supplier_categories enable row level security;
create policy "Allow all access" on supplier_categories for all using (true) with check (true);

alter table expense_categories enable row level security;
create policy "Allow all access" on expense_categories for all using (true) with check (true);

alter table expenses enable row level security;
create policy "Allow all access" on expenses for all using (true) with check (true);

alter table products enable row level security;
create policy "Allow all access" on products for all using (true) with check (true);

alter table purchases enable row level security;
create policy "Allow all access" on purchases for all using (true) with check (true);

alter table purchase_items enable row level security;
create policy "Allow all access" on purchase_items for all using (true) with check (true);

alter table invoices enable row level security;
create policy "Allow all access" on invoices for all using (true) with check (true);

alter table invoice_items enable row level security;
create policy "Allow all access" on invoice_items for all using (true) with check (true);

alter table payment_methods enable row level security;
create policy "Allow all access" on payment_methods for all using (true) with check (true);

alter table payments enable row level security;
create policy "Allow all access" on payments for all using (true) with check (true);

alter table wifi_networks enable row level security;
create policy "Allow all access" on wifi_networks for all using (true) with check (true);

alter table service_orders enable row level security;
create policy "Allow all access" on service_orders for all using (true) with check (true);

alter table service_order_items enable row level security;
create policy "Allow all access" on service_order_items for all using (true) with check (true);
