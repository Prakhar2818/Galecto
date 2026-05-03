export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('ag_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`http://localhost:3001${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Optional: handle unauthorized redirect
    // localStorage.removeItem('ag_token');
    // window.location.href = '/login';
  }

  return response.json();
}

// Special fetch for Query Service (if it requires direct access or specific port)
export async function queryFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('ag_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`http://localhost:4002${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}

export async function alertFetch(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('ag_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`http://localhost:5003${endpoint}`, {
    ...options,
    headers,
  });

  return response.json();
}
