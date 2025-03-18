import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { AUTH_API_URL } from '$lib/config';

export const GET: RequestHandler = async ({ cookies }) => {
    const token = cookies.get('auth_token');

    if (!token) {
        console.log('No auth token found in cookies');
        return json(null, { status: 401 });
    }

    try {
        const response = await fetch(`${AUTH_API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            method: 'GET'
        });

        if (!response.ok) {
            console.error('Failed to fetch user data:', response.status, response.statusText);
            
            // Если токен недействителен, удаляем его
            if (response.status === 401) {
                return json(null, {
                    status: 401,
                    headers: {
                        'Set-Cookie': 'auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0'
                    }
                });
            }
            
            return json(null, { status: response.status });
        }

        const userData = await response.json();
        return json(userData);
    } catch (error) {
        console.error('Error fetching user data:', error);
        return json(null, { status: 500 });
    }
}; 