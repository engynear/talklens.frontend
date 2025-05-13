import { writable, get } from "svelte/store";
import type { User } from "$lib/types/user";
import type { TelegramAccount, TelegramContact } from '$lib/types/telegram';
import { goto } from '$app/navigation';

function createPersistentStore<T>(key: string, startValue: T) {
    const storedValue = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    const initialValue = storedValue ? JSON.parse(storedValue) : startValue;

    const store = writable<T>(initialValue);

    if (typeof window !== 'undefined') {
        store.subscribe(value => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }

    return store;
}

export const user = writable<User | null>(null);

export interface Messenger {
    id: string;
    name: string;
    icon: string;
    chats: Chat[];
}

export interface Chat {
    id: string;
    name: string;
    avatar: string;
}

export const messengers = writable<Messenger[]>([]);

export const selectedMessenger = writable<Messenger | null>(null);
export const selectedChat = writable<Chat | null>(null);

export const telegramAccounts = createPersistentStore<TelegramAccount[]>('telegramAccounts', []);

export const selectedTelegramAccount = createPersistentStore<TelegramAccount | null>('selectedTelegramAccount', null);

export const telegramContacts = writable<TelegramContact[]>([]);

export const selectedContact = createPersistentStore<TelegramContact | null>('selectedContact', null);

export const sidebarRefreshTrigger = writable<number>(0);

export function triggerSidebarRefresh() {
    sidebarRefreshTrigger.update(count => count + 1);
}
interface TelegramSession {
    phoneNumber: string;
    telegramUserId: string | null;
    id: string;
    sessionId: string;
    sessionType: string;
    createdAt: string;
    lastActivityAt: string;
}

export function addTelegramAccount(phone: string, sessionId: string) {
    const account: TelegramAccount = {
        phone,
        isActive: true,
        sessionId
    };

    telegramAccounts.update(accounts => {
        const existingIndex = accounts.findIndex(a => a.phone === phone);
        if (existingIndex >= 0) {
            accounts[existingIndex].isActive = true;
            accounts[existingIndex].sessionId = sessionId;
            return accounts;
        }
        return [account, ...accounts];
    });

    selectedTelegramAccount.update(current => {
        if (!current) {
            return account;
        }
        return current;
    });
}

export async function loadActiveSessions() {
    try {
        const response = await fetch('/api/telegram/sessions', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to load active sessions');
        }
        const sessions = await response.json() as TelegramSession[];

        telegramAccounts.set(
            sessions.map((session: TelegramSession) => ({
                phone: session.phoneNumber,
                isActive: true,
                sessionId: session.sessionId,
                id: session.id
            }))
        );
    } catch (error) {
        console.error('Error loading active sessions:', error);
    }
}


export async function initializeAccounts() {
    await loadActiveSessions();

    const currentAccount = get(selectedTelegramAccount);
    if (!currentAccount) {

        const accounts = get(telegramAccounts);
        if (accounts.length > 0) {
            const account = accounts[0];
            selectedTelegramAccount.set({
                ...account,
                isActive: true
            });
        }
    }
}

export async function selectTelegramAccount(phone: string, sessionId: string) {
    const account = get(telegramAccounts).find(a => a.phone === phone);
    if (account) {
        selectedTelegramAccount.set({
            ...account,
            isActive: true,
            sessionId
        });
    }
}

export async function loadTelegramContacts(sessionId: string) {
    try {
        const response = await fetch(`/api/telegram/contacts?sessionId=${sessionId}`, {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to load contacts');
        }

        const contacts = await response.json();
        telegramContacts.set(contacts);
        return contacts;
    } catch (error) {
        console.error('Error loading contacts:', error);
        telegramContacts.set([]);
        selectedContact.set(null);
        return [];
    }
}

export function selectContact(contact: TelegramContact) {
    console.log('[Stores] Selecting contact:', contact);
    if (contact && contact.first_name === 'Контакт' && !contact.last_name) {
        console.log('[Stores] Contact info incomplete, will try to enrich later');
    }

    selectedContact.set(contact);
    goto('/dashboard');
}

export function clearContacts() {
    telegramContacts.set([]);
    selectedContact.set(null);
}
