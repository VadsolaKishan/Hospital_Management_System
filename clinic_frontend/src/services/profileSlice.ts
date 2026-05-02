
import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import api from '../services/api';

export const completeProfile = createAsyncThunk(
  'auth/completeProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await api.patch('/patients/my_profile/', profileData);
      return response.data;
    } catch (error) {
       return rejectWithValue(error.response.data);
    }
  }
);
