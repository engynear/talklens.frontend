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

// Функция для проверки статуса аккаунта
async function checkAccountStatus(sessionId: string): Promise<TelegramSessionResponse> {
    const response = await fetch(`/api/telegram/status/${sessionId}`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        throw new Error('Failed to check account status');
    }

    return await response.json();
}

// Функция для проверки статусов всех аккаунтов
export async function checkAllAccountsStatus() {
    const accounts = get(telegramAccounts);
    const statusPromises = accounts.map(async (account) => {
        try {
            const status = await checkAccountStatus(account.sessionId);
            return {
                phone: account.phone,
                sessionId: account.sessionId,
                status: status.status
            };
        } catch (error) {
            console.error(`Failed to check status for account ${account.phone}:`, error);
            return {
                phone: account.phone,
                sessionId: account.sessionId,
                status: 'Failed' as TelegramSessionStatus
            };
        }
    });

    const statuses = await Promise.all(statusPromises);

    telegramAccounts.update(accounts => {
        return accounts.map(account => {
            const accountStatus = statuses.find(s => s.phone === account.phone);
            return {
                ...account,
                isActive: accountStatus?.status === 'Success'
            };
        });
    });

    // Если текущий выбранный аккаунт неактивен, попробуем выбрать другой активный
    const currentAccount = get(selectedTelegramAccount);
    if (currentAccount && !currentAccount.isActive) {
        const activeAccount = get(telegramAccounts).find(a => a.isActive);
        if (activeAccount) {
            await selectTelegramAccount(activeAccount.phone, activeAccount.sessionId);
        } else {
            selectedTelegramAccount.set(null);
            clearContacts();
        }
    }
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

        const sessions: TelegramSessionResponse[] = await response.json();
        
        // Обновляем список аккаунтов, добавляя новые сессии
        telegramAccounts.update(accounts => {
            sessions.forEach(session => {
                if (session.phoneNumber && session.sessionId) {
                    const existingAccount = accounts.find(a => a.sessionId === session.sessionId);
                    if (!existingAccount) {
                        accounts.push({
                            phone: session.phoneNumber,
                            isActive: session.status === 'Success',
                            sessionId: session.sessionId
                        });
                    }
                }
            });
            return accounts;
        });
    } catch (error) {
        console.error('Error loading active sessions:', error);
    }
}

// Функция для инициализации при загрузке страницы
export async function initializeAccounts() {
    await loadActiveSessions();
    await checkAllAccountsStatus();
    
    const currentAccount = get(selectedTelegramAccount);
    if (!currentAccount) {
        // Если нет выбранного аккаунта, выбираем первый активный
        const accounts = get(telegramAccounts);
        const activeAccount = accounts.find(a => a.isActive);
        if (activeAccount) {
            await selectTelegramAccount(activeAccount.phone, activeAccount.sessionId);
        }
    } else if (currentAccount.isActive) {
        // Если есть выбранный активный аккаунт, загружаем его контакты
        await loadTelegramContacts(currentAccount.sessionId);
    }
}

// Обновляем функцию выбора аккаунта
export async function selectTelegramAccount(phone: string, sessionId: string) {
    try {
        const status = await checkAccountStatus(sessionId);
        
        telegramAccounts.update(accounts => {
            return accounts.map(account => {
                if (account.phone === phone) {
                    account.isActive = status.status === 'Success';
                }
                return account;
            });
        });

        if (status.status === 'Success') {
            const account = get(telegramAccounts).find(a => a.phone === phone);
            if (account) {
                selectedTelegramAccount.set(account);
                await loadTelegramContacts(sessionId);
            }
        } else {
            console.log(`Account ${phone} status check failed: ${status.status}`);
            if (status.error) {
                console.log(`Error details: ${status.error}`);
            }
        }
    } catch (error) {
        console.error('Failed to check account status:', error);
        telegramAccounts.update(accounts => {
            return accounts.map(account => {
                if (account.phone === phone) {
                    account.isActive = false;
                }
                return account;
            });
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
    selectedContact.set(contact);
    // После выбора контакта перенаправляем на дашборд используя goto
    goto('/dashboard');
}

// Очистка контактов при смене аккаунта
export function clearContacts() {
    telegramContacts.set([]);
    selectedContact.set(null);
}
