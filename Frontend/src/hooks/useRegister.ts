import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';

export const useRegister = (onRegisterSuccess?: () => void) => {
  const navigate = useNavigate();
  
  // States cho Form Đăng ký thông tin
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // States cho Luồng OTP
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // States hỗ trợ UI
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  // Đếm ngược thời gian resend OTP
  useEffect(() => {
    let timer: any;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Tạo hiệu ứng sóng nước (Ripple Effect) khi bấm nút
  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRipple = { id: Date.now(), x, y };

    setRipples((prev) => [...prev, newRipple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 700);
  };

  // Xử lý gửi thông tin Đăng ký (Yêu cầu gửi OTP)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      Swal.fire({
        icon: 'warning',
        title: 'Mật khẩu không khớp',
        text: 'Vui lòng kiểm tra lại mật khẩu xác nhận.',
        confirmButtonText: 'Đóng',
      });
      return;
    }

    if (!agreeTerms) {
      setErrorMsg('Bạn phải đồng ý với Điều khoản và Chính sách.');
      Swal.fire({
        icon: 'warning',
        title: 'Chưa đồng ý điều khoản',
        text: 'Vui lòng tích chọn đồng ý điều khoản dịch vụ để tiếp tục.',
        confirmButtonText: 'Đóng',
      });
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const result = await AuthService.registerRequest({ username, email, password });
      if (result.success) {
        setStatus('idle');
        setIsOtpStep(true);
        setResendCountdown(60); // Đếm ngược 60s
        
        Swal.fire({
          icon: 'info',
          title: 'Xác thực Gmail',
          text: 'Mã xác thực OTP đã được gửi về hòm thư Gmail của bạn. Vui lòng kiểm tra và điền mã xác thực.',
          confirmButtonText: 'Đồng ý',
        });
      }
    } catch (err: any) {
      setStatus('idle');
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu đăng ký.';
      setErrorMsg(msg);
      Swal.fire({ icon: 'error', title: 'Yêu cầu thất bại', text: msg, confirmButtonText: 'Thử lại' });
    }
  };

  // Xử lý xác thực OTP Đăng ký
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status !== 'idle') return;
    if (otpCode.length !== 6) {
      setErrorMsg('Mã OTP phải chứa đúng 6 chữ số.');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const result = await AuthService.registerVerify({ email, otp: otpCode });
      if (result.success) {
        setStatus('success');
        await Swal.fire({
          icon: 'success',
          title: 'Đăng ký thành công',
          text: 'Tài khoản của bạn đã được kích hoạt thành công!',
          timer: 1500,
          showConfirmButton: false,
        });

        if (onRegisterSuccess) {
          onRegisterSuccess();
        } else {
          navigate('/login');
        }
      }
    } catch (err: any) {
      setStatus('idle');
      const msg = err.response?.data?.message || 'Mã xác thực OTP không đúng hoặc đã hết hạn.';
      setErrorMsg(msg);
      Swal.fire({ icon: 'error', title: 'Xác thực thất bại', text: msg, confirmButtonText: 'Thử lại' });
    }
  };

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;

    setErrorMsg('');
    try {
      const result = await AuthService.registerRequest({ username, email, password });
      if (result.success) {
        setResendCountdown(60);
        Swal.fire({
          icon: 'success',
          title: 'Đã gửi lại mã',
          text: 'Mã xác thực OTP mới đã được gửi về Gmail của bạn.',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gửi lại OTP thất bại.';
      setErrorMsg(msg);
    }
  };

  return {
    username, setUsername,
    email, setEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    agreeTerms, setAgreeTerms,
    isOtpStep, setIsOtpStep,
    otpCode, setOtpCode,
    resendCountdown,
    status,
    errorMsg,
    focusedField, setFocusedField,
    ripples,
    handleButtonClick,
    handleRegisterSubmit,
    handleVerifyOtpSubmit,
    handleResendOtp
  };
};
