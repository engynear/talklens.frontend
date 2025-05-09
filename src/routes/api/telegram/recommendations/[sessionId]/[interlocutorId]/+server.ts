import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { COLLECTOR_API_URL } from '$lib/config';

interface Recommendation {
    id: number;
    recommendationText: string;
    createdAt: string;
}

export const GET: RequestHandler = async ({ cookies, params }) => {
    try {
        const token = cookies.get('auth_token');
        if (!token) {
            return json({ error: 'Не авторизован' }, { status: 401 });
        }

        const { sessionId, interlocutorId } = params;
        if (!sessionId || !interlocutorId) {
            return json({ error: 'Не указан sessionId или interlocutorId' }, { status: 400 });
        }

        console.log(`[Server] Fetching recommendations for sessionId=${sessionId}, interlocutorId=${interlocutorId}`);

        const response = await fetch(
            `${COLLECTOR_API_URL}/metrics/telegram/recommendations/${sessionId}/${interlocutorId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Server] Recommendations error response:', errorText);
            
            if (response.status === 404) {
                console.log('[Server] No recommendations found (404)');
                return json({ notFound: true }, { status: 404 });
            }
            
            return json({ error: 'Ошибка при получении рекомендаций' }, { status: response.status });
        }

        const recommendation = await response.json() as Recommendation;
        console.log('[Server] Received recommendation:', recommendation);
        
        return json(recommendation);
    } catch (error) {
        console.error('[Server] Error in /api/telegram/recommendations:', error);
        return json({ error: 'Ошибка сервера при получении рекомендаций' }, { status: 500 });
    }
}; 