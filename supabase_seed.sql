-- Semilla de Datos Iniciales (Seed Data)

-- 1. Categorías de Gastos (Expense Categories)
insert into expense_categories (id, name, color) values
('office', 'Oficina y Papelería', '#60a5fa'), -- Blue
('rent', 'Arriendo y Locales', '#f472b6'), -- Pink
('utilities', 'Servicios Públicos', '#fbbf24'), -- Amber
('payroll', 'Nómina y Salarios', '#4ade80'), -- Green
('marketing', 'Publicidad y Marketing', '#a78bfa'), -- Purple
('software', 'Software y Suscripciones', '#2dd4bf'), -- Teal
('maintenance', 'Mantenimiento y Reparaciones', '#f87171'), -- Red
('taxes', 'Impuestos y Legal', '#9ca3af'), -- Gray
('transport', 'Transporte y Viáticos', '#fb923c'), -- Orange
('inventory', 'Compra de Mercancía', '#818cf8'), -- Indigo
('other', 'Otros Gastos', '#94a3b8') -- Slate
on conflict (id) do nothing;

-- 2. Métodos de Pago (Payment Methods)
insert into payment_methods (id, name, type) values
(uuid_generate_v4(), 'Efectivo', 'cash'),
(uuid_generate_v4(), 'Bancolombia', 'bank'),
(uuid_generate_v4(), 'Nequi', 'other'),
(uuid_generate_v4(), 'DaviPlata', 'other'),
(uuid_generate_v4(), 'Tarjeta de Crédito', 'bank'),
(uuid_generate_v4(), 'Tarjeta de Débito', 'bank'),
(uuid_generate_v4(), 'Transferencia Bancaria', 'bank')
on conflict do nothing;

-- 3. Categorías de Proveedores (Supplier Categories)
insert into supplier_categories (id, name) values
(uuid_generate_v4(), 'Tecnología y Equipos'),
(uuid_generate_v4(), 'Servicios Profesionales'),
(uuid_generate_v4(), 'Suministros de Oficina'),
(uuid_generate_v4(), 'Mantenimiento'),
(uuid_generate_v4(), 'Mayoristas'),
(uuid_generate_v4(), 'Servicios Públicos')
on conflict do nothing;

-- 4. Identidad de Negocio por Defecto (Opcional - Placeholder)
-- Descomentar si se desea crear una empresa por defecto
/*
insert into business_identities (id, name, tax_id, is_default, is_tax_payer) values
(uuid_generate_v4(), 'Mi Empresa S.A.S', '900.000.000-1', true, true);
*/
