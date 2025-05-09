// Auth API URL (аутентификация, управление пользователями)
export const AUTH_API_URL = process.env.NODE_ENV === 'production' 
  ? 'http://auth/api' 
  : 'http://localhost:7001/api';

// Collector API URL (Telegram и другие мессенджеры)
export const COLLECTOR_API_URL = process.env.NODE_ENV === 'production'
  ? 'http://collector'
  : 'http://localhost:5000';

// Таймаут для запросов (в миллисекундах)
export const API_TIMEOUT = 30000;