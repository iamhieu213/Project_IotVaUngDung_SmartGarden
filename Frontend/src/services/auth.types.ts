export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface VerifyResetOtpDto {
  email: string;
  otp: string;
}

export interface ResetPasswordDto {
  resetToken: string;
  newPassword: string;
  confirmPassword: string;
}

export interface RegisterVerifyDto {
  email: string;
  otp: string;
}
