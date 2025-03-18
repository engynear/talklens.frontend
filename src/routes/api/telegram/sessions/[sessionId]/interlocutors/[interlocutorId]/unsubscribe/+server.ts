import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

export const POST: RequestHandler = async ({ fetch, cookies, params }) => {
    const token = cookies.get('auth_token');
    const sessionId = params.sessionId;
    const interlocutorId = params.interlocutorId;
    if (!token) {
        return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const response = await fetch(`${COLLECTOR_API_URL}/auth/telegram/sessions/${sessionId}/interlocutors/${interlocutorId}/unsubscribe`, {
        method: 'POST',
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