export type TelegramSessionStatus = 
    | 'Pending'
    | 'VerificationCodeRequired'
    | 'TwoFactorRequired'
    | 'Success'
    | 'Failed'
    | 'Expired';

export interface TelegramAccount {
    phone: string;
    isActive: boolean;
    sessionId: string;
}

export interface TelegramSessionResponse {
    sessionId: string;
    status: TelegramSessionStatus;
    phoneNumber?: string;
    error?: string;
}

export interface TelegramContact {
    id: number;
    first_name: string;
    last_name: string | null;
} 