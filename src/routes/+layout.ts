import type { LayoutLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutLoad = async ({ fetch, url }) => {
    // Создаем контроллер для отмены запроса
    const controller = new AbortController();
    
    try {
        const response = await fetch('/api/auth/me', {
            credentials: 'include',
            signal: controller.signal
        });

        const isProtectedRoute = url.pathname.startsWith('/dashboard') || 
                               url.pathname.startsWith('/connect');

        if (!response.ok) {
            if (isProtectedRoute) {
                throw redirect(303, '/login');
            }
            return { user: null };
        }

        const data = await response.json();
        
        if (!data || !data.id) {
            if (isProtectedRoute) {
                throw redirect(303, '/login');
            }
            return { user: null };
        }

        return {
            user: data
        };
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Request was cancelled');
        } else if (error instanceof Error && error.message.includes('redirect')) {
            throw error; // Пробрасываем редирект дальше
        } else {
            console.error('Failed to fetch user:', error);
        }
        return {
            user: null
        };
    } finally {
        controller.abort();
    }
}; 