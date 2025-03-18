import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

export const GET: RequestHandler = async ({ cookies, params }) => {
	try {
		const token = cookies.get('auth_token');
		if (!token) {
			return json({ error: 'Не авторизован' }, { status: 401 });
		}

		const { sessionId } = params;
		if (!sessionId) {
			return json({ error: 'Не указан sessionId' }, { status: 400 });
		}

		const response = await fetch(`${COLLECTOR_API_URL}/auth/telegram/status/${sessionId}`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('[Server] Status check error response:', errorText);
			return json({ error: 'Ошибка при проверке статуса' }, { status: response.status });
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('[Server] Error in /api/telegram/status:', error);
		return json({ error: 'Ошибка сервера при проверке статуса' }, { status: 500 });
	}
}; 