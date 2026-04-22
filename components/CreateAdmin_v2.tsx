import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createUserInFirebase } from '../services/userManagementService';
import { Role, User } from '../types';
import { Mail, Phone, User as UserIcon, Lock, Shield, ArrowRight, CheckCircle2, Camera, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useLoading } from '../contexts/LoadingContext';

const CreateAdmin_v2: React.FC = () => {
  const { user: currentUser, adminCredentials } = useAuth();
  const { addNotification } = useNotifications();
  const { showLoading, hideLoading } = useLoading();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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

  const validateForm = (): boolean => {
    if (!name.trim()) {
      addNotification('Validation Error', 'Please enter admin name', 'error');
      return false;
    }
    if (!phone.trim()) {
      addNotification('Validation Error', 'Please enter phone number', 'error');
      return false;
    }
    if (authMethod === 'email' && !email.trim()) {
      addNotification('Validation Error', 'Please enter email address', 'error');
      return false;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addNotification('Validation Error', 'Please enter a valid email address', 'error');
      return false;
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    showLoading('Creating admin account...');
    try {
      const phoneDigits = (phone || '').replace(/\D/g, '');
      const pwd = (phoneDigits.slice(-6)) || 'admin123';
      setGeneratedPassword(pwd);

      const userToCreate: User = {
        id: '',
        name,
        email: authMethod === 'email' ? email : '',
        role: Role.ADMIN,
        phone: phone || undefined,
        password: pwd,
        authMethod: authMethod,
        avatar: photoPreview || undefined,
      } as User;

      if (currentUser && currentUser.tenantId) {
        userToCreate.tenantId = currentUser.tenantId;
      }

      console.log('👤 Admin account prepared:', {
        name,
        email,
        phone,
        hasProfilePhoto: !!photoPreview,
      });

      const uid = await createUserInFirebase(userToCreate, currentUser?.email, adminCredentials?.password);

      addNotification(
        'Admin Created Successfully!',
        `Account created for ${name}. Password: last 6 digits of ${phone}`,
        'success'
      );

      // Clear form
      setName('');
      setEmail('');
      setPhone('');
      setProfilePhoto(null);
      setPhotoPreview('');
      setGeneratedPassword('');

    } catch (err: any) {
      console.error('Error creating admin:', err);
      addNotification('Error', err.message || 'Failed to create admin', 'error');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="min-h-screen animated-gradient p-4 md:p-8 relative overflow-hidden">
      {/* Mesh gradient is handled globally by .animated-gradient in index.css */}

      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 bg-white/5 border border-white/10 backdrop-blur-md rounded-full">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-blue-300">Admin Management</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">Create New Admin</h1>
          <p className="text-lg text-gray-400">Set up a new admin account for your studio.</p>
        </div>

        {/* Main Card */}
        <div className="glass-card shadow-2xl p-6 md:p-10 rounded-3xl relative overflow-hidden">
          <form onSubmit={handleCreate} className="space-y-8 relative z-10">
            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center mb-10">
              <div className="relative mb-6">
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="w-32 h-32 rounded-full bg-white/10 p-1 cursor-pointer group relative overflow-hidden border border-white/20 shadow-2xl"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition">
                      <UserIcon className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-400">Professional Profile Photo</p>
            </div>

            {/* Auth Method Toggle */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-2xl border border-white/10">
              {(['email', 'phone'] as const).map(method => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setAuthMethod(method)}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                    authMethod === method
                      ? 'tab-active shadow-xl translate-y-[-1px]'
                      : 'tab-inactive hover:bg-white/5'
                  }`}
                >
                  {method === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  {method.charAt(0).toUpperCase() + method.slice(1)} Verification
                </button>
              ))}
            </div>

            {/* Form Fields Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-300 mb-2 px-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-12 pr-4 py-3.5 glass-input rounded-xl focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2 px-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="Enter contact number"
                    maxLength={10}
                    className="w-full pl-12 pr-4 py-3.5 glass-input rounded-xl focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Email (if email auth selected) */}
              {authMethod === 'email' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2 px-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="w-full pl-12 pr-4 py-3.5 glass-input rounded-xl focus:outline-none transition"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Info Alerts */}
            <div className="space-y-3">
              {phone && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-300">Generated Password</p>
                    <p className="text-sm text-gray-400">Temporary password: <span className="font-mono font-bold text-white">{phone.slice(-6).padStart(6, '*')}</span></p>
                  </div>
                </div>
              )}

              {generatedPassword && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-start gap-3 backdrop-blur-sm animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-300">Account Created!</p>
                    <p className="text-sm text-gray-400">Secure Password: <span className="font-mono font-bold text-white">{generatedPassword}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !name || !phone}
              className="w-full py-4 primary-button rounded-xl flex items-center justify-center gap-2 group mt-4 px-1"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Finalize Admin Setup
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Benefits Section */}
        <div className="grid md:grid-cols-3 gap-4 mt-8 px-2">
          {[
            { icon: Shield, title: 'Secure', desc: 'Encrypted Vault' },
            { icon: UserIcon, title: 'Simple', desc: 'Auto-Credentials' },
            { icon: CheckCircle2, title: 'Fast', desc: 'Instant Access' }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-sm hover:border-blue-500/30 transition">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs">{feature.title}</h3>
                  <p className="text-[10px] text-gray-400">{feature.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CreateAdmin_v2;
