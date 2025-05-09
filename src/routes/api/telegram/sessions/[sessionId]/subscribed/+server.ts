import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

export const GET: RequestHandler = async ({ fetch, cookies, params }) => {
    const token = cookies.get('auth_token');
    const sessionId = params.sessionId;
    if (!token) {
        return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const response = await fetch(`${COLLECTOR_API_URL}/sessions/telegram/${sessionId}/subscriptions`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        return new Response(response.statusText, { status: response.status });
    }

    const data = await response.json();
    return json(data);
}; 