import { environment } from '../../environments/environment';

export const API_URL = environment.apiBaseUrl.replace(/\/$/, '');
export const ACCESS_TOKEN_KEY = 'orbis_access_token';
export const REFRESH_TOKEN_KEY = 'orbis_refresh_token';
export const USER_STORAGE_KEY = 'orbis_current_user';
