import React, { useState, useRef, useEffect } from 'react';
import { User, Role, Plan, ProjectStatus, ProjectPackage, ProjectDocument } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { X, Calendar, IndianRupee, Image as ImageIcon, Loader, Upload, Trash2, Zap, Layers, Users, FileText } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { usePlanCrud } from '../hooks/useCrud';
import { storage } from '../services/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatDateToIndian } from '../utils/taskUtils';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { getPackages } from '../services/packageService';
import { Package } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface NewPlanModalProps {
  users: User[];
  onClose: () => void;
  onSave: (plan: Plan) => void;
  initialPlan?: Plan | null;
}

const NewPlanModal: React.FC<NewPlanModalProps> = ({ users, onClose, onSave, initialPlan }) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { createNewPlan, updateExistingPlan } = usePlanCrud();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!initialPlan;
  
  const today = new Date().toISOString().split('T')[0];
  
  const initialFormData: Partial<Plan> = initialPlan ? {
    name: initialPlan.name,
    tenantId: initialPlan.tenantId,
    status: initialPlan.status,
    packageType: initialPlan.packageType,
    budget: initialPlan.budget,
    discountAmount: initialPlan.discountAmount,
    discountPercent: initialPlan.discountPercent,
    startDate: initialPlan.startDate,
    deadline: initialPlan.deadline,
    clientId: initialPlan.clientId,
    clientIds: initialPlan.clientIds || [initialPlan.clientId],
    leadDesignerId: initialPlan.leadDesignerId,
    description: initialPlan.description,
    creativeUsed: initialPlan.creativeUsed || 0,
    thumbnail: initialPlan.thumbnail || ''
  } : {
    name: '',
    tenantId: user?.tenantId || user?.id || '',
    status: ProjectStatus.DISCOVERY,
    packageType: ProjectPackage.PACKAGE_50,
    budget: 18000,
    discountAmount: undefined,
    discountPercent: undefined,
    startDate: today,
    deadline: today,
    clientId: '',
    clientIds: [],
    leadDesignerId: user?.role === Role.DESIGNER ? user.id : '',
    description: '',
    creativeUsed: 0,
    thumbnail: ''
  };
  
  const [formData, setFormData] = useState<Partial<Plan>>(initialFormData);
  const [showErrors, setShowErrors] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(initialPlan?.thumbnail || null);
  const [availablePackages, setAvailablePackages] = useState<Package[]>([]);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      const pkgs = await getPackages(user?.tenantId);
      setAvailablePackages(pkgs);
    };
    fetchPackages();
  }, [user?.tenantId]);

  // When a package is selected, auto-fill budget from package price (if available)
  const handlePackageSelect = (packageType?: ProjectPackage) => {
    setFormData(prev => {
      const pkg = availablePackages.find(p => p.type === packageType);
      const price = pkg?.price ?? prev.budget ?? 18000;
      return { ...prev, packageType, budget: price };
    });
  };

  // Discount helpers
  const handleDiscountPercentChange = (percent?: number) => {
    setFormData(prev => {
      const budget = Number(prev.budget) || 0;
      const discountAmount = percent && budget ? Math.round((percent / 100) * budget) : undefined;
      return { ...prev, discountPercent: percent, discountAmount };
    });
  };

  const handleDiscountAmountChange = (amount?: number) => {
    setFormData(prev => {
      const budget = Number(prev.budget) || 0;
      const discountPercent = amount && budget ? Math.round((amount / budget) * 100) : undefined;
      return { ...prev, discountAmount: amount, discountPercent };
    });
  };

  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges(initialFormData, formData);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const hasFileChanges = coverImageFile !== null;

  const clients = users.filter(u => u.role === Role.CLIENT).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const designers = users.filter(u => u.role === Role.DESIGNER).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const validate = () => {
    const selectedClients = formData.clientIds && formData.clientIds.length > 0 ? formData.clientIds : (formData.clientId ? [formData.clientId] : []);
    
    if (!formData.name || !formData.startDate || !formData.deadline || selectedClients.length === 0 || !formData.leadDesignerId || !formData.packageType) {
      setShowErrors(true);
      addNotification('Validation Error', 'Please complete all required fields.', 'error');
      return false;
    }

    if (new Date(formData.deadline!) < new Date(formData.startDate!)) {
      addNotification('Invalid Date Range', 'Deadline must be on or after start date.', 'error');
      return false;
    }
    
    return true;
  };

  const handleClose = () => {
    if (hasUnsavedChanges || hasFileChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleCoverImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification('File Size Error', 'Image must be less than 5MB', 'error');
        return;
      }
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setCoverImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const selectedClients = formData.clientIds && formData.clientIds.length > 0 ? formData.clientIds : (formData.clientId ? [formData.clientId] : []);
      
      const planData: Partial<Plan> = {
        name: formData.name!,
        clientId: selectedClients[0] || '',
        clientIds: selectedClients,
        tenantId: user?.tenantId || user?.id || '',
        leadDesignerId: formData.leadDesignerId || '',
        status: formData.status || ProjectStatus.DISCOVERY,
        packageType: formData.packageType as ProjectPackage,
        startDate: formData.startDate!,
        deadline: formData.deadline!,
        budget: formData.budget ? Number(formData.budget) : 0,
        discountAmount: formData.discountAmount !== undefined ? Number(formData.discountAmount) : undefined,
        discountPercent: formData.discountPercent !== undefined ? Number(formData.discountPercent) : undefined,
        description: formData.description || '',
        creativeUsed: formData.creativeUsed || 0,
        thumbnail: formData.thumbnail || '',
        meetings: initialPlan?.meetings || [],
        documents: initialPlan?.documents || [],
        activityLog: initialPlan?.activityLog || []
      };

      if (isEditMode && initialPlan) {
        planData.updatedBy = user?.id || '';
        planData.updatedAt = new Date().toISOString();

        if (coverImageFile) {
          try {
            const timestamp = Date.now();
            const fileName = coverImageFile.name.replace(/\s+/g, '_');
            const storageRef = ref(storage, `projects/${initialPlan.id}/thumbnails/${timestamp}_${fileName}`);
            await uploadBytes(storageRef, coverImageFile);
            planData.thumbnail = await getDownloadURL(storageRef);
          } catch (error: any) {
            console.error('Plan cover image upload failed:', error);
          }
        }

        await updateExistingPlan(initialPlan.id, planData);
        onSave({ ...initialPlan, ...planData } as Plan);
        addNotification('Success', `Plan "${formData.name}" updated successfully.`, 'success');
      } else {
        planData.initialBudget = planData.budget;
        planData.meetings = [];
        planData.documents = [];
        planData.activityLog = [{
          id: `log_${Date.now()}`,
          userId: user?.id || 'system',
          action: 'Plan Created',
          details: 'Creative Plan initialized via Plan Package overview',
          timestamp: new Date().toISOString(),
          type: 'creation'
        }];
        planData.createdBy = user?.id || '';
        planData.createdAt = new Date().toISOString();

        const planId = await createNewPlan(planData as Omit<Plan, 'id'>);
        
        let thumbnailUrl: string | undefined;
        if (coverImageFile) {
          try {
            const timestamp = Date.now();
            const fileName = coverImageFile.name.replace(/\s+/g, '_');
            const storageRef = ref(storage, `projects/${planId}/thumbnails/${timestamp}_${fileName}`);
            await uploadBytes(storageRef, coverImageFile);
            thumbnailUrl = await getDownloadURL(storageRef);
          } catch (error: any) {
            console.error('Plan cover image upload failed:', error);
          }
        }

        if (thumbnailUrl) {
          await updateExistingPlan(planId, { thumbnail: thumbnailUrl });
        }
        
        onSave({ 
          ...planData, 
          id: planId, 
          thumbnail: thumbnailUrl || '' 
        } as Plan);
        addNotification('Success', `Plan "${formData.name}" created successfully.`, 'success');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Plan operation failed:', error);
      addNotification('Error', `Failed to ${isEditMode ? 'update' : 'create'} plan: ${error.message}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[400] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white shadow-2xl w-full max-w-2xl max-h-[95vh] flex flex-col rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between border-b border-gray-700 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{isEditMode ? 'Change Client Plan' : 'Create New Plan'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Package & Creative Quota Settings</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-700 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                      showErrors && !formData.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                    }`}
                    placeholder="e.g., Acme Corp Starter Package"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Plan Package Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.packageType || ''}
                    onChange={(e) => handlePackageSelect((e.target.value as ProjectPackage) || undefined)}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                      showErrors && !formData.packageType ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                    }`}
                  >
                    {availablePackages.length > 0 ? (
                      availablePackages.map(pkg => (
                        <option key={pkg.id} value={pkg.type}>{pkg.name} ({pkg.creativeQuota} Creatives)</option>
                      ))
                    ) : (
                      [
                        { label: 'Starter Plan (20 Creatives)', value: ProjectPackage.PACKAGE_20 },
                        { label: 'Growth Plan (50 Creatives)', value: ProjectPackage.PACKAGE_50 },
                        { label: 'Business Plan (100 Creatives)', value: ProjectPackage.PACKAGE_100 },
                        { label: 'Impact Plan (200 Creatives)', value: ProjectPackage.IMPACT },
                      ].map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                  placeholder="Details of what is covered in this client's subscription..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                      showErrors && !formData.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.deadline || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                      showErrors && !formData.deadline ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Budget (₹)</label>
                  <input
                    type="number"
                    value={formData.budget || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Creative Used Quota</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.creativeUsed === undefined ? '' : formData.creativeUsed}
                    onChange={(e) => setFormData(prev => ({ ...prev, creativeUsed: e.target.value ? Number(e.target.value) : 0 }))}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Discount (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={(formData.discountPercent ?? '') as any}
                    onChange={(e) => handleDiscountPercentChange(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Discount Amount (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={(formData.discountAmount ?? '') as any}
                    onChange={(e) => handleDiscountAmountChange(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 2000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.clientId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                      showErrors && !formData.clientId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select a client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Lead Designer <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.leadDesignerId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, leadDesignerId: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                      showErrors && !formData.leadDesignerId ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select a designer</option>
                    {designers.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Plan Cover Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-pink-400 transition cursor-pointer relative overflow-hidden bg-gray-50/50">
                  <input
                    type="file"
                    ref={coverImageInputRef}
                    onChange={handleCoverImage}
                    accept="image/*"
                    className="hidden"
                  />
                  {coverImagePreview ? (
                    <div className="relative group aspect-video rounded-lg overflow-hidden">
                      <img 
                        src={coverImagePreview} 
                        alt="Cover preview" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => coverImageInputRef.current?.click()}
                          className="p-2 bg-white rounded-full text-pink-600 hover:scale-110 transition"
                        >
                          <Upload className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverImageFile(null);
                            setCoverImagePreview(null);
                          }}
                          className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverImageInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 w-full py-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-pink-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Click to upload image</p>
                        <p className="text-xs text-gray-500 mt-1">Recommended: 1920x1080px, Max 5MB</p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-lg text-sm font-semibold hover:from-pink-600 hover:to-rose-750 transition flex items-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    {isEditMode ? 'Save Changes' : 'Create Plan'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showConfirmDialog && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowConfirmDialog(false)}
          title="Unsaved Changes"
          message="You have unsaved changes. Are you sure you want to close?"
          onConfirm={() => {
            setShowConfirmDialog(false);
            onClose();
          }}
          confirmText="Yes, Close"
          cancelText="Keep Editing"
          variant="warning"
        />
      )}
    </div>
  );
};

export default NewPlanModal;
