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
		const { code, sessionId } = body;

		if (!code || !sessionId) {
			return json({ error: 'Не указан код или sessionId' }, { status: 400 });
		}

		const response = await fetch(`${COLLECTOR_API_URL}/auth/telegram/verification-code`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({ code, sessionId })
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Server] Verification code error response:', errorText);
			return json({ error: 'Ошибка при проверке кода' }, { status: response.status });
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('[Server] Error in /api/telegram/verification-code:', error);
		return json({ error: 'Ошибка сервера при проверке кода' }, { status: 500 });
	}
}; 