import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

export const GET: RequestHandler = async ({ url, cookies }) => {
    const token = cookies.get('auth_token');
    const sessionId = url.searchParams.get('sessionId');

    try {
        const response = await fetch(`${COLLECTOR_API_URL}/telegram/contacts?sessionId=${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            return json({ error: 'Failed to fetch contacts' }, { status: response.status });
        }

        const data = await response.json();
        return json(data);
    } catch (error) {
        console.error('Error fetching contacts:', error);
        return json({ error: 'Internal server error' }, { status: 500 });
    }
}; 