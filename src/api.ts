const BASE = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'http://localhost:4000/api';

export async function api(path: string, options: any = {}): Promise<any> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = (options.headers as Record<string, string>) || {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (e) {
    return text;
  }
}
