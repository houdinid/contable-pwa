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
  type text not null,
  -- 'client' | 'supplier'
  specialty_id text,
  default_expense_category_id text,
  google_maps_url text,
  website text,
  bank_accounts jsonb,
  -- Storing array of objects as JSONB for simplicity
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
create table if not exists supplier_categories (id uuid primary key, name text not null);
-- Expense Categories
create table if not exists expense_categories (
  id text primary key,
  -- IDs like 'office', 'transport' are used in code, so text is fine
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
  category_id text not null,
  -- references expense_categories(id)
  supplier_id uuid references contacts(id),
  business_identity_id uuid references business_identities(id),
  source_account_id text,
  status text not null,
  -- 'pending' | 'paid'
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
  supplier_name text,
  -- version stored at time of purchase
  date timestamptz not null,
  number text,
  total numeric not null,
  status text not null,
  -- 'pending' | 'paid'
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
  status text not null,
  -- 'draft' | 'pending' | 'paid' | 'cancelled'
  type text not null,
  -- 'invoice' | 'quote'
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
  status text not null,
  -- 'pending' | 'in_progress' | 'completed' | 'billed' | 'cancelled'
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
-- CCTV Systems
create table if not exists cctv_systems (
  id uuid primary key,
  client_id uuid references contacts(id),
  branch text,
  brand text,
  model text,
  serial_number text,
  channels numeric,
  technology text,
  disk_capacity text,
  ip_address text,
  http_port text,
  rtsp_port text,
  email text,
  qr_code_url text,
  -- Storage path
  photo_url text,
  -- Storage path
  observations text,
  created_at timestamptz default now()
);
-- CCTV Users (Credenciales del sistema CCTV)
create table if not exists cctv_users (
  id uuid primary key,
  cctv_system_id uuid references cctv_systems(id) on delete cascade,
  username text not null,
  password text not null,
  is_admin boolean default false
);
alter table cctv_systems enable row level security;
create policy "Allow all access" on cctv_systems for all using (true) with check (true);
alter table cctv_users enable row level security;
create policy "Allow all access" on cctv_users for all using (true) with check (true);- -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   G E S T I √  N   D E   I N F R A E S T R U C T U R A   Y   S O P O R T E  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   M √ ≥ d u l o   1 :   A c c e s o   R e m o t o  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   r e m o t e _ a c c e s s   (  
         i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
         c l i e n t _ i d   u u i d   r e f e r e n c e s   c o n t a c t s ( i d )   o n   d e l e t e   c a s c a d e ,  
         s o f t w a r e _ t y p e   t e x t   n o t   n u l l ,  
         - -   A n y D e s k   |   R u s t D e s k  
         c o n n e c t i o n _ c o d e   t e x t   n o t   n u l l ,  
         p a s s w o r d   t e x t ,  
         - -   E n c r i p t a d a   e n   f r o n t e n d  
         h o s t n a m e   t e x t ,  
         c r e a t e d _ a t   t i m e s t a m p t z   d e f a u l t   n o w ( )  
 ) ;  
 - -   M √ ≥ d u l o   2 :   L i c e n c i a s   d e   A n t i v i r u s  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   a n t i v i r u s _ l i c e n s e s   (  
         i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
         s u p p l i e r _ i d   u u i d   r e f e r e n c e s   c o n t a c t s ( i d )   o n   d e l e t e   c a s c a d e ,  
         l i c e n s e _ n a m e   t e x t   n o t   n u l l ,  
         p r o d u c t _ k e y   t e x t ,  
         s t a r t _ d a t e   d a t e ,  
         e x p i r a t i o n _ d a t e   d a t e ,  
         d e v i c e _ l i m i t   i n t e g e r   d e f a u l t   1 ,  
         c r e a t e d _ a t   t i m e s t a m p t z   d e f a u l t   n o w ( )  
 ) ;  
 - -   D i s p o s i t i v o s   A n t i v i r u s   ( H i j a   1   a   N )  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   a n t i v i r u s _ d e v i c e s   (  
         i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
         l i c e n s e _ i d   u u i d   r e f e r e n c e s   a n t i v i r u s _ l i c e n s e s ( i d )   o n   d e l e t e   c a s c a d e ,  
         h o s t n a m e   t e x t   n o t   n u l l ,  
         c r e a t e d _ a t   t i m e s t a m p t z   d e f a u l t   n o w ( )  
 ) ;  
 - -   M √ ≥ d u l o   3 :   C u e n t a s   d e   C o r r e o   C o r p o r a t i v o  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   c o r p o r a t e _ e m a i l s   (  
         i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
         e m a i l _ a d d r e s s   t e x t   n o t   n u l l ,  
         p a s s w o r d   t e x t ,  
         - -   E n c r i p t a d a   e n   f r o n t e n d  
         a s s i g n e d _ t o   t e x t ,  
         r e c o v e r y _ p h o n e   t e x t ,  
         r e c o v e r y _ e m a i l   t e x t ,  
         c l i e n t _ i d   u u i d   r e f e r e n c e s   c o n t a c t s ( i d )   o n   d e l e t e   c a s c a d e ,  
         - -   T o   l i n k   t o   t h e   c o m p a n y  
         c r e a t e d _ a t   t i m e s t a m p t z   d e f a u l t   n o w ( )  
 ) ;  
 - -   M √ ≥ d u l o   4 :   L i c e n c i a s   d e   S o f t w a r e   G e n e r a l  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   s o f t w a r e _ l i c e n s e s   (  
         i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
         s o f t w a r e _ t y p e   t e x t   n o t   n u l l ,  
         - -   W i n d o w s ,   O f f i c e ,   A u t o C A D ,   e t c .  
         p r o d u c t _ k e y   t e x t ,  
         p u r c h a s e _ d a t e   d a t e ,  
         a s s i g n e d _ t o   t e x t ,  
         c l i e n t _ i d   u u i d   r e f e r e n c e s   c o n t a c t s ( i d )   o n   d e l e t e   c a s c a d e ,  
         - -   T o   l i n k   t o   t h e   c o m p a n y  
         c r e a t e d _ a t   t i m e s t a m p t z   d e f a u l t   n o w ( )  
 ) ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   G E S T I √  N   A D M I N I S T R A T I V A  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   M √ ≥ d u l o   5 :   V e n c i m i e n t o s   d e   I m p u e s t o s  
 c r e a t e   t a b l e   i f   n o t   e x i s t s   t a x _ d e a d l i n e s   (  
         i d   u u i d   p r i m a r y   k e y   d e f a u l t   u u i d _ g e n e r a t e _ v 4 ( ) ,  
         b u s i n e s s _ n a m e   t e x t   n o t   n u l l ,  
         t a x _ i d   t e x t   n o t   n u l l ,  
         t a x _ t y p e   t e x t   n o t   n u l l ,  
         - -   R e n t a ,   I V A ,   I C A ,   C √ ° m a r a   d e   C o m e r c i o ,   R e t e f u e n t e  
         e x p i r a t i o n _ d a t e   d a t e   n o t   n u l l ,  
         c r e a t e d _ a t   t i m e s t a m p t z   d e f a u l t   n o w ( )  
 ) ;  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 - -   P O L √ ç T I C A S   R L S   ( V √ ≠ a   l i b r e   p o r   a h o r a ,   i g u a l   q u e   e l   r e s t o )  
 - -   = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = = =  
 a l t e r   t a b l e   r e m o t e _ a c c e s s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " A l l o w   a l l   a c c e s s "   o n   r e m o t e _ a c c e s s   f o r   a l l   u s i n g   ( t r u e )   w i t h   c h e c k   ( t r u e ) ;  
 a l t e r   t a b l e   a n t i v i r u s _ l i c e n s e s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " A l l o w   a l l   a c c e s s "   o n   a n t i v i r u s _ l i c e n s e s   f o r   a l l   u s i n g   ( t r u e )   w i t h   c h e c k   ( t r u e ) ;  
 a l t e r   t a b l e   a n t i v i r u s _ d e v i c e s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " A l l o w   a l l   a c c e s s "   o n   a n t i v i r u s _ d e v i c e s   f o r   a l l   u s i n g   ( t r u e )   w i t h   c h e c k   ( t r u e ) ;  
 a l t e r   t a b l e   c o r p o r a t e _ e m a i l s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " A l l o w   a l l   a c c e s s "   o n   c o r p o r a t e _ e m a i l s   f o r   a l l   u s i n g   ( t r u e )   w i t h   c h e c k   ( t r u e ) ;  
 a l t e r   t a b l e   s o f t w a r e _ l i c e n s e s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " A l l o w   a l l   a c c e s s "   o n   s o f t w a r e _ l i c e n s e s   f o r   a l l   u s i n g   ( t r u e )   w i t h   c h e c k   ( t r u e ) ;  
 a l t e r   t a b l e   t a x _ d e a d l i n e s   e n a b l e   r o w   l e v e l   s e c u r i t y ;  
 c r e a t e   p o l i c y   " A l l o w   a l l   a c c e s s "   o n   t a x _ d e a d l i n e s   f o r   a l l   u s i n g   ( t r u e )   w i t h   c h e c k   ( t r u e ) ;  
 