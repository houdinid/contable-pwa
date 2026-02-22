-- ==========================================================
-- GESTIÓN DE INFRAESTRUCTURA Y SOPORTE
-- ==========================================================
-- Módulo 1: Acceso Remoto
create table if not exists remote_access (
    id uuid primary key default uuid_generate_v4(),
    client_id uuid references contacts(id) on delete cascade,
    software_type text not null,
    -- AnyDesk | RustDesk
    connection_code text not null,
    password text,
    -- Encriptada en frontend
    hostname text,
    created_at timestamptz default now()
);
-- Módulo 2: Licencias de Antivirus
create table if not exists antivirus_licenses (
    id uuid primary key default uuid_generate_v4(),
    supplier_id uuid references contacts(id) on delete cascade,
    license_name text not null,
    product_key text,
    start_date date,
    expiration_date date,
    device_limit integer default 1,
    created_at timestamptz default now()
);
-- Dispositivos Antivirus (Hija 1 a N)
create table if not exists antivirus_devices (
    id uuid primary key default uuid_generate_v4(),
    license_id uuid references antivirus_licenses(id) on delete cascade,
    hostname text not null,
    created_at timestamptz default now()
);
-- Módulo 3: Cuentas de Correo Corporativo
create table if not exists corporate_emails (
    id uuid primary key default uuid_generate_v4(),
    email_address text not null,
    password text,
    -- Encriptada en frontend
    assigned_to text,
    recovery_phone text,
    recovery_email text,
    client_id uuid references contacts(id) on delete cascade,
    -- To link to the company
    created_at timestamptz default now()
);
-- Módulo 4: Licencias de Software General
create table if not exists software_licenses (
    id uuid primary key default uuid_generate_v4(),
    software_type text not null,
    -- Windows, Office, AutoCAD, etc.
    product_key text,
    purchase_date date,
    assigned_to text,
    client_id uuid references contacts(id) on delete cascade,
    -- To link to the company
    created_at timestamptz default now()
);
-- ==========================================================
-- GESTIÓN ADMINISTRATIVA
-- ==========================================================
-- Módulo 5: Vencimientos de Impuestos
create table if not exists tax_deadlines (
    id uuid primary key default uuid_generate_v4(),
    business_name text not null,
    tax_id text not null,
    tax_type text not null,
    -- Renta, IVA, ICA, Cámara de Comercio, Retefuente
    expiration_date date not null,
    created_at timestamptz default now()
);
-- ==========================================================
-- POLÍTICAS RLS (Vía libre por ahora, igual que el resto)
-- ==========================================================
alter table remote_access enable row level security;
create policy "Allow all access" on remote_access for all using (true) with check (true);
alter table antivirus_licenses enable row level security;
create policy "Allow all access" on antivirus_licenses for all using (true) with check (true);
alter table antivirus_devices enable row level security;
create policy "Allow all access" on antivirus_devices for all using (true) with check (true);
alter table corporate_emails enable row level security;
create policy "Allow all access" on corporate_emails for all using (true) with check (true);
alter table software_licenses enable row level security;
create policy "Allow all access" on software_licenses for all using (true) with check (true);
alter table tax_deadlines enable row level security;
create policy "Allow all access" on tax_deadlines for all using (true) with check (true);