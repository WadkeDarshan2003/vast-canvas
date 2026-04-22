import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { Lock, ArrowRight, Phone, Mail } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import Loader from './Loader';
import { useLoading } from '../contexts/LoadingContext';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { getUser, claimPhoneUserProfile } from '../services/firebaseService';
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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    showLoading('Signing in with Google...');
    try {
      const authResult = await loginWithGoogle();
      
      let userProfile = null;
      try {
        userProfile = await getUser(authResult.uid);
      } catch (error) {
        console.warn('Could not fetch user profile:', error);
      }
      
      if (!userProfile) {
        // Ensure user does not gain access without a profile document
        const errorMsg = 'Account not found. Please contact your administrator to set up your account.';
        setError(errorMsg);
        addNotification('Account Not Found', errorMsg, 'error');
        await signOut(auth); 
        setLoading(false);
        hideLoading();
        return;
      }
      
      if (rememberDevice) {
        const deviceInfo = createDeviceInfo();
        saveDeviceToLocal(deviceInfo);
        addNotification('Device Remembered', `This device will be remembered for 30 days`, 'success');
      }
      
      login(userProfile);
      setError('');
      window.location.href = '/';
    } catch (err: any) {
      console.error('Google login error:', err);
      let errorMessage = 'Google Sign-In failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-In cancelled.';
      } else {
         errorMessage = getFirebaseErrorMessage(err.code);
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
      // Format phone number to E.164
      let formattedPhone = phone.replace(/[\s\-()]/g, '');
      if (!formattedPhone.startsWith('+')) {
        // Default to +91 if no country code provided
        formattedPhone = `+91${formattedPhone}`;
      }

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
      let errorMessage = getFirebaseErrorMessage(err.code);
      // Special handling for too many attempts
      if (err.code === 'auth/too-many-requests') {
        // Firebase does not provide remaining attempts, but we can show a lockout message
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
      let errorMessage = getFirebaseErrorMessage(err.code);
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
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 relative z-10">
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
            
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('email');
                  setOtpSent(false);
                  setError('');
                  setAttemptedSubmit(false);
                  setPhone('+91 ');
                  setOtp('');
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  loginMethod === 'email'
                    ? 'tab-active'
                    : 'tab-inactive'
                }`}
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('phone');
                  setOtpSent(false);
                  setError('');
                  setAttemptedSubmit(false);
                  setEmail('');
                  setPassword('');
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  loginMethod === 'phone'
                    ? 'tab-active'
                    : 'tab-inactive'
                }`}
              >
                <Phone className="w-4 h-4" />
                Phone
              </button>
            </div>
          </div>

          {/* Email Login Form */}
          {loginMethod === 'email' && (
            <form onSubmit={handleFirebaseLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <input 
                  type="email" 
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

              <div className="pt-2 text-center text-sm text-gray-400">
                Don't have an account? {' '}
                <a href="?open=admins" className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-4 decoration-blue-400/30">
                  Create Admin account
                </a>
              </div>
            </form>
          )}

          {/* Phone Login Form */}
          {loginMethod === 'phone' && (
            <div className="animate-fade-in">
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
                    <input 
                      type="tel" 
                      className={`w-full px-4 py-2.5 rounded-xl focus:outline-none transition-all glass-input ${attemptedSubmit && !phone ? 'border-red-500/50 ring-2 ring-red-500/20' : ''}`}
                      placeholder="Enter your mobile number"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-2">Enter your mobile number with country code</p>
                  </div>
                  <div id="recaptcha-container" className="rounded-xl overflow-hidden shadow-lg border border-white/10"></div>
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                      {error}
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full primary-button py-3 rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? 'Sending OTP...' : 'Get Security Code'} {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                      <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    <label className="block text-lg font-bold text-white mb-1">Verify Code</label>
                    <p className="text-sm text-gray-400 mb-6">We've sent a 6-digit code to {phone}</p>
                    
                    <input 
                      type="text" 
                      className="w-full px-4 py-4 rounded-2xl focus:outline-none transition-all glass-input text-center text-2xl font-bold tracking-[0.5em] placeholder:tracking-normal placeholder:text-gray-600"
                      placeholder="Code"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={loading}
                      maxLength={6}
                    />
                  </div>
                  
                  {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full primary-button py-3 rounded-xl flex items-center justify-center gap-2"
                    >
                      {loading ? 'Verifying...' : 'Submit Code'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtp('');
                        setError('');
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    >
                      Didn't receive the code? Resend
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Social Login / Divider */}
          <div className="mt-8 pt-6 border-t border-white/10 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#0b0f19] px-3 text-xs text-gray-500 font-medium tracking-wider uppercase rounded-full">
              Or continue with
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium transition-all group"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
