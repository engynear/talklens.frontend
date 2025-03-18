import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { get } from 'svelte/store';
import { selectedTelegramAccount } from '$lib/stores/stores';

export const load: PageLoad = async ({ fetch }) => {
    const account = get(selectedTelegramAccount);
    
    if (!account) {
        throw redirect(302, '/dashboard');
    }
    
    return {};
}; 