export interface User {
    id: string;
    userName: string;
    createdAt: string;
    lastLoginAt: string;
    isActive: boolean;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    error: string | null;
    user: User;
} 