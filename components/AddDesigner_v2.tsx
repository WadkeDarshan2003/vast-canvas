import React, { useState, useRef } from 'react';
import { User, Role } from '../types';
import { X, Mail, Phone, Briefcase, Palette, Award, Link as LinkIcon, CheckCircle2, AlertCircle, ArrowRight, Camera, Trash2 } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useLoading } from '../contexts/LoadingContext';
import { createUserInFirebase } from '../services/userManagementService';
import { useAuth } from '../contexts/AuthContext';

interface AddDesignerModalProps {
  onClose: () => void;
  onSave: (user: User) => void;
  currentUser?: User | null;
}

type TabType = 'info' | 'skills' | 'availability';

const AddDesigner_v2: React.FC<AddDesignerModalProps> = ({ onClose, onSave, currentUser }) => {
  const { addNotification } = useNotifications();
  const { showLoading, hideLoading } = useLoading();
  const { adminCredentials } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [artMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [loading, setLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  
  // Advanced fields
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [availableFrom, setAvailableFrom] = useState('');
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');
  
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

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleAddCert = () => {
    if (newCert.trim() && !certifications.includes(newCert.trim())) {
      setCertifications([...certifications, newCert.trim()]);
      setNewCert('');
    }
  };

  const handleRemoveCert = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      addNotification('Validation Error', 'Please enter designer name', 'error');
      return false;
    }
    if (!phone.trim()) {
      addNotification('Validation Error', 'Please enter phone number', 'error');
      return false;
    }
    if (artMethod === 'email' && !email.trim()) {
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
    showLoading('Creating designer account...');
    try {
      const phoneDigits = phone.replace(/\D/g, '');
      const pwd = phoneDigits.slice(-6) || 'designer123';

      const userToCreate: User = {
        id: '',
        name,
        email: artMethod === 'email' ? email : '',
        role: Role.DESIGNER,
        phone: phone || undefined,
        specialty: specialty || undefined,
        password: pwd,
        authMethod: artMethod,
        avatar: photoPreview || undefined,
        yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
        hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
        portfolioUrl: portfolioUrl || undefined,
        skills: skills.length > 0 ? skills : undefined,
        certifications: certifications.length > 0 ? certifications : undefined,
        availability: {
          isAvailable,
          availableFrom: availableFrom || undefined,
          workingHours: { start: workingHoursStart, end: workingHoursEnd }
        }
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
        'Designer Created Successfully!',
        `${name} has been added to your design team.`,
        'success'
      );

      onSave(createdUser);
      onClose();
    } catch (err: any) {
      console.error('Error creating designer:', err);
      addNotification('Error', err.message || 'Failed to create designer', 'error');
    } finally {
      setLoading(false);
      hideLoading();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[400] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white shadow-2xl w-full max-w-lg max-h-[95vh] flex flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add Designer</h2>
              <p className="text-xs text-purple-100 mt-0.5">Create designer profile</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-200 sticky top-16 bg-white">
          {[
            { id: 'info' as TabType, label: 'Info', icon: Briefcase },
            { id: 'skills' as TabType, label: 'Skills & Certs', icon: Award },
            { id: 'availability' as TabType, label: 'Availability', icon: CheckCircle2 }
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleCreate} className="p-6 space-y-5">
          {/* Profile Photo (Always visible) */}
          <div className="flex flex-col items-center mb-6">
            <div
              onClick={() => photoInputRef.current?.click()}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 p-1 cursor-pointer group relative overflow-hidden"
            >
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-300 to-pink-500 flex items-center justify-center group-hover:from-purple-400 group-hover:to-pink-600 transition">
                  <Palette className="w-8 h-8 text-white" />
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
                  artMethod === method
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {method === 'email' ? <Mail className="w-4 h-4 inline mr-1" /> : <Phone className="w-4 h-4 inline mr-1" />}
                {method.charAt(0).toUpperCase() + method.slice(1)}
              </button>
            ))}
          </div>

          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Designer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Design Specialty</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g., UI/UX Design, Branding"
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                />
              </div>

              {artMethod === 'email' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="designer@example.com"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

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
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Portfolio URL</label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://portfolio.example.com"
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Experience (years)</label>
                  <input
                    type="number"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(e.target.value)}
                    placeholder="5"
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="500"
                    min="0"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Skills & Certifications Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Design Skills</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                    placeholder="e.g., Figma, Adobe XD"
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <div key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(i)}
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">Certifications</label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newCert}
                    onChange={(e) => setNewCert(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCert())}
                    placeholder="e.g., Certified UX Designer"
                    className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCert}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {certifications.map((cert, i) => (
                    <div key={i} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                      {cert}
                      <button
                        type="button"
                        onClick={() => handleRemoveCert(i)}
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Availability Tab */}
          {activeTab === 'availability' && (
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-semibold text-gray-900">Currently Available</span>
              </label>

              {!isAvailable && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Available From</label>
                  <input
                    type="date"
                    value={availableFrom}
                    onChange={(e) => setAvailableFrom(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Working Hours Start</label>
                  <input
                    type="time"
                    value={workingHoursStart}
                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Working Hours End</label>
                  <input
                    type="time"
                    value={workingHoursEnd}
                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-purple-800">Password will be auto-generated from phone number. Designer can change it after first login.</p>
          </div>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name || !phone}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Add Designer
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddDesigner_v2;
