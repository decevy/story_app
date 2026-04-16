// src/types/common.types.ts

export interface ErrorResponse {
    error: string;
  }
  
  export interface MessageResponse {
    message: string;
  }
  
  export interface ApiError {
    message: string;
    status?: number;
  }