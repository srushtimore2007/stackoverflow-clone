// Common API response types

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
}

export interface Question {
  _id: string;
  title: string;
  body: string;
  tags: string[];
  answer: any[];
  createdAt: string;
  updatedAt: string;
  author: {
    _id: string;
    username: string;
    email: string;
  };
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  // Add other user fields as needed
}

export interface LoginHistoryEntry {
  _id: string;
  loginTime: string;
  ip: string;
  userAgent: string;
  // Add other login history fields as needed
}
