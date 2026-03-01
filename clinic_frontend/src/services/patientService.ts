import api from './api';

export interface Patient {
  id: number;
  uhid: string;
  user: number;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  date_of_birth: string;
  gender: 'M' | 'F' | 'O';
  blood_group: string;
  address: string;
  emergency_contact: string;
  medical_history: string;
  allergies: string;
  created_at: string;
}

export interface CreatePatientData {
  user: number;
  contact_number?: string;
  first_name?: string;
  last_name?: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  address: string;
  emergency_contact: string;
  medical_history?: string;
  allergies?: string;
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

export const patientService = {
  async getAll(searchQuery?: string): Promise<Patient[]> {
    const params = searchQuery ? { search: searchQuery } : {};
    const response = await api.get('/patients/', { params });
    return extractResults(response.data);
  },

  async getById(id: number): Promise<Patient> {
    const response = await api.get(`/patients/${id}/`);
    return response.data;
  },

  async create(data: CreatePatientData): Promise<Patient> {
    const response = await api.post('/patients/', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreatePatientData>): Promise<Patient> {
    const response = await api.put(`/patients/${id}/`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/patients/${id}/`);
  },

  async getMyProfile(): Promise<Patient> {
    const response = await api.get('/patients/my_profile/');
    return response.data;
  },

  async updateMyProfile(data: Partial<CreatePatientData>): Promise<Patient> {
    const response = await api.patch('/patients/my_profile/', data);
    return response.data;
  },
};
