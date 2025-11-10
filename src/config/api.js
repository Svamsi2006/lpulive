// API Configuration for Vercel Deployment
const API_BASE_URL = import.meta.env.PROD 
  ? '' // Use relative URLs in production (Vercel)
  : 'http://localhost:5000'; // Use localhost in development

// Helper function to get API URL
export const getApiUrl = (path) => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`
  },
  CHATS: {
    GET_ALL: `${API_BASE_URL}/api/chats`,
    GET_MESSAGES: (chatId) => `${API_BASE_URL}/api/messages/${chatId}`,
    SEND_MESSAGE: `${API_BASE_URL}/api/messages/send`,
    CREATE: `${API_BASE_URL}/api/chats/create`,
    READ: `${API_BASE_URL}/api/messages/read`
  },
  GROUPS: {
    GET_ALL: `${API_BASE_URL}/api/groups`,
    CREATE: `${API_BASE_URL}/api/groups/create`,
    GET_UNIVERSITY: `${API_BASE_URL}/api/groups/university`,
    CREATE_UNIVERSITY: `${API_BASE_URL}/api/groups/university/create`,
    GET_MESSAGES: (groupId) => `${API_BASE_URL}/api/groups/${groupId}/messages`
  },
  ANNOUNCEMENTS: {
    GET_ALL: `${API_BASE_URL}/api/announcements`,
    CREATE: `${API_BASE_URL}/api/announcements`
  },
  USERS: {
    SEARCH: (query) => `${API_BASE_URL}/api/users/search?q=${query}`,
    GET_BY_ID: (regNumber) => `${API_BASE_URL}/api/users/${regNumber}`
  },
  MESSAGES: {
    SEND: `${API_BASE_URL}/api/messages`,
    GET_BY_CHAT: (chatId) => `${API_BASE_URL}/api/messages/${chatId}`
  },
  UPLOAD: `${API_BASE_URL}/api/upload`
};

export default API_BASE_URL;
