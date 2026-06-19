import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createUserInFirebase, updateUserInFirebase } from '../services/userManagementService';
import { Role, User } from '../types';
import { Mail, Phone, ArrowRight, User as UserIcon, Lock, ShieldCheck, Zap, LayoutDashboard, CheckCircle2, Camera } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useLoading } from '../contexts/LoadingContext';

const CreateAdmin: React.FC = () => {
  const { user: currentUser, adminCredentials } = useAuth();
  const { addNotification } = useNotifications();
  const { showLoading, hideLoading } = useLoading();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  
  // Profile photo upload
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        addNotification('File Size Error', 'Photo must be less than 5MB', 'error');
        return;
      }
      if (!file.type.startsWith('image/')) {
        addNotification('File Type Error', 'Please upload an image file', 'error');
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return addNotification('Validation Error', 'Please enter a name', 'error');
    if (!phone) return addNotification('Validation Error', 'Please enter a phone number', 'error');
    if (authMethod === 'email' && !email) return addNotification('Validation Error', 'Please enter an email', 'error');

    setLoading(true);
    showLoading('Creating admin...');
    try {
      // Generate password from last 6 digits of phone (used as default password)
      const phoneDigits = (phone || '').replace(/\D/g, '');
      const generatedPassword = (phoneDigits.slice(-6)) || 'admin123';

      // Prepare new user object
      const userToCreate: User = {
        id: '',
        name,
        email: authMethod === 'email' ? email : '',
        role: Role.ADMIN,
        phone: phone || undefined,
        password: generatedPassword,
        authMethod: authMethod,
        avatar: photoPreview || undefined, // Use profile photo as avatar
      } as User;

      userToCreate.tenantId = 'vast-canvas';

      console.log('👤 Admin account prepared:', {
        name,
        email,
        phone,
        hasProfilePhoto: !!photoPreview,
      });

      // Create user
      const uid = await createUserInFirebase(userToCreate, currentUser?.email, adminCredentials?.password);

      // Success notification with enhanced message
      addNotification(
        'Admin Created Successfully!', 
        `Account created for ${name}. Password: last 6 digits of ${phone}. Redirecting to login...`, 
        'success'
      );
      
      // Clear form
      setName(''); setEmail(''); setPhone('');
      setProfilePhoto(null); setPhotoPreview('');
      
      // Auto-redirect to login page after 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error('Error creating admin:', err);
      addNotification('Error', err.message || 'Failed to create admin', 'error');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="min-h-screen flex relative overflow-hidden animated-gradient px-4 py-8 md:p-0">
      {/* Mesh gradient is handled globally by .animated-gradient in index.css */}

      {/* Left Side - Animated Background with Branding (50% width on desktop) */}
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
            Empower your team with professional-grade tools and seamless collaboration.
          </p>
          <div className="space-y-4 mt-8 text-left max-w-xs mx-auto">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-sm text-white">Enterprise Security</h3>
                <p className="text-xs text-gray-400">Military-grade encryption for your data</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Zap className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-sm text-white">Instant Deployment</h3>
                <p className="text-xs text-gray-400">Launch your workflow in seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Admin Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-4 md:p-8 relative z-10 overflow-y-auto">
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

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Join the Platform</h2>
            <p className="text-gray-400 text-sm">Create your administrator account below.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleCreate} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input 
                  placeholder="Enter your full name" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none transition-all glass-input"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="tel" 
                  placeholder="Enter your contact number" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none transition-all glass-input"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5 px-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                Your last 6 digits will be your initial password
              </p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl focus:outline-none transition-all glass-input"
                />
              </div>
            </div>

            {/* Auth Method Tabs */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-300 mb-3">Login Preference</label>
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setAuthMethod('email')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    authMethod === 'email'
                      ? 'tab-active'
                      : 'tab-inactive'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email OTP
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod('phone')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
                    authMethod === 'phone'
                      ? 'tab-active'
                      : 'tab-inactive'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  Phone OTP
                </button>
              </div>
            </div>

            {/* Profile Photo Section */}
            <div className="pt-4 border-t border-white/10">
              <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Profile Photo (Optional)
              </h3>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all file:mr-3 file:py-1 file:px-3 file:border-0 file:text-[10px] file:bg-white file:text-black file:rounded-lg file:font-bold hover:file:bg-gray-200"
                  />
                </div>
                {photoPreview && (
                  <div className="w-12 h-12 border-2 border-white/30 rounded-full overflow-hidden flex-shrink-0 bg-white/5 shadow-inner">
                    <img src={photoPreview} alt="Photo preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full primary-button py-3 rounded-xl flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Admin Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <div className="text-center mt-4">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <a href="/" className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 decoration-blue-400/30">
                  Sign In
                </a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAdmin;
