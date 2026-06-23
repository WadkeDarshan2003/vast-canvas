import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Role } from '../types';
import { Lock, ArrowRight, Phone, Mail } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import Loader from './Loader';
import { useLoading } from '../contexts/LoadingContext';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { getUser, claimPhoneUserProfile, createUser } from '../services/firebaseService';
import { setupPhoneAuthentication, verifyPhoneOTP, loginWithEmail, loginWithGoogle, assessRecaptchaEnterprise } from '../services/authService';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';
import { createDeviceInfo, saveDeviceToLocal } from '../utils/deviceUtils';
import CreateAdmin from './CreateAdmin';

interface LoginProps {
  users?: User[];
}

const Login: React.FC<LoginProps> = ({ users = [] }) => {
  const { login, setAdminCredentials } = useAuth();
  const { addNotification } = useNotifications();
  const { showLoading, hideLoading } = useLoading();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [rememberDevice, setRememberDevice] = useState(true);

  const openParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('open') : null;

  // If the URL explicitly requests admin creation, show that page (public creation for first admin)
  if (openParam === 'admins') {
    return <CreateAdmin />;
  }

  const handleFirebaseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError('');

    if (!email || !password) {
      addNotification('Validation Error', 'Please fill in all required fields.', 'error');
      return;
    }

    setLoading(true);
    showLoading('Signing in...');
    try {
      // Sign in with Firebase using the authService function
      // This ensures token refresh with updated custom claims
      const authResult = await loginWithEmail(email, password);
      
      // Store admin credentials for creating new users without logout
      if (process.env.NODE_ENV !== 'production') console.log(`🔐 Storing admin credentials: ${email}`);
      setAdminCredentials({ email, password });
      
      // Also store in sessionStorage as backup
      sessionStorage.setItem('adminEmail', email);
      sessionStorage.setItem('adminPassword', password);
      if (process.env.NODE_ENV !== 'production') console.log(`💾 Admin credentials stored in sessionStorage`);
      
      // Try to fetch user profile from Firestore
      let userProfile = null;
      try {
        userProfile = await getUser(authResult.uid);
      } catch (error) {
        console.warn('Could not fetch user profile:', error);
      }
      
      // If no profile found, deny login
      if (!userProfile) {
        const errorMsg = 'Account not found. Please contact your administrator to set up your account.';
        setError(errorMsg);
        addNotification('Account Not Found', errorMsg, 'error');
        await signOut(auth); // Sign out immediately
        setLoading(false);
        hideLoading();
        return;
      }
      
      // Store device info if "Remember Device" is checked
      if (rememberDevice) {
        const deviceInfo = createDeviceInfo();
        saveDeviceToLocal(deviceInfo);
        if (process.env.NODE_ENV !== 'production') {
          console.log('📱 Device remembered:', deviceInfo);
        }
        addNotification('Device Remembered', `This device will be remembered for 30 days`, 'success');
      }
      
      login(userProfile);
      setError('');
      
      // Reload immediately with fresh tenant data and cleared cache
      window.location.href = '/';
    } catch (err: any) {
      console.error('Firebase login error:', err);
      
      let errorMessage = 'Invalid credentials.';
      if (err.code === 'auth/user-not-found') {
        errorMessage = 'Email not found.';
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      }
      
      setError(errorMessage);
      addNotification('Login Failed', errorMessage, 'error');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };



  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError('');

    if (!phone) {
      addNotification('Validation Error', 'Please enter your phone number.', 'error');
      return;
    }

    setLoading(true);
    showLoading('Sending OTP...');
    try {
      // Robust E.164 phone number formatting
      const clean = phone.trim();
      let formattedPhone = '';
      
      if (clean.startsWith('+')) {
        let digits = clean.replace(/\D/g, '');
        if (digits.startsWith('9191') && digits.length > 12) {
          digits = digits.substring(2);
        }
        formattedPhone = '+' + digits;
      } else {
        const digits = clean.replace(/\D/g, '');
        if (digits.startsWith('91') && digits.length > 10) {
          formattedPhone = `+${digits}`;
        } else {
          formattedPhone = `+91${digits}`;
        }
      }

      console.log('📱 Formatting final phone number for Firebase:', formattedPhone);

      // IMPORTANT: Hide the loading overlay BEFORE calling setupPhoneAuthentication
      // so the reCAPTCHA challenge is visible to the user
      hideLoading();
      
      const result = await setupPhoneAuthentication(formattedPhone, 'recaptcha-container');
      setConfirmationResult(result);
      setOtpSent(true);
      addNotification('Success', 'OTP sent to your phone number.', 'success');
      setError('');
    } catch (err: any) {
      console.error('Phone OTP error:', err);
      let errorMessage = err.code ? getFirebaseErrorMessage(err.code) : (err.message || 'An unexpected error occurred. Please try again.');
      // Special handling for too many attempts
      if (err.code === 'auth/too-many-requests') {
        errorMessage += ' You have reached the maximum number of attempts. Please wait a few minutes before trying again.';
      }
      setError(errorMessage);
      addNotification('Error', errorMessage, 'error');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);
    setError('');

    if (!otp) {
      addNotification('Validation Error', 'Please enter the OTP.', 'error');
      return;
    }

    setLoading(true);
    showLoading('Verifying OTP...');
    try {
      const authResult = await verifyPhoneOTP(confirmationResult, otp);
      
      // Try to fetch user profile from Firestore
      let userProfile = null;
      try {
        userProfile = await getUser(authResult.uid);
        
        // If not found by UID, try to claim a phone placeholder profile
        if (!userProfile && authResult.phoneNumber) {
          userProfile = await claimPhoneUserProfile(authResult.uid, authResult.phoneNumber);
        }
      } catch (error) {
        console.warn('Could not fetch user profile:', error);
      }
      
      // If no profile found, show error - vendor profiles must be created by admin
      if (!userProfile) {
        setError('User profile not found. Please contact your administrator to set up your account.');
        addNotification('Profile Not Found', 'Your profile has not been created yet. Please contact the administrator.', 'error');
        // Reset to allow resending OTP or switching methods
        setOtpSent(false);
        setOtp('');
        return;
      }
      
      login(userProfile);
      setError('');
    } catch (err: any) {
      console.error('OTP verification error:', err);
      let errorMessage = err.code ? getFirebaseErrorMessage(err.code) : (err.message || 'Verification failed. Please try again.');
      setError(errorMessage);
      addNotification('Verification Failed', errorMessage, 'error');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden animated-gradient px-4 py-8 md:p-0">
      {loading && <Loader message="Signing in..." />}
      
      {/* Mesh gradient is handled globally by .animated-gradient in index.css */}

      {/* Left Side - Branding Content (hidden on small screens) */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center p-12 relative z-10">
        <div className="max-w-md text-center">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="h-48 w-auto rounded-2xl mb-8 mx-auto shadow-2xl border border-white/10"
          >
            <source src="/Vast canvas logo animation.mp4" type="video/mp4" />
            <img src="/qt=q_95.webp" alt="Vast Canvas Logo" className="h-48 w-auto mx-auto" />
          </video>
          <h2 className="text-4xl font-bold mb-4 text-white tracking-tight">Vast Canvas Connect</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-8">
            Elevate your workflow with our all-in-one management system designed for modern teams.
          </p>
          <a 
            href="https://vastcanvas.in/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-all backdrop-blur-sm"
          >
            Explore our platform
          </a>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 relative z-10 pb-32 md:pb-0">
        <div className="w-full max-w-md glass-card p-6 md:p-8 rounded-3xl animate-fade-in relative">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-8">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="h-28 w-auto rounded-xl shadow-lg"
            >
              <source src="/Vast canvas logo animation.mp4" type="video/mp4" />
              <img src="/qt=q_95.webp" alt="Vast Canvas Logo" className="h-28 w-auto" />
            </video>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Sign In</h2>
            <p className="text-gray-400 text-sm mb-6">Welcome back! Please enter your details.</p>
          </div>

          {/* Email Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleFirebaseLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  autoComplete="email"
                  className={`w-full px-4 py-2.5 rounded-xl focus:outline-none transition-all glass-input ${attemptedSubmit && !email ? 'border-red-500/50 ring-2 ring-red-500/20' : ''}`}
                  placeholder="Enter your email address"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <input 
                  type="password" 
                  autoComplete="current-password"
                  className={`w-full px-4 py-2.5 rounded-xl focus:outline-none transition-all glass-input ${attemptedSubmit && !password ? 'border-red-500/50 ring-2 ring-red-500/20' : ''}`}
                  placeholder="Enter your secure password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={rememberDevice}
                    onChange={e => setRememberDevice(e.target.checked)}
                    disabled={loading}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
                </label>
                <a href="#" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">Forgot password?</a>
              </div>
              
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full primary-button py-3 rounded-xl flex items-center justify-center gap-2 mt-2"
              >
                {loading ? 'Processing...' : 'Sign In'} {!loading && <ArrowRight className="w-5 h-5" />}
              </button>

            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
