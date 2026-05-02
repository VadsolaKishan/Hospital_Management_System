import api from './api';

export interface Appointment {
  id: number;
  patient: number;
  patient_name?: string;
  patient_uhid?: string;
  doctor: number;
  doctor_name?: string;
  appointment_date: string;
  appointment_time: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  has_prescription?: boolean;
  prescription_id?: number | null;
  prescription_info?: {
    diagnosis: string;
    medications: string;
    instructions?: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentData {
  patient: number;
  doctor: number;
  appointment_date: string;
  appointment_time: string;
  reason: string;
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

export const appointmentService = {
  async getAll(): Promise<Appointment[]> {
    const response = await api.get('/appointments/');
    return extractResults(response.data);
  },

  async getById(id: number): Promise<Appointment> {
    const response = await api.get(`/appointments/${id}/`);
    return response.data;
  },

  async create(data: CreateAppointmentData): Promise<Appointment> {
    const response = await api.post('/appointments/', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateAppointmentData>): Promise<Appointment> {
    const response = await api.put(`/appointments/${id}/`, data);
    return response.data;
  },

  async approve(id: number): Promise<Appointment> {
    const response = await api.post(`/appointments/${id}/approve/`);
    return response.data;
  },

  async reject(id: number, reason: string): Promise<Appointment> {
    const response = await api.post(`/appointments/${id}/reject/`, { reason });
    return response.data;
  },

  async cancel(id: number): Promise<Appointment> {
    const response = await api.post(`/appointments/${id}/cancel/`);
    return response.data;
  },

  async getUpcoming(): Promise<Appointment[]> {
    const response = await api.get('/appointments/upcoming/');
    return extractResults(response.data);
  },

  async getHistory(patientId: number): Promise<Appointment[]> {
    const response = await api.get(`/appointments/?patient_id=${patientId}`);
    return extractResults(response.data);
  },
};
