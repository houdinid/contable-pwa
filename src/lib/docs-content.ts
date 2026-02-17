export const programmingDocs = `
# Documentación del Proyecto: Contable PWA

Esta sección contiene la documentación técnica del proyecto, incluyendo diagramas, análisis y detalles de implementación.

## 1. Visión General
**Contable PWA** es una aplicación web progresiva diseñada para la gestión contable de pequeñas y medianas empresas. Permite administrar contactos, inventario, compras, ventas y reportes financieros.

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Estilos**: Tailwind CSS 4
- **Persistencia**: LocalStorage (con arquitectura preparada para backend)
- **Estado Global**: React Context API
- **Iconos**: Lucide React
- **Gráficos**: Recharts

---

## 2. Arquitectura del Sistema

El proyecto sigue una arquitectura modular basada en características (Feature-based architecture) dentro de la carpeta \`src\`.

\`\`\`
src/
├── app/                    # Rutas y Layouts (Next.js App Router)
│   ├── (dashboard)/        # Rutas protegidas del panel principal
│   ├── (auth)/             # Rutas de autenticación
│   └── api/                # API Routes (si aplica)
├── components/             # Componentes reutilizables
│   ├── ui/                 # Componentes base (botones, inputs)
│   ├── forms/              # Formularios complejos
│   └── [feature]/          # Componentes específicos de una característica
├── context/                # Estados globales (Auth, Data)
├── lib/                    # Utilidades y funciones helper
└── types/                  # Definiciones de tipos TypeScript
\`\`\`

---

## 3. Diagrama de Flujo de Datos (Simplificado)

\`\`\`mermaid
graph TD
    User[Usuario] -->|Interacting| UI[Interfaz de Usuario]
    UI -->|Dispatch Actions| Context[Context API Providers]
    Context -->|Read/Write| Storage[LocalStorage / DB]
    Context -->|Updates| UI
\`\`\`

*Nota: El diagrama anterior es una representación simplificada del flujo unidireccional de datos.*

---

## 4. Módulos Principales

### 4.1. Contactos
Gestión de clientes y proveedores.
- **Entidades**: \`Contact\`
- **Funcionalidades**: Crear, Editar, Eliminar, Buscar, Importar.

### 4.2. Inventario
Control de productos y existencias.
- **Entidades**: \`Product\`, \`Category\`
- **Calculos**: Costo promedio, Valor total del inventario.

### 4.3. Transacciones (Compras y Ventas)
Registro de movimientos financieros.
- **Entidades**: \`Invoice\`, \`Transaction\`
- **Flujo**: Selección de contacto -> Selección de productos -> Cálculos de impuestos -> Guardado.

---

## 5. Próximos Pasos (Roadmap Técnico)
- [ ] Implementación de Backend real (Supabase / Firebase).
- [ ] Sincronización en tiempo real.
- [ ] Módulo de facturación electrónica.

`;
