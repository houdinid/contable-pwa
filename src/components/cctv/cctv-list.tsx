"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Plus, Search, Eye, Edit, Video, Copy, Send, Users } from "lucide-react";
import type { CctvSystem } from "@/types/cctv";

export function CCTVList() {
    const router = useRouter();
    const [systems, setSystems] = useState<CctvSystem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadSystems();
    }, []);

    async function loadSystems() {
        setLoading(true);
        // Fetch systems with client name and users
        const { data, error } = await supabase
            .from('cctv_systems')
            .select('*, client:contacts(name), users:cctv_users(*)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error loading CCTV systems:", error);
        } else {
            setSystems(data || []);
        }
        setLoading(false);
    }

    const copySystemCredentials = (sys: CctvSystem) => {
        const clientName = sys.client?.name || "Sistema CCTV";
        let text = `📹 ACCESO SISTEMA CCTV\nCliente: ${clientName}${sys.branch ? ` (${sys.branch})` : ''}\nIP: ${sys.ip_address || 'N/A'}\nPuerto HTTP: ${sys.http_port || 'N/A'}\n`;
        if (sys.users && sys.users.length > 0) {
            sys.users.forEach((u, i) => {
                text += `\nUsuario ${i + 1}: ${u.username}\nContraseña: ${u.password || '(sin contraseña)'}`;
            });
        }
        navigator.clipboard.writeText(text);
        alert("Credenciales de usuario copiadas al portapapeles");
    };

    const sendSystemWhatsApp = (sys: CctvSystem) => {
        const clientName = sys.client?.name || "Sistema CCTV";
        let text = `📹 *ACCESO SISTEMA CCTV*\n`;
        text += `🏢 *Cliente:* ${clientName}${sys.branch ? ` - ${sys.branch}` : ''}\n`;
        if (sys.brand || sys.model) {
            text += `⚙️ *Equipo:* ${sys.brand || ''} ${sys.model || ''}\n`;
        }
        if (sys.ip_address) {
            text += `🌐 *IP:* ${sys.ip_address}\n`;
        }
        if (sys.http_port) {
            text += `🔌 *Puerto HTTP:* ${sys.http_port}\n`;
        }
        if (sys.users && sys.users.length > 0) {
            text += `\n👥 *Usuarios:*`;
            sys.users.forEach((u) => {
                text += `\n• *User:* ${u.username} | *Pass:* ${u.password || '(sin contraseña)'}`;
                if (u.is_admin) text += ` (Admin)`;
            });
        }

        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const filteredSystems = systems.filter(sys =>
        sys.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sys.ip_address?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Video className="text-indigo-600" />
                    Sistemas CCTV
                </h1>
                <Link
                    href="/dashboard/cctv/new"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Sistema
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por cliente, sede, marca, IP..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Cargando sistemas...</div>
            ) : filteredSystems.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed">
                    <Video className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500">No se encontraron sistemas de CCTV.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSystems.map((sys) => (
                        <div key={sys.id} className="bg-card text-card-foreground rounded-xl shadow-sm border hover:shadow-md transition-shadow overflow-hidden">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-foreground line-clamp-1">{sys.client?.name || "Sin Cliente"}</h3>
                                        <p className="text-sm text-gray-500">{sys.branch || "Sede Principal"}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${sys.technology === 'IP' ? 'bg-blue-100 text-blue-700' :
                                        sys.technology === 'Analógico' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {sys.technology}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 mb-4">
                                    <div className="flex justify-between">
                                        <span>Marca/Modelo:</span>
                                        <span className="font-medium text-foreground">{sys.brand} {sys.model}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Canales:</span>
                                        <span className="font-medium text-foreground">{sys.channels}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>IP:</span>
                                        <span className="font-medium text-foreground font-mono">{sys.ip_address || "N/A"}</span>
                                    </div>
                                </div>

                                {/* Images Badge Preview */}
                                <div className="flex items-center gap-2 mb-3">
                                    {sys.qr_code_url && (
                                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-xs flex items-center gap-1 font-medium">
                                            QR App
                                        </span>
                                    )}
                                    {sys.photo_url && (
                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-xs flex items-center gap-1 font-medium">
                                            Foto Montaje
                                        </span>
                                    )}
                                    {sys.optional_image_url && (
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs flex items-center gap-1 font-medium">
                                            Opcional
                                        </span>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4 pt-4 border-t">
                                    <button
                                        type="button"
                                        onClick={() => copySystemCredentials(sys)}
                                        className="p-2 border border-border text-foreground hover:bg-muted rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                                        title="Copiar accesos al portapapeles"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => sendSystemWhatsApp(sys)}
                                        className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors shadow-sm"
                                        title="Enviar accesos por WhatsApp"
                                    >
                                        <Send size={16} />
                                    </button>
                                    <Link
                                        href={`/dashboard/cctv/${sys.id}`}
                                        className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-lg text-center text-sm font-medium hover:bg-indigo-100 flex items-center justify-center gap-2"
                                    >
                                        <Edit size={16} /> Editar / Ver
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
