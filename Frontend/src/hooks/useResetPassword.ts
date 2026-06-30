import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';

export const useResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy email mặc định từ query parameters
  const getUrlEmail = (): string => {
    const params = new URLSearchParams(location.search);
    return params.get('email') || '';
  };

  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [resetToken, setResetToken] = useState<string>(''); // Token xác thực tạm thời từ bước 2
  
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const defaultEmail = getUrlEmail();
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [location.search]);

  // Bộ lọc bảo mật độ mạnh của mật khẩu mới
  const strength = useMemo(() => {
    const val = newPassword;
    let score = 0;

    const requirements = {
      length: val.length >= 8,
      specialOrNumber: /[!@#$%^&*(),.?":{}|<>0-9]/.test(val),
      uppercase: /[A-Z]/.test(val),
      long: val.length > 12,
    };

    if (requirements.length) score++;
    if (requirements.specialOrNumber) score++;
    if (requirements.uppercase) score++;
    if (requirements.long) score++;

    const labels = ['Yêu cầu thêm', 'Trung bình', 'Mạnh', 'Bảo mật cao'];
    const colors = ['weak', 'fair', 'strong', 'secure'];

    return {
      score,
      requirements,
      label: val.length > 0 ? labels[score - 1] : 'Hãy nhập mật khẩu',
      colorClass: val.length > 0 ? colors[score - 1] : '',
    };
  }, [newPassword]);

  // Bước 2: Xác nhận mã OTP để nhận resetToken
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      Swal.fire('Lỗi', 'Vui lòng cung cấp địa chỉ Email.', 'warning');
      return;
    }
    if (!otp || otp.length !== 6) {
      Swal.fire('Lỗi', 'Vui lòng nhập đúng 6 chữ số mã OTP.', 'warning');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await AuthService.verifyResetOtp({ email, otp });
      if (response.success && response.data?.resetToken) {
        setResetToken(response.data.resetToken);
        setStatus('idle');
        Swal.fire({
          icon: 'success',
          title: 'Xác thực OTP thành công',
          text: 'Mã OTP chính xác. Vui lòng thiết lập mật khẩu mới bên dưới.',
          timer: 1500,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
      setMessage(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Xác thực thất bại',
        text: errorMsg,
        confirmButtonText: 'Thử lại',
      });
    }
  };

  // Bước 3: Gửi Token và Mật khẩu mới để cập nhật DB
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      Swal.fire('Lỗi', 'Không tìm thấy Token xác minh. Vui lòng thực hiện lại bước xác thực OTP.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      Swal.fire('Mật khẩu không khớp', 'Mật khẩu xác nhận phải giống mật khẩu mới.', 'warning');
      return;
    }
    if (newPassword.length < 6) {
      Swal.fire('Mật khẩu yếu', 'Mật khẩu mới phải dài ít nhất 6 ký tự.', 'warning');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await AuthService.resetPassword({
        resetToken,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        setStatus('success');
        setMessage(response.message || 'Mật khẩu của bạn đã được cập nhật thành công.');
        
        await Swal.fire({
          icon: 'success',
          title: 'Khôi phục mật khẩu thành công',
          text: 'Mật khẩu mới đã được cập nhật! Hệ thống đang chuyển về trang Đăng nhập.',
          timer: 2000,
          showConfirmButton: false,
        });

        navigate('/login');
      }
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.response?.data?.message || 'Thiết lập mật khẩu thất bại. Token có thể đã hết hạn.';
      setMessage(errorMsg);
      Swal.fire({
        icon: 'error',
        title: 'Khôi phục mật khẩu thất bại',
        text: errorMsg,
        confirmButtonText: 'Thử lại',
      });
    }
  };

  return {
    email, setEmail,
    otp, setOtp,
    resetToken,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showNewPassword, setShowNewPassword,
    showConfirmPassword, setShowConfirmPassword,
    status,
    message,
    focusedField, setFocusedField,
    strength,
    handleVerifyOtp,
    handleResetPassword,
  };
};
