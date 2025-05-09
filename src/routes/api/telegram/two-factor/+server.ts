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
        console.log('[Server] Two-factor auth request body:', body);
        
        const sessionId = body.sessionId;
        const password = body.password;

        if (!sessionId || !password) {
            return json({ error: 'Не указан sessionId или пароль' }, { status: 400 });
        }
        
        console.log('[Server] Two-factor auth request for session:', sessionId);

        // Формируем тело запроса в соответствии с требуемым форматом
        const requestBody = {
            sessionId, 
            password
        };
        
        console.log('[Server] Sending to backend:', requestBody);

        const response = await fetch(`${COLLECTOR_API_URL}/sessions/telegram/two-factor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Server] Two-factor auth error response:', errorText);
            try {
                // Попытка распарсить ответ как JSON
                const errorJson = JSON.parse(errorText);
                return json({ error: errorJson.message || 'Ошибка при двухфакторной аутентификации', details: errorJson }, { status: response.status });
            } catch (e) {
                // Если не JSON, вернуть как есть
                return json({ error: 'Ошибка при двухфакторной аутентификации', details: errorText }, { status: response.status });
            }
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/two-factor:', error);
        return json({ error: 'Ошибка сервера при обработке двухфакторной аутентификации' }, { status: 500 });
    }
}; 