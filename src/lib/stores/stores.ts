import { writable, get } from "svelte/store";
import type { User } from "$lib/types/user";
import type { TelegramAccount, TelegramSessionResponse, TelegramContact, TelegramSessionStatus } from '$lib/types/telegram';
import { goto } from '$app/navigation';

// Функция для создания персистентного store
function createPersistentStore<T>(key: string, startValue: T) {
    // Пробуем получить значение из localStorage
    const storedValue = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    const initialValue = storedValue ? JSON.parse(storedValue) : startValue;
    
    const store = writable<T>(initialValue);
    
    // Подписываемся на изменения и сохраняем в localStorage
    if (typeof window !== 'undefined') {
        store.subscribe(value => {
            localStorage.setItem(key, JSON.stringify(value));
        });
    }
    
    return store;
}

// Store для текущего пользователя
export const user = writable<User | null>(null);

// Определяем интерфейс для мессенджеров
export interface Messenger {
  id: string;
  name: string;
  icon: string;
  chats: Chat[];
}

// Интерфейс для чатов
export interface Chat {
  id: string;
  name: string;
  avatar: string;
}

// Хранилище списка мессенджеров
export const messengers = writable<Messenger[]>([]);

// Выбранный мессенджер и чат
export const selectedMessenger = writable<Messenger | null>(null);
export const selectedChat = writable<Chat | null>(null);

// Store для списка подключенных телефонов Telegram
export const telegramAccounts = createPersistentStore<TelegramAccount[]>('telegramAccounts', []);

// Store для текущего выбранного телефона
export const selectedTelegramAccount = createPersistentStore<TelegramAccount | null>('selectedTelegramAccount', null);

// Store для списка контактов текущего аккаунта
export const telegramContacts = writable<TelegramContact[]>([]);

// Store для выбранного контакта
export const selectedContact = createPersistentStore<TelegramContact | null>('selectedContact', null);

// Store для подсчета обновлений сайдбара (используется для триггера перезагрузки)
export const sidebarRefreshTrigger = writable<number>(0);

// Функция для запуска обновления сайдбара
export function triggerSidebarRefresh() {
    sidebarRefreshTrigger.update(count => count + 1);
}

// Интерфейс для сессии Telegram
interface TelegramSession {
    phoneNumber: string;
    telegramUserId: string | null;
    id: string;
    sessionId: string;
    sessionType: string;
    createdAt: string;
    lastActivityAt: string;
}

// Функция для добавления нового телефона
export function addTelegramAccount(phone: string, sessionId: string) {
    const account: TelegramAccount = {
        phone,
        isActive: true,
        sessionId
    };

    telegramAccounts.update(accounts => {
        // Проверяем, нет ли уже такого номера
        const existingIndex = accounts.findIndex(a => a.phone === phone);
        if (existingIndex >= 0) {
            // Если номер существует, обновляем его статус и sessionId
            accounts[existingIndex].isActive = true;
            accounts[existingIndex].sessionId = sessionId;
            return accounts;
        }
        // Если это новый номер, добавляем его в начало списка
        return [account, ...accounts];
    });

    // Если это первый аккаунт или текущий не выбран, устанавливаем его как выбранный
    selectedTelegramAccount.update(current => {
        if (!current) {
            return account;
        }
        return current;
    });
}

// Функция для загрузки активных сессий
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
        
        // Очищаем список аккаунтов и заполняем его новыми данными
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

// Функция для инициализации при загрузке страницы
export async function initializeAccounts() {
    await loadActiveSessions();
    
    const currentAccount = get(selectedTelegramAccount);
    if (!currentAccount) {
        // Если нет выбранного аккаунта, выбираем первый
        const accounts = get(telegramAccounts);
        if (accounts.length > 0) {
            // Просто устанавливаем аккаунт, но не загружаем контакты
            const account = accounts[0];
            selectedTelegramAccount.set({
                ...account,
                isActive: true
            });
        }
    }
    // Убираем автоматическую загрузку контактов при инициализации
}

// Функция выбора аккаунта
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

// Функция для загрузки контактов
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

// Функция для выбора контакта
export function selectContact(contact: TelegramContact) {
    console.log('[Stores] Selecting contact:', contact);
    
    // Проверка на полноту данных контакта
    if (contact && contact.first_name === 'Контакт' && !contact.last_name) {
        console.log('[Stores] Contact info incomplete, will try to enrich later');
    }
    
    selectedContact.set(contact);
    // После выбора контакта перенаправляем на дашборд используя goto
    goto('/dashboard');
}

// Очистка контактов при смене аккаунта
export function clearContacts() {
    telegramContacts.set([]);
    selectedContact.set(null);
}
