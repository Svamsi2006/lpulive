// Utility to get the correct API URL for both development and production
export const getApiUrl = (path) => {
  const baseUrl = import.meta.env.PROD ? '' : 'http://localhost:5000';
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export default getApiUrl;
