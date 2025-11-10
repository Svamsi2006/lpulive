// API Configuration for Vercel Deployment
const API_BASE_URL = import.meta.env.PROD 
  ? '' // Use relative URLs in production (Vercel)
  : 'http://localhost:5000'; // Use localhost in development

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/auth/change-password`
  },
  CHATS: {
    GET_ALL: `${API_BASE_URL}/api/chats`,
    GET_MESSAGES: (chatId) => `${API_BASE_URL}/api/messages/${chatId}`,
    SEND_MESSAGE: `${API_BASE_URL}/api/messages/send`
  },
  GROUPS: {
    GET_ALL: `${API_BASE_URL}/api/groups`,
    CREATE: `${API_BASE_URL}/api/groups/create`,
    GET_UNIVERSITY: `${API_BASE_URL}/api/groups/university`,
    CREATE_UNIVERSITY: `${API_BASE_URL}/api/groups/university/create`
  },
  ANNOUNCEMENTS: {
    GET_ALL: `${API_BASE_URL}/api/announcements`,
    CREATE: `${API_BASE_URL}/api/announcements`
  },
  USERS: {
    SEARCH: (query) => `${API_BASE_URL}/api/users/search?q=${query}`
  }
};

export default API_BASE_URL;
