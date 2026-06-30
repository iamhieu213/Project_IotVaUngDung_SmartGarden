
import api from '../utils/api';
import type { 
  RegisterDto, 
  LoginDto, 
  ForgotPasswordDto, 
  VerifyResetOtpDto, 
  ResetPasswordDto, 
  RegisterVerifyDto,
  UserResponse,
  LoginResponse
} from './auth.types';

export const AuthService = {
  // 1. Luồng đăng ký
  registerRequest: async (data: RegisterDto): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/register-request', data);
    return response.data;
  },

  registerVerify: async (data: RegisterVerifyDto): Promise<{ success: boolean; message: string; data: UserResponse }> => {
    const response = await api.post('/auth/register-verify', data);
    return response.data;
  },

  // 2. Luồng đăng nhập
  login: async (data: LoginDto): Promise<{ success: boolean; message: string; data: LoginResponse }> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // 3. Luồng khôi phục mật khẩu
  forgotPassword: async (data: ForgotPasswordDto): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/forgot-password', data);
    return response.data;
  },

  verifyResetOtp: async (data: VerifyResetOtpDto): Promise<{ success: boolean; message: string; data: { resetToken: string } }> => {
    const response = await api.post('/auth/verify-reset-otp', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordDto): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  }
};

