"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiFetch = apiFetch;
exports.queryFetch = queryFetch;
exports.alertFetch = alertFetch;
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('ag_token');
    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(options.headers || {}),
    };
    const response = await fetch(`http://localhost:4000${endpoint}`, {
        ...options,
        headers,
    });
    if (response.status === 401) {
        localStorage.removeItem('ag_token');
        window.location.href = '/login';
    }
    return response.json();
}
// Special fetch for Query Service (if it requires direct access or specific port)
async function queryFetch(endpoint, options = {}) {
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
async function alertFetch(endpoint, options = {}) {
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
