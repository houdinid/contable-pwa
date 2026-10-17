# Diagrama de Procesos y Arquitectura - Contable PWA

Este documento ilustra la estructura general y los flujos principales de la aplicación Contable PWA.

## Arquitectura General y Flujo de Interacción

El siguiente diagrama muestra cómo interactúa el usuario (Actor) con los diferentes módulos y cómo estos se conectan con el backend (Supabase).

```mermaid
flowchart TD
    %% Usuarios y Puntos de Acceso
    User((Usuario))
    
    %% Módulo de Autenticación
    subgraph Auth [Autenticación & Seguridad]
        Login[Inicio de Sesión]
        MFA[Autenticación 2FA/MFA]
        ForgotPWD[Recuperación de Clave]
        Login --> MFA
        ForgotPWD -.-> Login
    end
    
    User -->|1. Ingresa a la App| Auth

    %% Módulos Principales (Core)
    subgraph Core [Módulos Principales - Operación]
        direction TB
        Dash[Dashboard / KPIs]
        Inv[Inventario]
        Comp[Compras]
        Serv[Órdenes de Servicio]
        Cont[Contactos / Clientes]
        Ing[Ingresos / Facturación]
        Gast[Gastos]
        Tes[Tesorería]
        Rep[Reportes]
        Calc[Calculadora]
    end
    
    %% Módulos de Infraestructura
    subgraph IT [Infraestructura y Soporte]
        direction TB
        Wifi[Redes WiFi]
        CCTV[CCTV / Cámaras]
        Remoto[Acceso Remoto]
        AV[Antivirus]
        Correo[Cuentas de Correo]
        Lic[Licencias Software]
        Backup[Copias de Seguridad]
    end
    
    %% Módulos Administrativos
    subgraph Admin [Gestión Administrativa y Config.]
        direction TB
        Obligaciones[Obligaciones Fiscales]
        RBAC[Usuarios y Permisos]
        Settings[Configuración General]
    end

    %% Conexiones post-autenticación
    Auth -->|2. Acceso Exitoso| Dash
    Dash --> Core
    Dash --> IT
    Dash --> Admin

    %% Backend
    subgraph Backend [Backend Serverless: Supabase]
        direction LR
        DB[(PostgreSQL\nBase de Datos)]
        AuthService(Supabase Auth)
        Storage[Supabase Storage\nDocumentos/Recibos]
    end

    %% Interacciones de los módulos con el backend
    Auth -.-> AuthService
    Core =========================>|Lectura/Escritura| DB
    IT =========================>|Lectura/Escritura| DB
    Admin =========================>|Gestión| DB
    Core -.->|Sube Archivos| Storage
```

## Flujo de Proceso Operativo Típico

Este diagrama detalla un flujo de proceso estándar (ej. Compra a Inventario y Pago).

```mermaid
sequenceDiagram
    participant U as Usuario
    participant V as Compras/Gastos
    participant I as Inventario
    participant T as Tesorería
    participant B as Base de Datos (Supabase)

    U->>V: Registra nueva factura de Compra
    V->>B: Guarda registro de la compra
    V-->>I: Actualiza stock de productos
    I->>B: Guarda nuevo stock
    U->>T: Autoriza el pago de la compra
    T->>B: Registra movimiento de dinero (Gasto)
    B-->>U: Confirma operación completada exitosamente
```

## Módulos y Agrupación Lógica (Menú)

1. **Principal:**
   * Dashboard, Inventario, Compras, Órdenes de Servicio, Contactos, Ingresos, Gastos, Tesorería, Reportes, Calculadora, Usuarios, Configuración.
2. **Infraestructura y Soporte (IT):**
   * Redes WiFi, CCTV, Acceso Remoto, Antivirus, Correos, Licencias, Backups.
3. **Gestión Administrativa:**
   * Obligaciones (Vencimientos fiscales).
