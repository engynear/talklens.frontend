import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

export const POST: RequestHandler = async ({ cookies, request }) => {
    try {
        const token = cookies.get('auth_token');
        if (!token) {
            return json({ error: 'Не авторизован' }, { status: 401 });
        }

        const body = await request.json();
        console.log('[Server] Verification code request body:', body);
        
        const sessionId = body.sessionId;
        const code = body.code || body.verificationCode;

        if (!sessionId || !code) {
            return json({ error: 'Не указан sessionId или код верификации' }, { status: 400 });
        }
        
        console.log('[Server] Verification code request for session:', sessionId);

        // Формируем тело запроса в соответствии с требуемым форматом
        const requestBody = {
            sessionId, 
            code
        };
        
        console.log('[Server] Sending to backend:', requestBody);

        const response = await fetch(`${COLLECTOR_API_URL}/sessions/telegram/verification-code`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Server] Verification code error response:', errorText);
            try {
                // Попытка распарсить ответ как JSON
                const errorJson = JSON.parse(errorText);
                return json({ error: errorJson.message || 'Ошибка при вводе кода верификации', details: errorJson }, { status: response.status });
            } catch (e) {
                // Если не JSON, вернуть как есть
                return json({ error: 'Ошибка при вводе кода верификации', details: errorText }, { status: response.status });
            }
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/verification-code:', error);
        return json({ error: 'Ошибка сервера при обработке кода верификации' }, { status: 500 });
    }
}; 