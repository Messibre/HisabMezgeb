// API response shape matching your backend's ApiResponse class
export interface ApiResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

// Account type — Hisab Mezgeb has one shared account per shop,
// logged in by phone number, no email and no roles.
export interface Account {
  id: string;
  phoneNumber: string;
  shopName: string | null;
  createdAt: string;
}

// Auth types
export interface LoginCredentials {
  phoneNumber: string;
  password: string;
}

export interface RegisterPayload {
  phoneNumber: string;
  password: string;
  shopName?: string;
}
