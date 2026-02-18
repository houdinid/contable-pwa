"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useData } from "@/context/data-context"; // Assuming contacts are here? Actually need to check data-context
import { Plus, Trash2, Save, Upload, X, ArrowLeft } from "lucide-react";
import type { Contact } from "@/types";
import type { CctvFormData, CctvSystem, CctvUser } from "@/types/cctv";

// Helper to upload file
async function uploadFile(file: File): Promise<string | null> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('cctv-images')
            .upload(filePath, file);

        if (uploadError) {
            console.error('Error uploading:', uploadError);
            return null;
        }

        const { data } = supabase.storage.from('cctv-images').getPublicUrl(filePath);
        return data.publicUrl;
    } catch (error) {
        console.error('Upload exception:', error);
        return null;
    }
}

interface CCTVFormProps {
    initialData?: CctvSystem;
    isEditing?: boolean;
}

export function CCTVForm({ initialData, isEditing = false }: CCTVFormProps) {
    const router = useRouter();
    // Fetch clients directly or use context
    const [clients, setClients] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<CctvFormData>({
        client_id: initialData?.client_id || "",
        branch: initialData?.branch || "",
        brand: initialData?.brand || "",
        model: initialData?.model || "",
        serial_number: initialData?.serial_number || "",
        channels: initialData?.channels || 4,
        technology: initialData?.technology || "IP",
        disk_capacity: initialData?.disk_capacity || "",
        ip_address: initialData?.ip_address || "",
        http_port: initialData?.http_port || "",
        rtsp_port: initialData?.rtsp_port || "",
        email: initialData?.email || "",
        observations: initialData?.observations || "",
        users: initialData?.users?.map(u => ({
            username: u.username,
            password: u.password || "", // Password might be missing if not returned by API for security, but we handle it
            is_admin: u.is_admin || false
        })) || [{ username: "", password: "", is_admin: false }]
    });

    const [files, setFiles] = useState<{ qr?: File | null, photo?: File | null }>({});
    const [previews, setPreviews] = useState<{ qr?: string, photo?: string }>({
        qr: initialData?.qr_code_url,
        photo: initialData?.photo_url
    });

    useEffect(() => {
        // Load clients
        async function loadClients() {
            const { data } = await supabase
                .from('contacts')
                .select('*')
                .eq('type', 'client') // Assuming 'client' type
                .order('name');
            if (data) setClients(data);
        }
        loadClients();
    }, []);

    const handleChange = (field: keyof CctvFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleUserChange = (index: number, field: string, value: any) => {
        const newUsers = [...formData.users];
        newUsers[index] = { ...newUsers[index], [field]: value };
        setFormData(prev => ({ ...prev, users: newUsers }));
    };

    const addUser = () => {
        setFormData(prev => ({
            ...prev,
            users: [...prev.users, { username: "", password: "", is_admin: false }]
        }));
    };

    const removeUser = (index: number) => {
        const newUsers = formData.users.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, users: newUsers }));
    };

    const handleFileChange = (type: 'qr' | 'photo', e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setFiles(prev => ({ ...prev, [type]: file }));
            setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Upload files first
            let qrUrl = initialData?.qr_code_url;
            let photoUrl = initialData?.photo_url;

            if (files.qr) {
                const url = await uploadFile(files.qr);
                if (url) qrUrl = url;
            }

            if (files.photo) {
                const url = await uploadFile(files.photo);
                if (url) photoUrl = url;
            }

            // Save System
            const systemData = {
                client_id: formData.client_id,
                branch: formData.branch,
                brand: formData.brand,
                model: formData.model,
                serial_number: formData.serial_number,
                channels: formData.channels,
                technology: formData.technology,
                disk_capacity: formData.disk_capacity,
                ip_address: formData.ip_address,
                http_port: formData.http_port,
                rtsp_port: formData.rtsp_port,
                email: formData.email,
                observations: formData.observations,
                qr_code_url: qrUrl,
                photo_url: photoUrl
            };

            let systemId = initialData?.id;

            if (isEditing && systemId) {
                await supabase.from('cctv_systems').update(systemData).eq('id', systemId);
                // For users, simple approach: delete all and recreate (easiest for now)
                await supabase.from('cctv_users').delete().eq('cctv_system_id', systemId);
            } else {
                // Generate ID client-side since DB doesn't have default
                systemId = crypto.randomUUID();
                const { error } = await supabase.from('cctv_systems').insert({
                    id: systemId,
                    ...systemData
                });
                if (error) throw error;
            }

            // Save Users
            if (formData.users.length > 0) {
                const usersToSave = formData.users
                    .filter(u => u.username) // Only save if username exists
                    .map(u => ({
                        id: crypto.randomUUID(),
                        cctv_system_id: systemId,
                        username: u.username,
                        password: u.password,
                        is_admin: u.is_admin
                    }));

                if (usersToSave.length > 0) {
                    await supabase.from('cctv_users').insert(usersToSave);
                }
            }

            router.push('/dashboard/cctv');
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Error al guardar");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-6">
                <button type="button" onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft />
                </button>
                <h1 className="text-2xl font-bold">{isEditing ? "Editar Sistema CCTV" : "Nuevo Sistema CCTV"}</h1>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Datos del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Cliente</label>
                        <select
                            required
                            className="w-full border rounded-lg p-2"
                            value={formData.client_id}
                            onChange={e => handleChange('client_id', e.target.value)}
                        >
                            <option value="">Seleccionar Cliente</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Sede / Ubicación</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg p-2"
                            value={formData.branch}
                            onChange={e => handleChange('branch', e.target.value)}
                            placeholder="Ej. Oficina Principal"
                        />
                    </div>
                </div>
            </div>

            {/* Datos Técnicos */}
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Especificaciones Técnicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Marca</label>
                        <input
                            className="w-full border rounded-lg p-2"
                            value={formData.brand}
                            onChange={e => handleChange('brand', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Referencia / Modelo</label>
                        <input
                            className="w-full border rounded-lg p-2"
                            value={formData.model}
                            onChange={e => handleChange('model', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Serial</label>
                        <input
                            className="w-full border rounded-lg p-2"
                            value={formData.serial_number}
                            onChange={e => handleChange('serial_number', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Canales</label>
                        <input
                            type="number"
                            className="w-full border rounded-lg p-2"
                            value={formData.channels}
                            onChange={e => handleChange('channels', Number(e.target.value))}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Tecnología</label>
                        <select
                            className="w-full border rounded-lg p-2"
                            value={formData.technology}
                            onChange={e => handleChange('technology', e.target.value)}
                        >
                            <option value="IP">IP</option>
                            <option value="Analógico">Analógico (HDCVI/TVI/AHD)</option>
                            <option value="Híbrido">Híbrido (XVR)</option>
                            <option value="Wifi">Wifi</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Capacidad Disco</label>
                        <input
                            className="w-full border rounded-lg p-2"
                            value={formData.disk_capacity}
                            onChange={e => handleChange('disk_capacity', e.target.value)}
                            placeholder="Ej. 1TB, 2TB"
                        />
                    </div>
                </div>
            </div>

            {/* Configuración de Red */}
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Red y Conectividad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Dirección IP</label>
                        <input
                            className="w-full border rounded-lg p-2"
                            value={formData.ip_address}
                            onChange={e => handleChange('ip_address', e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Puerto HTTP</label>
                        <input
                            className="w-full border rounded-lg p-2"
                            value={formData.http_port}
                            onChange={e => handleChange('http_port', e.target.value)}
                            placeholder="Ej. 80, 8080"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Puerto RTSP/Servicio</label>
                        <input
                            className="w-full border rounded-lg p-2"
                            value={formData.rtsp_port}
                            onChange={e => handleChange('rtsp_port', e.target.value)}
                            placeholder="Ej. 554, 37777"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Correo Visualización</label>
                        <input
                            type="email"
                            className="w-full border rounded-lg p-2"
                            value={formData.email}
                            onChange={e => handleChange('email', e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Usuarios */}
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Usuarios y Accesos</h3>
                    <button
                        type="button"
                        onClick={addUser}
                        className="text-sm bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg flex items-center gap-1 hover:bg-indigo-100"
                    >
                        <Plus size={16} /> Agregar Usuario
                    </button>
                </div>

                <div className="space-y-3">
                    {formData.users.map((user, index) => (
                        <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <span className="text-xs text-gray-500 mb-1 block">Usuario</span>
                                <input
                                    className="w-full border rounded p-1 text-sm"
                                    value={user.username}
                                    onChange={e => handleUserChange(index, 'username', e.target.value)}
                                    placeholder="admin"
                                />
                            </div>
                            <div className="flex-1">
                                <span className="text-xs text-gray-500 mb-1 block">Contraseña</span>
                                <input
                                    className="w-full border rounded p-1 text-sm"
                                    type="text" // Visible for admin convenience
                                    value={user.password}
                                    onChange={e => handleUserChange(index, 'password', e.target.value)}
                                />
                            </div>
                            <div className="w-20 pt-5">
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={user.is_admin}
                                        onChange={e => handleUserChange(index, 'is_admin', e.target.checked)}
                                    />
                                    Admin
                                </label>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeUser(index)}
                                className="text-red-500 p-2 hover:bg-red-50 rounded mt-4"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Imágenes */}
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Imágenes (Opcional)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* QR Code */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Código QR App</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[150px] relative bg-gray-50 text-center">
                            {previews.qr ? (
                                <div className="relative w-full h-full flex flex-col items-center">
                                    <img src={previews.qr} alt="QR" className="h-40 object-contain mb-2" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFiles(p => ({ ...p, qr: null }));
                                            setPreviews(p => ({ ...p, qr: undefined }));
                                        }}
                                        className="absolute top-0 right-0 bg-red-100 text-red-600 p-1 rounded-full"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="text-gray-400 mb-2" size={32} />
                                    <p className="text-sm text-gray-500">Click para subir imagen QR</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => handleFileChange('qr', e)}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Photo */}
                    <div>
                        <label className="block text-sm font-medium mb-2">Foto del Equipo/Montaje</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[150px] relative bg-gray-50 text-center">
                            {previews.photo ? (
                                <div className="relative w-full h-full flex flex-col items-center">
                                    <img src={previews.photo} alt="Foto" className="h-40 object-contain mb-2" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFiles(p => ({ ...p, photo: null }));
                                            setPreviews(p => ({ ...p, photo: undefined }));
                                        }}
                                        className="absolute top-0 right-0 bg-red-100 text-red-600 p-1 rounded-full"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Upload className="text-gray-400 mb-2" size={32} />
                                    <p className="text-sm text-gray-500">Click para subir foto</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => handleFileChange('photo', e)}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Observaciones */}
            <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                <label className="block text-sm font-medium mb-1">Observaciones / Notas Adicionales</label>
                <textarea
                    rows={3}
                    className="w-full border rounded-lg p-2"
                    value={formData.observations}
                    onChange={e => handleChange('observations', e.target.value)}
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border rounded-lg hover:bg-gray-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={20} />
                    {loading ? "Guardando..." : "Guardar Sistema"}
                </button>
            </div>
        </form>
    );
}
