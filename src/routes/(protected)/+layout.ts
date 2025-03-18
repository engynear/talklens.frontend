import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const data = await parent();
	
	// Проверяем наличие пользователя и его данных
	if (!data.user || !data.user.id) {
		console.error('Protected route accessed without valid user:', data);
		throw redirect(302, '/login');
	}

	return data;
}; 