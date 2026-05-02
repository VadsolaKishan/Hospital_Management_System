import api from './api';

export interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Query {
  id: number;
  user: number;
  user_name?: string;
  user_email?: string;
  subject: string;
  message: string;
  admin_reply: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
}

// Helper to extract results from paginated responses
const extractResults = (data: any): any[] => {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && data.results && Array.isArray(data.results)) {
    return data.results;
  }
  return [];
};

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const response = await api.get('/support/notifications/');
    return extractResults(response.data);
  },

  async getUnread(): Promise<Notification[]> {
    const response = await api.get('/support/notifications/unread/');
    return extractResults(response.data);
  },

  async markRead(id: number): Promise<void> {
    await api.post(`/support/notifications/${id}/mark_read/`);
  },

  // Queries
  async getQueries(): Promise<Query[]> {
    const response = await api.get('/support/queries/');
    return extractResults(response.data);
  },

  async createQuery(data: { subject: string; message: string }): Promise<Query> {
    const response = await api.post('/support/queries/', data);
    return response.data;
  },

  async replyToQuery(id: number, reply: string): Promise<Query> {
    const response = await api.post(`/support/queries/${id}/reply/`, { reply });
    return response.data;
  },
};
