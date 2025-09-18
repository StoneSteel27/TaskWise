import { ApiService as mockApiService } from './api';
import { realApiService } from './api.client';

const useMockApi = import.meta.env.VITE_USE_MOCK_API === 'true';

export const apiService = useMockApi ? mockApiService : realApiService;
