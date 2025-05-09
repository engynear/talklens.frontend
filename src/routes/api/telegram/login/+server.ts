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
        console.log('[Server] Telegram login request body:', body);
        
        // Получаем номер телефона из поля phone или phoneNumber
        const phone = body.phone || body.phoneNumber;
        const sessionId = body.sessionId;

        if (!phone) {
            return json({ error: 'Не указан номер телефона' }, { status: 400 });
        }
        
        console.log('[Server] Telegram login request with phone:', phone);

        // Формируем тело запроса в соответствии с требуемым форматом
        const requestBody = {
            sessionId,
            phone
        };
        
        console.log('[Server] Sending to backend:', requestBody);

        const response = await fetch(`${COLLECTOR_API_URL}/sessions/telegram/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Server] Telegram login error response:', errorText);
            try {
                // Попытка распарсить ответ как JSON
                const errorJson = JSON.parse(errorText);
                return json({ error: errorJson.message || 'Ошибка при авторизации в Telegram', details: errorJson }, { status: response.status });
            } catch (e) {
                // Если не JSON, вернуть как есть
                return json({ error: 'Ошибка при авторизации в Telegram', details: errorText }, { status: response.status });
            }
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/login:', error);
        return json({ error: 'Ошибка сервера при авторизации в Telegram' }, { status: 500 });
    }
}; 