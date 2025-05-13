export const AUTH_API_URL = process.env.NODE_ENV === 'production' 
  ? 'http://auth/api' 
  : 'http://localhost:7001/api';

export const COLLECTOR_API_URL = process.env.NODE_ENV === 'production'
  ? 'http://collector'
  : 'http://localhost:5000';

export const API_TIMEOUT = 30000;