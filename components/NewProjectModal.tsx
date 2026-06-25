import React, { useState, useRef, useEffect } from 'react';
import { User, Role, Project, ProjectStatus, ProjectType, ProjectCategory, ProjectPackage, ProjectDocument } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { X, Calendar, IndianRupee, Image as ImageIcon, Loader, Upload, Trash2, ChevronRight, Zap, Layers, Users, FileText } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useProjectCrud } from '../hooks/useCrud';
import { storage } from '../services/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { createDocument, logTimelineEvent } from '../services/projectDetailsService';
import { formatDateToIndian, formatIndianToISO } from '../utils/taskUtils';
import { useUnsavedChanges } from '../hooks/useUnsavedChanges';
import { getPackages } from '../services/packageService';
import { Package } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface NewProjectModalProps {
  users: User[];
  onClose: () => void;
  onSave: (project: Project) => void;
  initialProject?: Project | null;
  selectedFirmId?: string | null;
}

type TabType = 'basic' | 'designers' | 'client' | 'media';

const NewProjectModal: React.FC<NewProjectModalProps> = ({ users, onClose, onSave, initialProject }) => {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const { createNewProject, updateExistingProject } = useProjectCrud();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const isEditMode = !!initialProject;
  
  const today = new Date().toISOString().split('T')[0];
  
  const initialFormData: Partial<Project> = initialProject ? {
    name: initialProject.name,
    tenantId: initialProject.tenantId,
    status: initialProject.status,
    type: initialProject.type,
    category: initialProject.category,
    description: initialProject.description,
    packageType: initialProject.packageType,
    budget: initialProject.budget,
    discountAmount: (initialProject as any).discountAmount,
    discountPercent: (initialProject as any).discountPercent,
    startDate: initialProject.startDate,
    deadline: initialProject.deadline,
    clientId: initialProject.clientId,
    clientIds: initialProject.clientIds || [initialProject.clientId],
    leadDesignerId: initialProject.leadDesignerId,
    designerRequirements: initialProject.designerRequirements,
    requiredSkills: initialProject.requiredSkills,
    clientPreferences: initialProject.clientPreferences,
    designerAvailabilityRequirements: initialProject.designerAvailabilityRequirements
  } : {
    name: '',
    tenantId: user?.tenantId || user?.id || '',
    status: ProjectStatus.DISCOVERY,
    type: ProjectType.DESIGNING,
    category: ProjectCategory.COMMERCIAL,
    description: '',
    budget: undefined,
    startDate: today,
    deadline: today,
    clientId: '',
    clientIds: [],
    leadDesignerId: user?.role === Role.DESIGNER ? user.id : '',
    designerRequirements: '',
    requiredSkills: [],
    clientPreferences: undefined
  };
  
  const [formData, setFormData] = useState<Partial<Project>>(initialFormData);
  const [showErrors, setShowErrors] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [uploadedDocuments, setUploadedDocuments] = useState<{file: File, name: string}[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<Record<string, string>>({});
  const [newSkill, setNewSkill] = useState('');
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const { hasUnsavedChanges, resetChanges } = useUnsavedChanges(initialFormData, formData);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const hasFileChanges = coverImageFile !== null || uploadedDocuments.length > 0;

  const clients = users.filter(u => u.role === Role.CLIENT).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const designers = users.filter(u => u.role === Role.DESIGNER).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const validate = () => {
    const selectedClients = formData.clientIds && formData.clientIds.length > 0 ? formData.clientIds : (formData.clientId ? [formData.clientId] : []);
    
    if (!formData.name || !formData.startDate || !formData.deadline || selectedClients.length === 0 || !formData.leadDesignerId) {
      setShowErrors(true);
      addNotification('Validation Error', 'Please complete all required fields.', 'error');
      return false;
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.startDate || '')) {
      addNotification('Invalid Date', 'Start date must be valid.', 'error');
      return false;
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.deadline || '')) {
      addNotification('Invalid Date', 'Deadline must be valid.', 'error');
      return false;
    }
    
    const startDateObj = new Date(formData.startDate!);
    const deadlineObj = new Date(formData.deadline!);
    
    if (deadlineObj < startDateObj) {
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

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        requiredSkills: [...(prev.requiredSkills || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills?.filter((_, i) => i !== index)
    }));
  };

  const handleAddDocument = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newDocs: {file: File, name: string}[] = [];
      
      Array.from(files).forEach(file => {
        newDocs.push({ file, name: file.name });
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            setDocumentPreviews(prev => ({ ...prev, [file.name]: reader.result as string }));
          };
          reader.readAsDataURL(file);
        }
      });
      setUploadedDocuments(prev => [...prev, ...newDocs]);
      if (documentInputRef.current) documentInputRef.current.value = '';
    }
  };

  const handleRemoveDocument = (index: number) => {
    const removedDoc = uploadedDocuments[index];
    setUploadedDocuments(prev => prev.filter((_, i) => i !== index));
    if (removedDoc) {
      setDocumentPreviews(prev => {
        const next = { ...prev };
        delete next[removedDoc.name];
        return next;
      });
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
      const projectData: Partial<Project> = {
        name: formData.name!,
        clientId: selectedClients[0] || '',
        clientIds: selectedClients,
        tenantId: user?.tenantId || user?.id || '',
        leadDesignerId: formData.leadDesignerId || '',
        status: formData.status || ProjectStatus.DISCOVERY,
        type: formData.type as ProjectType,
        category: formData.category as ProjectCategory,
        startDate: formData.startDate!,
        deadline: formData.deadline!,
        budget: formData.budget ? Number(formData.budget) : 0,
        description: formData.description || '',
        designerRequirements: formData.designerRequirements || '',
        requiredSkills: formData.requiredSkills || [],
        clientPreferences: formData.clientPreferences
      };

      if (isEditMode && initialProject) {
        projectData.updatedBy = user?.id || '';
        projectData.updatedAt = new Date().toISOString();

        if (coverImageFile) {
          try {
            const timestamp = Date.now();
            const fileName = coverImageFile.name.replace(/\s+/g, '_');
            const storageRef = ref(storage, `projects/${initialProject.id}/thumbnails/${timestamp}_${fileName}`);
            await uploadBytes(storageRef, coverImageFile);
            projectData.thumbnail = await getDownloadURL(storageRef);
          } catch (error: any) {
            console.error('Cover image upload failed:', error);
            addNotification('Warning', 'Project updated but cover image upload failed.', 'warning');
          }
        }

        await updateExistingProject(initialProject.id, projectData);
        onSave({ ...initialProject, ...projectData } as Project);
        addNotification('Success', `Project "${formData.name}" updated successfully.`, 'success');
      } else {
        projectData.initialBudget = projectData.budget;
        projectData.thumbnail = '';
        projectData.tasks = [];
        projectData.financials = [];
        projectData.meetings = [];
        projectData.documents = [];
        projectData.activityLog = [{
          id: `log_${Date.now()}`,
          userId: user?.id || 'system',
          action: 'Project Created',
          details: 'Project initialized via Advanced Designer Scope',
          timestamp: new Date().toISOString(),
          type: 'creation'
        }];
        projectData.createdBy = user?.id || '';
        projectData.createdAt = new Date().toISOString();

        const projectId = await createNewProject(projectData as Omit<Project, 'id'>);
        
        logTimelineEvent(
          projectId,
          `Project Created: ${formData.name}`,
          `Project initialized by ${user?.name || 'System'}. Category: ${formData.category}. Budget: ₹${Number(formData.budget).toLocaleString()}`,
          'planned',
          formatIndianToISO(formData.startDate!),
          formatIndianToISO(formData.deadline!)
        ).catch((err: any) => console.error('Failed to log timeline:', err));
        
        let thumbnailUrl: string | undefined;
        if (coverImageFile) {
          try {
            const timestamp = Date.now();
            const fileName = coverImageFile.name.replace(/\s+/g, '_');
            const storageRef = ref(storage, `projects/${projectId}/thumbnails/${timestamp}_${fileName}`);
            await uploadBytes(storageRef, coverImageFile);
            thumbnailUrl = await getDownloadURL(storageRef);
          } catch (error: any) {
            console.error('Cover image upload failed:', error);
          }
        }

        const uploadedDocs: ProjectDocument[] = [];
        for (let i = 0; i < uploadedDocuments.length; i++) {
          const doc = uploadedDocuments[i];
          try {
            const timestamp = Date.now();
            const fileName = doc.file.name.replace(/\s+/g, '_');
            const storageRef = ref(storage, `projects/${projectId}/documents/${timestamp}_${fileName}`);
            await uploadBytes(storageRef, doc.file);
            const fileUrl = await getDownloadURL(storageRef);
            
            let docType: 'image' | 'pdf' | 'other' = 'other';
            if (doc.file.type.startsWith('image/')) docType = 'image';
            else if (doc.file.type === 'application/pdf') docType = 'pdf';
            
            const projectDoc: ProjectDocument = {
              id: `doc_${timestamp}_${i}`,
              name: doc.name || doc.file.name,
              type: docType,
              url: fileUrl,
              uploadedBy: user?.id || 'system',
              uploadDate: new Date().toISOString(),
              sharedWith: [Role.ADMIN, Role.DESIGNER, Role.CLIENT],
              approvalStatus: 'pending'
            };

            uploadedDocs.push(projectDoc);
            await createDocument(projectId, projectDoc);
          } catch (error: any) {
            console.error(`Document upload failed:`, error);
          }
        }
        
        if (thumbnailUrl || uploadedDocs.length > 0) {
          await updateExistingProject(projectId, { 
            thumbnail: thumbnailUrl, 
            documents: uploadedDocs 
          });
        }
        
        onSave({ 
          ...projectData, 
          id: projectId, 
          thumbnail: thumbnailUrl,
          documents: uploadedDocs 
        } as Project);
        addNotification('Success', `Project "${formData.name}" created successfully.`, 'success');
      }
      
      onClose();
    } catch (error: any) {
      console.error('Project operation failed:', error);
      addNotification('Error', `Failed to ${isEditMode ? 'update' : 'create'} project: ${error.message}`, 'error');
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
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{isEditMode ? 'Edit Project' : 'Create New Project'}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Advanced Designer Scope</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-gray-700 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 md:px-6 pt-4 border-b border-gray-200 sticky top-16 bg-white overflow-x-auto scrollbar-hide">
          {[
            { id: 'basic' as TabType, label: 'Basic Info', icon: Zap },
            { id: 'designers' as TabType, label: 'Designers', icon: Users },
            { id: 'client' as TabType, label: 'Client Scope', icon: FileText },
            { id: 'media' as TabType, label: 'Media', icon: ImageIcon }
          ].map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
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
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border-2 transition focus:outline-none ${
                        showErrors && !formData.name ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:border-blue-500'
                      }`}
                      placeholder="e.g., Brand Identity Redesign"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as ProjectCategory }))}
                      className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    >
                      {Object.values(ProjectCategory).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
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
                    placeholder="Project overview and key details..."
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

                {user?.role !== Role.DESIGNER && (
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
                )}

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
              </div>
            )}

            {/* Designers Tab */}
            {activeTab === 'designers' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Designer Requirements</label>
                  <textarea
                    value={formData.designerRequirements || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, designerRequirements: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder="Detailed specifications and requirements for the design work..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">Required Skills</label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                      placeholder="e.g., UI/UX Design"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.requiredSkills?.map((skill, i) => (
                      <div key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(i)}
                          className="hover:text-blue-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Availability Requirements</label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.designerAvailabilityRequirements?.fullTime || false}
                        onChange={(e) => setFormData(prev => {
                          const reqs = prev.designerAvailabilityRequirements || { fullTime: false };
                          // Create a new strict object
                          const newReqs: { fullTime: boolean; hoursPerWeek?: number; projectDuration?: string } = {
                            fullTime: Boolean(e.target.checked)
                          };
                          // Only assign optional properties if they are explicitly typed
                          if (reqs.hoursPerWeek !== undefined) newReqs.hoursPerWeek = reqs.hoursPerWeek;
                          if (reqs.projectDuration !== undefined) newReqs.projectDuration = reqs.projectDuration;
                          
                          return {
                            ...prev,
                            designerAvailabilityRequirements: newReqs
                          };
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm text-gray-700">Full-time Availability</span>
                    </label>
                    {!formData.designerAvailabilityRequirements?.fullTime && (
                      <input
                        type="number"
                        placeholder="Hours per week"
                        value={formData.designerAvailabilityRequirements?.hoursPerWeek || ''}
                        onChange={(e) => setFormData(prev => {
                          const reqs = prev.designerAvailabilityRequirements || { fullTime: false };
                          const newReqs: { fullTime: boolean; hoursPerWeek?: number; projectDuration?: string } = {
                            fullTime: reqs.fullTime
                          };
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          if (val !== undefined) newReqs.hoursPerWeek = val;
                          if (reqs.projectDuration !== undefined) newReqs.projectDuration = reqs.projectDuration;
                          
                          return {
                            ...prev,
                            designerAvailabilityRequirements: newReqs
                          };
                        })}
                        className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Client Scope Tab */}
            {activeTab === 'client' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Design Style</label>
                  <input
                    type="text"
                    value={formData.clientPreferences?.designStyle || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      clientPreferences: { ...prev.clientPreferences, designStyle: e.target.value }
                    }))}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Modern Minimal, Bold & Colorful"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={formData.clientPreferences?.targetAudience || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      clientPreferences: { ...prev.clientPreferences, targetAudience: e.target.value }
                    }))}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Young professionals, Tech enthusiasts"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Competitor References</label>
                  <textarea
                    value={formData.clientPreferences?.competitors?.join('\n') || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      clientPreferences: { 
                        ...prev.clientPreferences, 
                        competitors: e.target.value.split('\n').filter(c => c.trim())
                      }
                    }))}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:outline-none focus:border-blue-500"
                    placeholder="One URL/reference per line"
                  />
                </div>
              </div>
            )}

            {/* Media Tab */}
            {activeTab === 'media' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Project Cover Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition cursor-pointer relative overflow-hidden bg-gray-50/50">
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
                            className="p-2 bg-white rounded-full text-blue-600 hover:scale-110 transition"
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
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Click to upload image</p>
                          <p className="text-xs text-gray-500 mt-1">Recommended: 1920x1080px, Max 5MB</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Project Documents</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition cursor-pointer">
                    <input
                      type="file"
                      ref={documentInputRef}
                      onChange={handleAddDocument}
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => documentInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <Upload className="w-8 h-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Click to upload documents</p>
                        <p className="text-xs text-gray-500 mt-1">PDF, images, CAD files</p>
                      </div>
                    </button>
                  </div>

                  {uploadedDocuments.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {uploadedDocuments.map((doc, i) => (
                        <div key={i} className="group relative flex flex-col items-center p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-blue-300 transition">
                          {documentPreviews[doc.name] ? (
                            <div className="w-full aspect-square rounded-lg overflow-hidden mb-2">
                              <img src={documentPreviews[doc.name]} alt={doc.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-full aspect-square rounded-lg bg-gray-200 flex items-center justify-center mb-2">
                              <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <span className="text-[10px] font-medium text-gray-700 truncate w-full text-center px-1">{doc.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(i)}
                            className="absolute -top-2 -right-2 p-1.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-200"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button
            onClick={handleClose}
            className="px-6 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg font-medium transition disabled:opacity-50"
          >
            {isSubmitting ? <Loader className="w-4 h-4 animate-spin" /> : isEditMode ? 'Update Project' : 'Create Project'}
          </button>
        </div>
      </div>

      {showConfirmDialog && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setShowConfirmDialog(false)}
          title="Discard Changes?"
          message="You have unsaved changes. Are you sure you want to discard them?"
          onConfirm={() => {
            setShowConfirmDialog(false);
            onClose();
          }}
          onDiscard={() => setShowConfirmDialog(false)}
          confirmText="Discard"
          cancelText="Keep Editing"
        />
      )}
    </div>
  );
};

export default NewProjectModal;
