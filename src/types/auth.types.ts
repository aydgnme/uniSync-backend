export interface RequestUser {
  userId: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  matriculationNumber?: string;
}

export interface JWTPayload {
  tokenType: string;
  user: RequestUser;
  iat?: number;
  exp?: number;
} 