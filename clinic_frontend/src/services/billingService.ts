import api from './api';

export interface Bill {
  id: number;
  invoice_number: string;
  appointment: number;
  patient: number;
  patient_name?: string;
  patient_uhid?: string;
  doctor_name?: string;
  // Fee breakdown
  doctor_fee: number;
  hospital_charge: number;
  bed_charge: number;
  bed_days: number;
  bed_charge_per_day: number;
  discount_percentage: number;
  discount_amount: number;
  final_amount: number;
  case_type?: 'NEW' | 'OLD';

  total_amount: number;
  paid_amount: number;
  payment_method: string;
  payment_status: 'PENDING' | 'PAID' | 'CANCELLED';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  balance: number;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBillData {
  appointment_id: number;
  total_amount: number;
  payment_method?: string;
  notes?: string;
}

export interface BillPaymentData {
  amount: number;
  payment_method: string;
}

export interface PaymentResponse {
  success: boolean;
  payment_status: 'PENDING' | 'PAID' | 'CANCELLED';
  message: string;
  billing: Bill;
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

export const billingService = {
  async getAll(): Promise<Bill[]> {
    const response = await api.get('/billing/');
    return extractResults(response.data);
  },

  async getById(id: number): Promise<Bill> {
    const response = await api.get(`/billing/${id}/`);
    return response.data;
  },

  async create(data: CreateBillData): Promise<Bill> {
    const response = await api.post('/billing/create_from_appointment/', data);
    return response.data;
  },

  async calculateFees(appointmentId: number): Promise<any> {
    const response = await api.get(`/billing/calculate_fees/?appointment_id=${appointmentId}`);
    return response.data;
  },

  async createDirect(data: {
    appointment: number;
    total_amount: number;
    notes?: string;
  }): Promise<Bill> {
    const response = await api.post('/billing/', data);
    return response.data;
  },

  async markPaid(id: number, data: BillPaymentData): Promise<PaymentResponse> {
    const response = await api.post(`/billing/${id}/mark_paid/`, data);
    return response.data;
  },

  async cancel(id: number): Promise<Bill> {
    const response = await api.post(`/billing/${id}/cancel/`);
    return response.data;
  },

  async update(id: number, data: Partial<Bill>): Promise<Bill> {
    const response = await api.patch(`/billing/${id}/`, data);
    return response.data;
  },
};
