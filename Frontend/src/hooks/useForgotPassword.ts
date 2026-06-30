import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';

export const useForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    setMessage('');

    try {
      const result = await AuthService.forgotPassword({ email });

      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Mã xác thực OTP đã được gửi thành công.');

        await Swal.fire({
          icon: 'success',
          title: 'Đã gửi mã OTP',
          text: 'Vui lòng kiểm tra Gmail để nhận mã OTP xác thực đặt lại mật khẩu.',
          confirmButtonText: 'Đặt lại mật khẩu',
        });

        // Chuyển hướng sang trang reset-password và truyền kèm email qua query param
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra hoặc email không tồn tại.';
      setMessage(errorMsg);

      Swal.fire({
        icon: 'error',
        title: 'Yêu cầu thất bại',
        text: errorMsg,
        confirmButtonText: 'Thử lại',
      });
    }
  };

  return {
    email,
    setEmail,
    status,
    message,
    handleSubmit,
  };
};
