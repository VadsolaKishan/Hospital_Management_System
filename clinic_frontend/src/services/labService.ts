import api from './api';

export interface LabTestType {
  id: number;
  test_name: string;
  description: string;
  price: number;
  created_at: string;
}

export interface LabReport {
  id: number;
  lab_request: number;
  report_file: string;
  report_file_url: string;
  notes: string;
  technician: number;
  technician_name: string;
  uploaded_at: string;
}

export interface LabRequest {
  id: number;
  patient: number;
  patient_name: string;
  patient_uhid: string;
  doctor: number;
  doctor_name: string;
  appointment: number;
  test: number;
  test_name: string;
  test_price: number;
  status: 'REQUESTED' | 'VISITED' | 'COMPLETED';
  report: LabReport | null;
  created_at: string;
}

const extractResults = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data?.results && Array.isArray(data.results)) return data.results;
  return [];
};

export const labService = {
  // Test Types
  async getTestTypes(): Promise<LabTestType[]> {
    const response = await api.get('/laboratory/test-types/');
    return extractResults(response.data);
  },

  async createTestType(data: Partial<LabTestType>): Promise<LabTestType> {
    const response = await api.post('/laboratory/test-types/', data);
    return response.data;
  },

  async updateTestType(id: number, data: Partial<LabTestType>): Promise<LabTestType> {
    const response = await api.patch(`/laboratory/test-types/${id}/`, data);
    return response.data;
  },

  async deleteTestType(id: number): Promise<void> {
    await api.delete(`/laboratory/test-types/${id}/`);
  },

  // Lab Requests
  async getRequests(): Promise<LabRequest[]> {
    const response = await api.get('/laboratory/requests/');
    return extractResults(response.data);
  },

  async markVisited(id: number): Promise<LabRequest> {
    const response = await api.post(`/laboratory/requests/${id}/mark_visited/`);
    return response.data;
  },

  async uploadReport(id: number, formData: FormData): Promise<LabRequest> {
    const response = await api.post(`/laboratory/requests/${id}/upload_report/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getPatientReports(patientId: number): Promise<LabRequest[]> {
    const response = await api.get(`/laboratory/requests/patient_reports/?patient_id=${patientId}`);
    return extractResults(response.data);
  },
};
