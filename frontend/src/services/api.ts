import {
  AuthResponse, User, Incident, ImageAnalysisPreview,
  DuplicateMatchCandidate, ComplaintDraft, AnalyticsOverview,
  TrendPoint, ModelEvaluationResults
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('civicmind_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // --- Auth ---
  async login(email: string, password: string):Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to authenticate');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem('civicmind_token', data.access_token);
    localStorage.setItem('civicmind_user', JSON.stringify(data.user));
    return data;
  },

  async register(full_name: string, email: string, password: string, role: string = 'citizen', phone?: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password, role, phone }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Registration failed');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem('civicmind_token', data.access_token);
    localStorage.setItem('civicmind_user', JSON.stringify(data.user));
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Session expired or invalid token');
    return res.json();
  },

  async updateMe(params: { full_name?: string; phone?: string; privacy_blur_location?: boolean }): Promise<User> {
    const query = new URLSearchParams();
    if (params.full_name !== undefined) query.append('full_name', params.full_name);
    if (params.phone !== undefined) query.append('phone', params.phone);
    if (params.privacy_blur_location !== undefined) query.append('privacy_blur_location', String(params.privacy_blur_location));

    const res = await fetch(`${API_BASE}/auth/me?${query.toString()}`, {
      method: 'PATCH',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to update profile');
    const user = await res.json();
    localStorage.setItem('civicmind_user', JSON.stringify(user));
    return user;
  },

  logout() {
    localStorage.removeItem('civicmind_token');
    localStorage.removeItem('civicmind_user');
  },

  getCurrentUser(): User | null {
    const raw = localStorage.getItem('civicmind_user');
    return raw ? JSON.parse(raw) : null;
  },

  // --- Incidents ---
  async previewAnalysis(imageFile: File): Promise<ImageAnalysisPreview> {
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await fetch(`${API_BASE}/incidents/preview-analysis`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Image preview analysis failed');
    }
    return res.json();
  },

  async createIncident(formData: FormData): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit incident report');
    }
    return res.json();
  },

  async getIncidents(filters?: { category?: string; status?: string; severity?: string; only_mine?: boolean }): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);
    if (filters?.only_mine) params.append('only_mine', 'true');

    const res = await fetch(`${API_BASE}/incidents?${params.toString()}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: number): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Incident not found');
    return res.json();
  },

  async updateIncident(id: number, data: { status?: string; category?: string; admin_notes?: string; review_required?: boolean }): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update incident');
    }
    return res.json();
  },

  async getIncidentDuplicates(id: number): Promise<DuplicateMatchCandidate[]> {
    const res = await fetch(`${API_BASE}/incidents/${id}/duplicates`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch duplicate candidates');
    return res.json();
  },

  async reviewDuplicate(incidentId: number, action: 'confirm_duplicate' | 'dismiss', parentIncidentId?: number, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${incidentId}/duplicates/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ action, parent_incident_id: parentIncidentId, notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to review duplicate');
    }
    return res.json();
  },

  // --- Assistant & Complaint Drafting ---
  async askAssistant(message: string, incidentId?: number, conversationId?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/assistant/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ message, incident_id: incidentId, conversation_id: conversationId }),
    });
    if (!res.ok) throw new Error('Civic Assistant request failed');
    return res.json();
  },

  async generateComplaintDraft(incidentId: number): Promise<ComplaintDraft> {
    const res = await fetch(`${API_BASE}/assistant/complaint-draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ incident_id: incidentId }),
    });
    if (!res.ok) throw new Error('Complaint drafting failed');
    return res.json();
  },

  // --- Analytics ---
  async getAnalyticsOverview(): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getIncidentTrends(): Promise<TrendPoint[]> {
    const res = await fetch(`${API_BASE}/analytics/trends`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch trends');
    return res.json();
  },

  async getMapIncidents(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/analytics/map`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch map data');
    return res.json();
  },

  // --- Admin ---
  async getModelInfo(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/models`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch model info');
    return res.json();
  },

  async getEvaluations(): Promise<ModelEvaluationResults> {
    const res = await fetch(`${API_BASE}/admin/evaluations`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch evaluation metrics');
    return res.json();
  },

  async getLowConfidenceIncidents(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/low-confidence-incidents`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch low-confidence queue');
    return res.json();
  },

  async getDocuments(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/documents`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Failed to fetch knowledge base documents');
    return res.json();
  },

  async reindexDocuments(): Promise<any> {
    const res = await fetch(`${API_BASE}/admin/documents/reindex`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Re-indexing failed');
    return res.json();
  },

  async exportIncidents(format: 'json' | 'csv'): Promise<Blob | any> {
    const res = await fetch(`${API_BASE}/admin/export?format=${format}`, {
      headers: { ...getAuthHeader() },
    });
    if (!res.ok) throw new Error('Export failed');
    if (format === 'csv') {
      return res.blob();
    }
    return res.json();
  }
};
