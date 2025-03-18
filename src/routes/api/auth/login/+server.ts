import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AUTH_API_URL } from '$lib/config';

export const POST: RequestHandler = async ({ request }) => {
	const { username, password } = await request.json();

	try {
		const response = await fetch(`${AUTH_API_URL}/auth/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ username, password })
		});

		const data = await response.json();
		
		if (data.success && data.token) {
			// Устанавливаем куку с токеном
			return json(
				{ success: data.success, user: data.user, error: data.error },
				{
					status: response.status,
					headers: {
						'Set-Cookie': `auth_token=${data.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=2592000` // 30 дней
					}
				}
			);
		}

		return json(data, { status: response.status });
	} catch (error) {
		console.error('Login error:', error);
		return json({ 
			success: false,
			error: 'Ошибка сервера',
			user: null
		}, { status: 500 });
	}
}; 