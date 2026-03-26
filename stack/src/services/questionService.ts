// services/questionService.ts

import axios, { AxiosError } from 'axios';
import { QuestionResponse, ApiError } from '../types/subscription';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface CreateQuestionData {
  title: string;
  body: string;
  tags: string[];
}

/**
 * Create a new question
 */
export const createQuestion = async (
  questionData: CreateQuestionData
): Promise<QuestionResponse> => {
  try {
    const response = await apiClient.post<QuestionResponse>('/questions/ask', questionData);
    return response.data;
  } catch (error) {
    throw handleApiError(error);
  }
};

const handleApiError = (error: unknown): Error => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    if (axiosError.response?.data) {
      return new Error(axiosError.response.data.message || 'An error occurred');
    }
    return new Error(axiosError.message || 'Network error');
  }
  return new Error('An unexpected error occurred');
};

export default {
  createQuestion,
};