"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CCTVForm } from '@/components/cctv/cctv-form';
import { supabase } from '@/lib/supabase';
import type { CctvSystem, CctvUser } from '@/types/cctv';

export default function EditCCTVPage() {
    const params = useParams();
    const id = params.id as string;
    const [system, setSystem] = useState<CctvSystem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadSystem() {
            if (!id) return;

            // Load System
            const { data: systemData, error: sysError } = await supabase
                .from('cctv_systems')
                .select('*')
                .eq('id', id)
                .single();

            if (sysError) {
                console.error("Error loading system:", sysError);
                setLoading(false);
                return;
            }

            // Load Users
            const { data: usersData, error: usersError } = await supabase
                .from('cctv_users')
                .select('*')
                .eq('cctv_system_id', id);

            if (usersError) {
                console.error("Error loading users:", usersError);
            }

            setSystem({
                ...systemData,
                users: usersData || []
            });
            setLoading(false);
        }

        loadSystem();
    }, [id]);

    if (loading) return <div>Cargando...</div>;
    if (!system) return <div>Sistema no encontrado</div>;

    return (
        <div>
            <CCTVForm initialData={system} isEditing={true} />
        </div>
    );
}
