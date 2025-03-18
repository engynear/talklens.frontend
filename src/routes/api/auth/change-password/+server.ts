import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AUTH_API_URL } from '$lib/config';

export const POST: RequestHandler = async ({ request, cookies, fetch }) => {
	try {
		const authToken = cookies.get('auth_token');
		
		if (!authToken) {
			return json(
				{ success: false, message: 'Вы не авторизованы' },
				{ status: 401 }
			);
		}
		
		const { currentPassword, newPassword } = await request.json();
		
		if (!currentPassword || !newPassword) {
			return json(
				{ success: false, message: 'Необходимо указать текущий и новый пароль' },
				{ status: 400 }
			);
		}
		
		// Отправляем запрос на API сервера для смены пароля
		const response = await fetch(`${AUTH_API_URL}/auth/change-password`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${authToken}`
			},
			body: JSON.stringify({
				currentPassword,
				newPassword
			})
		});
		
		const data = await response.json();
		
		if (!response.ok) {
			// Передаем сообщение об ошибке от API
			return json(
				{ 
					success: false, 
					message: data.message || 'Ошибка при смене пароля'
				},
				{ status: response.status }
			);
		}
		
		return json({ success: true, message: 'Пароль успешно изменен' });
		
	} catch (error) {
		console.error('Ошибка при смене пароля:', error);
		return json(
			{ 
				success: false, 
				message: 'Произошла ошибка при обработке запроса'
			},
			{ status: 500 }
		);
	}
}; 