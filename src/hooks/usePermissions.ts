"use client";

import { useAuth, UserRole } from "@/context/auth-context";

// Definición estática de permisos base por Rol para el Fronend
// Esto acompaña al RLS de la base de datos para no mostrar botones que igual fallarían

type ActionType = "create" | "read" | "update" | "delete";

const rolePermissions: Record<UserRole, Record<string, boolean>> = {
    [UserRole.SUPER_ADMIN]: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true,
    },
    [UserRole.CONTADOR_PRINCIPAL]: {
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true, // Puede revertir transacciones
    },
    [UserRole.AUXILIAR_CONTABLE]: {
        canCreate: true,
        canRead: true,
        canUpdate: false, // Opcional, dependiendo de regla dura
        canDelete: false, // Cero permisos para borrar
    },
    [UserRole.AUDITOR]: {
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false,
    },
};

export function usePermissions() {
    const { user } = useAuth();
    const currentRole = user?.role || UserRole.AUDITOR; // Default más restrictivo

    const can = (action: ActionType): boolean => {
        switch (action) {
            case "create":
                return rolePermissions[currentRole]?.canCreate ?? false;
            case "read":
                return rolePermissions[currentRole]?.canRead ?? false;
            case "update":
                return rolePermissions[currentRole]?.canUpdate ?? false;
            case "delete":
                return rolePermissions[currentRole]?.canDelete ?? false;
            default:
                return false;
        }
    };

    return {
        canCreate: can("create"),
        canRead: can("read"),
        canUpdate: can("update"),
        canDelete: can("delete"),
    };
}
