const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Dynamic fallback for browser-side execution
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:4001';
    }
  }

  return 'http://localhost:4001'; // Default fallback
};

export const API_BASE_URL = getApiBaseUrl();
