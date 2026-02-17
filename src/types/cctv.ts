export interface CctvSystem {
    id: string;
    client_id: string;
    branch?: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    channels?: number;
    technology?: string; // 'Analog', 'IP', 'Hybrid'
    disk_capacity?: string;
    ip_address?: string;
    http_port?: string;
    rtsp_port?: string;
    email?: string;
    qr_code_url?: string;
    photo_url?: string;
    observations?: string;
    created_at?: string;

    // Relations
    client?: {
        name: string;
    };
    users?: CctvUser[];
}

export interface CctvUser {
    id: string;
    cctv_system_id: string;
    username: string;
    password?: string; // Optional when fetching just list, required for edit/view details
    is_admin?: boolean;
}

export interface CctvFormData {
    client_id: string;
    branch: string;
    brand: string;
    model: string;
    serial_number: string;
    channels: number;
    technology: string;
    disk_capacity: string;
    ip_address: string;
    http_port: string;
    rtsp_port: string;
    email: string;
    observations: string;
    // Files
    qr_code_file?: File | null;
    photo_file?: File | null;
    // Users
    users: {
        username: string;
        password: string;
        is_admin: boolean;
    }[];
}
