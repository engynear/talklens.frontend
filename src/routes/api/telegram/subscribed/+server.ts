import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

export const GET: RequestHandler = async ({ cookies, url }) => {
    try {
        const token = cookies.get('auth_token');
        if (!token) {
            return json({ error: 'Не авторизован' }, { status: 401 });
        }

        const sessionId = url.searchParams.get('sessionId');
        if (!sessionId) {
            return json({ error: 'Не указан sessionId' }, { status: 400 });
        }

        const response = await fetch(`${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/subscriptions`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Server] Subscribed contacts error response:', errorText);
            return json({ error: 'Ошибка при получении подписанных контактов' }, { status: response.status });
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/subscribed:', error);
        return json({ error: 'Ошибка сервера при получении подписанных контактов' }, { status: 500 });
    }
}; 