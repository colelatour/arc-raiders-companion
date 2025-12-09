import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arc_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const auth = {
  register: (email: string, username: string, password: string) =>
    api.post('/auth/register', { email, username, password }),
  
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  verify: () =>
    api.get('/auth/verify'),
};

// Raider profile endpoints
export const raider = {
  getProfiles: () => api.get('/raider/profiles'),
  
  createProfile: () =>
    api.post('/raider/profiles'),
  
  deleteProfile: (profileId: number) =>
    api.delete(`/raider/profiles/${profileId}`),
  
  getStats: (profileId: number) =>
    api.get(`/raider/profiles/${profileId}/stats`),
  
  getCompletedQuests: (profileId: number) =>
    api.get(`/raider/profiles/${profileId}/quests`),
  
  toggleQuest: (profileId: number, questId: number) =>
    api.post(`/raider/profiles/${profileId}/quests/${questId}`),
  
  getOwnedBlueprints: (profileId: number) =>
    api.get(`/raider/profiles/${profileId}/blueprints`),
  
  toggleBlueprint: (profileId: number, blueprintName: string) =>
    api.post(`/raider/profiles/${profileId}/blueprints/${encodeURIComponent(blueprintName)}`),
  
  completeExpedition: (profileId: number) =>
    api.post(`/raider/profiles/${profileId}/expedition/complete`),
  
  getAllQuests: () =>
    api.get('/raider/quests'),
  
  searchRaider: (raiderName: string) =>
    api.get('/raider/search', { params: { raiderName } }),
  
  getFavorites: () =>
    api.get('/raider/favorites'),
  
  addFavorite: (raiderProfileId: number) =>
    api.post(`/raider/favorites/${raiderProfileId}`),
  
  removeFavorite: (raiderProfileId: number) =>
    api.delete(`/raider/favorites/${raiderProfileId}`),
  
  getAllWorkbenches: () =>
    api.get('/raider/workbenches'),
  
  getCompletedWorkbenches: (profileId: number) =>
    api.get(`/raider/profiles/${profileId}/workbenches`),
  
  toggleWorkbench: (profileId: number, workbenchName: string) =>
    api.post(`/raider/profiles/${profileId}/workbenches/${encodeURIComponent(workbenchName)}`),
  
  getCompletedExpeditionParts: (profileId: number) =>
    api.get(`/raider/profiles/${profileId}/expedition-parts`),
  
  toggleExpeditionPart: (profileId: number, partName: string) =>
    api.post(`/raider/profiles/${profileId}/expedition-parts/${encodeURIComponent(partName)}`),
};

// Admin endpoints (require admin/manager role)
export const admin = {
  // Quest management
  getAllQuests: () => api.get('/admin/quests'),
  
  createQuest: (quest: { id: number; name: string; locations: string; url: string; objectives: string[]; rewards: string[] }) =>
    api.post('/admin/quests', quest),
  
  updateQuest: (questId: number, quest: { name: string; locations: string; url: string; objectives: string[]; rewards: string[] }) =>
    api.put(`/admin/quests/${questId}`, quest),
  
  deleteQuest: (questId: number) =>
    api.delete(`/admin/quests/${questId}`),
  
  // Blueprint management
  getAllBlueprints: () => api.get('/admin/blueprints'),
  
  createBlueprint: (blueprint: any) =>
    api.post('/admin/blueprints', blueprint),
  
  updateBlueprint: (blueprintId: number, blueprint: any) =>
    api.put(`/admin/blueprints/${blueprintId}`, blueprint),
  
  deleteBlueprint: (blueprintId: number) =>
    api.delete(`/admin/blueprints/${blueprintId}`),
  
  // User management
  getAllUsers: () => api.get('/admin/users'),
  
  createUser: (user: { email: string; username: string; password: string; role?: string }) =>
    api.post('/admin/users', user),
  
  deleteUser: (userId: number) =>
    api.delete(`/admin/users/${userId}`),
  
  updateUserRole: (userId: number, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),
};

export default api;
