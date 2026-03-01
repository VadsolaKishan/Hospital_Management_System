import api from './api';

export interface Ward {
    id: number;
    name: string;
    ward_type: string;
    floor_number: string;
    description: string;
    total_beds: number;
    available_beds: number;
}

export interface Bed {
    id: number;
    ward: number;
    ward_name: string;
    bed_number: string;
    bed_type: 'STANDARD' | 'ADJUSTABLE' | 'ICU' | 'VENTILATOR' | 'PEDIATRIC';
    price_per_day: number;
    status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING';
    is_active: boolean;
    current_allocation?: BedAllocation;
}

export interface BedAllocation {
    id: number;
    bed: number;
    bed_details?: string;
    patient: number;
    patient_name?: string;
    patient_uhid?: string;
    patient_details?: any;
    admission_date: string;
    discharge_date: string | null;
    reason: string;
    status: 'ACTIVE' | 'DISCHARGED';
    payment_status: 'PENDING' | 'PAID';
    notes: string;
}

export interface BedRequest {
    id: number;
    patient: number;
    patient_name: string;
    doctor: number;
    doctor_name: string;
    appointment: number;
    expected_bed_days: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
    updated_at: string;
}

export const bedService = {
    // Wards
    getWards: async () => {
        const response = await api.get('/beds/wards/');
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },

    createWard: async (data: Partial<Ward>) => {
        const response = await api.post('/beds/wards/', data);
        return response.data;
    },

    updateWard: async (id: number, data: Partial<Ward>) => {
        const response = await api.patch(`/beds/wards/${id}/`, data);
        return response.data;
    },

    deleteWard: async (id: number) => {
        const response = await api.delete(`/beds/wards/${id}/`);
        return response.data;
    },

    // Beds
    getBeds: async (params?: any) => {
        const response = await api.get('/beds/beds/', { params });
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },

    getBedById: async (id: number) => {
        const response = await api.get(`/beds/beds/${id}/`);
        return response.data;
    },

    createBed: async (data: Partial<Bed>) => {
        const response = await api.post('/beds/beds/', data);
        return response.data;
    },

    updateBed: async (id: number, data: any) => {
        const response = await api.patch(`/beds/beds/${id}/`, data);
        return response.data;
    },

    deleteBed: async (id: number) => {
        const response = await api.delete(`/beds/beds/${id}/`);
        return response.data;
    },

    // Allocations
    getAllocations: async (params?: any) => {
        const response = await api.get('/beds/allocations/', { params });
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },

    admitPatient: async (data: Partial<BedAllocation>) => {
        const response = await api.post('/beds/allocations/', data);
        return response.data;
    },

    dischargePatient: async (allocationId: number, discharge_date: string) => {
        const response = await api.post(`/beds/allocations/${allocationId}/discharge/`, { discharge_date });
        return response.data;
    },

    // Bed Requests
    getBedRequests: async (params?: any) => {
        const response = await api.get('/beds/requests/', { params });
        return Array.isArray(response.data) ? response.data : response.data.results || [];
    },

    updateBedRequest: async (id: number, data: Partial<BedRequest>) => {
        const response = await api.patch(`/beds/requests/${id}/`, data);
        return response.data;
    },
};
