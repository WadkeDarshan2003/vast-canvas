import React, { useState, useRef } from 'react';
import { User, Role } from '../types';
import { X, Mail, Phone, Building2, Briefcase, CheckCircle2, AlertCircle, ArrowRight, Camera, Eye, EyeOff } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useLoading } from '../contexts/LoadingContext';
import { createUserInFirebase } from '../services/userManagementService';
import { useAuth } from '../contexts/AuthContext';

interface AddClientModalProps {
  onClose: () => void;
  onSave: (user: User) => void;
  currentUser?: User | null;
}

const AddClient_v2: React.FC<AddClientModalProps> = ({ onClose, onSave, currentUser }) => {
  const { addNotification } = useNotifications();
  const { showLoading, hideLoading } = useLoading();
  const { adminCredentials } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
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
      addNotification('Validation Error', 'Please enter client name', 'error');
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
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      addNotification('Validation Error', 'Please enter a valid phone number', 'error');
      return false;
    }
    return true;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    showLoading('Creating client account...');
    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const pwd = phoneDigits.slice(-6) || 'client123';

      const userToCreate: User = {
        id: '',
        name,
        email: authMethod === 'email' ? email : '',
        role: Role.CLIENT,
        phone: phone || undefined,
        company: company || undefined,
        password: pwd,
        authMethod: authMethod,
        avatar: photoPreview || undefined,
      } as User;

      if (currentUser && currentUser.tenantId) {
        userToCreate.tenantId = currentUser.tenantId;
      }

      const uid = await createUserInFirebase(userToCreate, currentUser?.email, adminCredentials?.password);

      const createdUser: User = {
        ...userToCreate,
        id: uid
      };

      addNotification(
        'Client Created Successfully!',
        `${name} has been added to your client list.`,
        'success'
      );

      onSave(createdUser);
      onClose();
    } catch (err: any) {
      console.error('Error creating client:', err);
      addNotification('Error', err.message || 'Failed to create client', 'error');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[400] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white shadow-2xl w-full max-w-md max-h-[95vh] flex flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Client</h2>
              <p className="text-xs text-emerald-100 mt-0.5">Create new client account</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleCreate} className="p-6 space-y-5">
          {/* Profile Photo */}
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={() => photoInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 p-1 cursor-pointer group relative overflow-hidden"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-300 to-teal-500 flex items-center justify-center group-hover:from-emerald-400 group-hover:to-teal-600 transition">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2">Click to upload photo</p>
          </div>

          {/* Auth Method Toggle */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
            {(['email', 'phone'] as const).map(method => (
              <button
                key={method}
                type="button"
                onClick={() => setAuthMethod(method)}
                className={`flex-1 py-2 px-3 rounded-md font-semibold text-sm transition ${
                  authMethod === method
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {method === 'email' ? <Mail className="w-4 h-4 inline mr-1" /> : <Phone className="w-4 h-4 inline mr-1" />}
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            ))}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Client Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter client name"
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Company */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Company</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name (optional)"
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Email */}
          {authMethod === 'email' && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit phone"
              maxLength={10}
              className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-800">Password will be auto-generated from phone number. Client can change it after first login.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name || !phone}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:shadow-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Add Client
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClient_v2;
