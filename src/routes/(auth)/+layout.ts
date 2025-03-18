import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
    const data = await parent();
    
    // Если пользователь авторизован, перенаправляем на главную
    if (data.user) {
        throw redirect(302, '/');
    }

    return data;
}; 