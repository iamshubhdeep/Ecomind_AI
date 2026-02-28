/**
 * EcoMind AI – API Service Layer
 * Centralizes all backend API calls.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

async function apiFetch(endpoint, options = {}) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

// ── Dashboard ──
export async function getDashboardStats() {
    return apiFetch('/dashboard/stats');
}

export async function getWasteTrend(days = 14) {
    return apiFetch(`/dashboard/waste-trend?days=${days}`);
}

export async function getWasteComposition() {
    return apiFetch('/dashboard/composition');
}

export async function getAlerts() {
    return apiFetch('/dashboard/alerts');
}

// ── Waste Analyzer ──
export async function classifyWaste(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/analyzer/classify`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

export async function getClassificationHistory(limit = 10) {
    return apiFetch(`/analyzer/history?limit=${limit}`);
}

// ── Waste Predictor ──
export async function getHistoricalData(buildingId = 'all', days = 30) {
    return apiFetch(`/predictor/historical?building_id=${buildingId}&days=${days}`);
}

export async function getForecast(buildingId = 'all', days = 7) {
    return apiFetch(`/predictor/forecast?building_id=${buildingId}&days=${days}`);
}

// ── Route Optimizer ──
export async function getOptimizedRoute() {
    return apiFetch('/routes/optimize');
}

export async function getAllBins() {
    return apiFetch('/routes/bins');
}

// ── Carbon Engine ──
export async function getCarbonSummary() {
    return apiFetch('/carbon/summary');
}

export async function getWeeklyCarbon() {
    return apiFetch('/carbon/weekly');
}

export async function getCarbonByCategory() {
    return apiFetch('/carbon/by-category');
}

export async function getSustainabilityBreakdown() {
    return apiFetch('/carbon/breakdown');
}

// ── Insights ──
export async function getInsights(category = 'all', buildingId = 'all') {
    return apiFetch(`/insights?category=${category}&building_id=${buildingId}`);
}

export async function getInsightCategories() {
    return apiFetch('/insights/categories');
}

// ── Buildings ──
export async function getBuildings() {
    return apiFetch('/buildings');
}
