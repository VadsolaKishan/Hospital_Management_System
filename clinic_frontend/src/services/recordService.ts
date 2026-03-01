import api from './api';

export interface Prescription {
  id: number;
  appointment: number;
  patient: number;
  patient_name?: string;
  patient_uhid?: string;
  doctor: number;
  doctor_name?: string;
  patient_gender?: string;
  patient_age?: number;
  diagnosis: string;
  medications: string;
  instructions: string;
  follow_up_date: string | null;
  created_at: string;
}

export interface CreatePrescriptionData {
  appointment: number;
  diagnosis: string;
  medications: string;
  instructions: string;
  follow_up_date?: string | null;
  bed_required?: boolean;
  expected_bed_days?: number;
}

export interface MedicalHistory {
  id: number;
  patient: number;
  patient_name?: string;
  doctor: number;
  doctor_name?: string;
  visit_date: string;
  diagnosis: string;
  treatment: string;
  created_at: string;
}

export interface CreateHistoryData {
  patient: number;
  visit_date: string;
  diagnosis: string;
  treatment: string;
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

export const recordService = {
  async getAll(): Promise<Prescription[]> {
    const response = await api.get('/records/prescriptions/');
    return extractResults(response.data);
  },

  async getById(id: number): Promise<Prescription> {
    const response = await api.get(`/records/prescriptions/${id}/`);
    return response.data;
  },

  async create(data: CreatePrescriptionData): Promise<Prescription> {
    const response = await api.post('/records/prescriptions/', data);
    return response.data;
  },

  async getMyPrescriptions(): Promise<Prescription[]> {
    const response = await api.get('/records/prescriptions/my_prescriptions/');
    return extractResults(response.data);
  },

  async getPatientHistory(patientId: number): Promise<Prescription[]> {
    const response = await api.get(`/records/prescriptions/patient_history/?patient_id=${patientId}`);
    return extractResults(response.data);
  },

  async getHistory(): Promise<MedicalHistory[]> {
    const response = await api.get('/records/history/');
    return extractResults(response.data);
  },

  async createHistory(data: CreateHistoryData): Promise<MedicalHistory> {
    const response = await api.post('/records/history/', data);
    return response.data;
  },
};
