# Flujo de Trabajo y Respaldo del Proyecto

Este documento explica cómo funciona tu aplicación **Contable PWA**, dónde se guardan los datos y cómo modificarlos o respaldarlos de manera segura.

## 1. ¿Dónde se guardan mis datos?

Actualmente, tienes una arquitectura en la nube (Cloud Architecture):

*   **Aplicación (Código Frontend):** Está alojada en **Vercel**. Cuando entras a la web, Vercel sirve la aplicación.
*   **Base de Datos (Backend):** Está alojada en **Supabase**. Todos tus clientes, facturas y gastos se guardan en los servidores seguros de Supabase, **NO** en tu computador ni en el celular.
    *   Esto significa que si cambias de celular o formateas tu PC, **tus datos siguen seguros en la nube**. Solo necesitas iniciar sesión de nuevo.

## 2. Cómo hacer cambios en la aplicación (Desarrollo)

Para modificar la aplicación (agregar un botón, cambiar un color, crear un módulo nuevo), el flujo es el siguiente:

1.  **Edición Local:** Realizas los cambios en los archivos de tu carpeta `c:\contable-pwa` en tu PC.
2.  **Prueba Local:**
    *   Abre una terminal en la carpeta del proyecto.
    *   Ejecuta `npm run dev`.
    *   Abre `http://localhost:3000` en tu navegador para ver los cambios antes de subirlos.
3.  **Despliegue (Deploy) a Producción:**
    *   Una vez estés satisfecho con los cambios, súbelos a GitHub usando Git:
        ```bash
        git add .
        git commit -m "Descripción de mis cambios"
        git push origin main
        ```
    *   **Automáticamente**, Vercel detectará el nuevo código, construirá la aplicación y actualizará la versión en la web (`https://contable-pwa.vercel.app`) en unos minutos.

## 3. Cómo hacer copias de seguridad (Backups)

### A. Copia de Seguridad del Código (La Aplicación)
Tu código fuente tiene **doble respaldo**:
1.  **Local:** En tu carpeta `c:\contable-pwa`.
2.  **Remoto:** En tu repositorio de **GitHub**. Siempre que hagas `git push`, GitHub tendrá la copia más reciente.
    *   *Si tu PC se daña*, simplemente descargas el código de GitHub en uno nuevo.

### B. Copia de Seguridad de los Datos (La Base de Datos)
Tus datos están en **Supabase**. Tienes dos formas de respaldarlos:

**Opción 1: Automática (Recomendada)**
*   Supabase realiza copias de seguridad automáticas diarias (dependiendo del plan).

**Opción 2: Manual (Exportar)**
1.  Entra a tu panel de control en [supabase.com](https://supabase.com/dashboard).
2.  Ve a tu proyecto.
3.  Ve a **Database** -> **Backups**.
4.  O más fácil: Ve al **Table Editor**, selecciona una tabla (ej. `expenses`) y haz clic en "Export to CSV" para bajar un archivo Excel/CSV con tus datos.

### C. Copia de Seguridad de la Estructura (Esquema SQL)
El archivo `supabase_schema.sql` en tu carpeta del proyecto contiene la estructura de tu base de datos (tablas, columnas).
*   **Importante:** Si agregas una nueva tabla en Supabase, recuerda actualizar este archivo localmente para tener un registro de cómo está hecha tu base de datos.
