import api from './api';

export interface Department {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Doctor {
  id: number;
  user: number;
  user_name?: string;
  user_email?: string;
  department: number;
  department_name?: string;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  license_number: string;
  bio: string;
  is_available: boolean;
  created_at: string;
}

export interface Slot {
  id: number;
  doctor: number;
  weekday: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface CreateDoctorData {
  user: number;
  department: number;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  license_number: string;
  bio: string;
}

export interface NewDoctorData {
  email: string;
  first_name: string; 
  last_name: string;
  phone: string;
  password?: string;
  department: number;
  specialization: string;
  qualification: string;
  experience_years: number;
  consultation_fee: number;
  license_number: string;
  bio: string;
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

export const doctorService = {
  // Departments
  async getDepartments(): Promise<Department[]> {
    const response = await api.get('/doctors/departments/');
    return extractResults(response.data);
  },

  async createDepartment(data: { name: string; description: string }): Promise<Department> {
    const response = await api.post('/doctors/departments/', data);
    return response.data;
  },

  // Doctors
  async getAll(): Promise<Doctor[]> {
    const response = await api.get('/doctors/doctors/');
    return extractResults(response.data);
  },

  async getById(id: number): Promise<Doctor> {
    const response = await api.get(`/doctors/doctors/${id}/`);
    return response.data;
  },

  async create(data: CreateDoctorData): Promise<Doctor> {
    const response = await api.post('/doctors/doctors/', data);
    return response.data;
  },

  async createNewDoctor(data: NewDoctorData): Promise<any> {
    // Uses the new Admin endpoint to create both User and Doctor profile
    const response = await api.post('/accounts/users/create_doctor/', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateDoctorData>): Promise<Doctor> {
    const response = await api.put(`/doctors/doctors/${id}/`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/doctors/doctors/${id}/`);
  },

  async getAvailable(): Promise<Doctor[]> {
    const response = await api.get('/doctors/doctors/available_doctors/');
    return extractResults(response.data);
  },

  async getAvailableSlots(doctorId: number): Promise<Slot[]> {
    const response = await api.get(`/doctors/doctors/${doctorId}/available_slots/`);
    return extractResults(response.data);
  },

  async getAllSlots(doctorId?: number): Promise<Slot[]> {
    if (doctorId) {
      const response = await api.get(`/doctors/doctors/${doctorId}/all_slots/`);
      return extractResults(response.data);
    }
    const response = await api.get('/doctors/slots/');
    return extractResults(response.data);
  },

  async createSlot(data: Omit<Slot, 'id'>): Promise<Slot> {
    const response = await api.post('/doctors/slots/', data);
    return response.data;
  },
};
