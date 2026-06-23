import React, { useState, useEffect } from 'react';
import {
  Palette, LogOut, Bell, X, Tag, Edit, Trash2, Building2, ChevronLeft, Clock, Layers, Settings
} from 'lucide-react';
import { FaPaintBrush, FaRegAddressCard, FaRegCompass, FaRegFolderOpen, FaUserShield } from 'react-icons/fa';
import { Project, Plan, Role, User, ProjectStatus, ProjectType, ProjectCategory, Task } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { subscribeToProjects, subscribeToUserProjects, subscribeToUsers, subscribeToDesigners, subscribeToClients, updateProject, deleteProject, subscribeToPlans, subscribeToUserPlans, updatePlan, deletePlan } from './services/firebaseService';
import { subscribeToProjectTasks } from './services/projectDetailsService';
import { requestNotificationPermission, onMessageListener } from './services/pushNotificationService';
import { AvatarCircle } from './utils/avatarUtils';
import { formatDateToIndian } from './utils/taskUtils';
import { getPackageBadgeClasses } from './utils/packageUtils';

// Components
import Dashboard from './components/Dashboard';
import ProjectDetail from './components/ProjectDetail';
import PeopleList from './components/PeopleList';
import Login from './components/Login';
import NotificationPanel from './components/NotificationPanel';
import NewProjectModal from './components/NewProjectModal';
import NewPlanModal from './components/NewPlanModal';
import ChangePlanModal from './components/ChangePlanModal';
import Loader from './components/Loader';
import RememberedDevices from './components/RememberedDevices';
import SessionExpiryWarning from './components/SessionExpiryWarning';
import BrandingSettings from './components/BrandingSettings';
import ConfirmDialog from './components/ConfirmDialog';
// import FirmSettings from './components/FirmSettings'; // COMMENTED OUT: Cross-firm support disabled
import { PageTitleUpdater } from './components/PageTitleUpdater';
import { useTenantBranding } from './hooks/useTenantBranding';
import TeamScheduler from './components/TeamScheduler';


import { calculateProjectProgress } from './utils/taskUtils';

// Helper for project list
const ProjectList = ({
  projects,
  onSelect,
  user,
  setEditingProject,
  setIsNewProjectModalOpen,
  onRequestDelete,
  realTimeTasks
}: {
  projects: Project[],
  onSelect: (p: Project) => void,
  user: User | null,
  setEditingProject: (project: Project | null) => void,
  setIsNewProjectModalOpen: (open: boolean) => void,
  onRequestDelete: (project: Project) => void,
  realTimeTasks: Map<string, Task[]>
}) => {
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});
  const getSafeTimestamp = (date: any) => {
    if (!date) return 0;
    if (typeof date === 'string') return new Date(date).getTime();
    if (date.toDate && typeof date.toDate === 'function') return date.toDate().getTime();
    return new Date(date).getTime() || 0;
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.DISCOVERY: return 'bg-teal-100 text-teal-700';
      case ProjectStatus.PLANNING: return 'bg-purple-100 text-purple-700';
      case ProjectStatus.EXECUTION: return 'bg-blue-100 text-blue-700';
      case ProjectStatus.COMPLETED: return 'bg-green-100 text-green-700';
      case ProjectStatus.ON_HOLD: return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: ProjectType) => {
    return type === ProjectType.DESIGN_SERVICE ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="space-y-8 animate-fade-in projects-surface">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => onSelect(project)}
            className="group relative cursor-pointer pt-2 pb-6 project-card"
          >
            {/* Main Architectural Image Container */}
            <div className="h-56 w-full rounded-[2rem] overflow-hidden relative shadow-md will-change-transform project-card-media">
              {imageLoading[project.id] && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse" />
              )}
              {project.thumbnail ? (
                <img
                  src={project.thumbnail}
                  alt={project.name}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoading(prev => ({ ...prev, [project.id]: false }))}
                  onLoadStart={() => setImageLoading(prev => ({ ...prev, [project.id]: true }))}
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Palette className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/10" />

              {/* Floating Badges inside Image */}
              <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
                <div className="flex gap-2 flex-wrap">
                  <div className="backdrop-blur-xl bg-white/70 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm text-slate-800 border border-white/50">
                    {project.type}
                  </div>
                  {project.packageType && (
                    <div className={`backdrop-blur-xl px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm border ${getPackageBadgeClasses(project.packageType)}`}>
                      {project.packageType}
                    </div>
                  )}
                </div>

                {/* Activity Dot */}
                {project.activityLog && project.activityLog.length > 0 && (
                  (new Date().getTime() - new Date(project.activityLog[0].timestamp).getTime()) < 86400000 && (
                    <div className="flex items-center gap-1.5 backdrop-blur-md bg-slate-900/80 px-3 py-1.5 rounded-full shadow-lg border border-white/10">
                      <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                      <span className="text-[10px] text-white font-bold tracking-widest uppercase">New</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Overlapping Glass Content Box */}
            <div className="relative z-20 mx-4 -mt-12 bg-white/90 backdrop-blur-2xl rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/60 hover:shadow-xl transition-shadow duration-300 project-card-content">
              <div className="mb-2">
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight line-clamp-1">{project.name}</h3>
              </div>

              <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{project.description}</p>

              {/* Distinct Progress Line Component */}
              <div className="mb-5">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Milestone Phase</span>
                  <span className="text-sm font-black text-slate-800">
                    {calculateProjectProgress(realTimeTasks.get(project.id) || project.tasks)}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                  <div
                    {...{ style: { width: `${calculateProjectProgress(realTimeTasks.get(project.id) || project.tasks)}%` } }}
                    className="bg-slate-800 h-full rounded-full transition-all duration-1000 ease-out"
                  />
                </div>
              </div>

              {/* Refined Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100/80">
                <div className="flex items-center gap-1">
                  {user?.role === Role.ADMIN && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProject(project);
                          setIsNewProjectModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit project"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDelete(project);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                    {formatDateToIndian(project.deadline) || 'No date'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


const PlanList = ({
  plans,
  onSelect,
  user,
  setEditingPlan,
  setIsNewPlanModalOpen,
  onRequestDelete,
  realTimeTasks
}: {
  plans: Plan[],
  onSelect: (p: Plan) => void,
  user: User | null,
  setEditingPlan: (plan: Plan | null) => void,
  setIsNewPlanModalOpen: (open: boolean) => void,
  onRequestDelete: (plan: Plan) => void,
  realTimeTasks: Map<string, Task[]>
}) => {
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({});

  const getCreativeQuota = (packageType?: string): number => {
    const normalized = (packageType || '').toLowerCase();
    if (normalized.includes('starter') || normalized.includes('package 1') || normalized.includes('20')) return 20;
    if (normalized.includes('growth') || normalized.includes('package 2') || normalized.includes('50')) return 50;
    if (normalized.includes('business') || normalized.includes('package 3') || normalized.includes('100')) return 100;
    if (normalized.includes('impact') || normalized.includes('package 4') || normalized.includes('200')) return 200;
    return 0; // custom/default
  };

  const getPackageStyles = (packageType?: string) => {
    const normalized = (packageType || '').toLowerCase();
    if (normalized.includes('starter') || normalized.includes('package 1') || normalized.includes('50')) {
      return {
        color: 'hsl(340, 82%, 55%)',
        bgColor: 'hsl(340, 82%, 97%)',
        borderColor: 'hsl(340, 82%, 90%)',
        progressColor: 'from-pink-500 to-rose-600',
      };
    } else if (normalized.includes('growth') || normalized.includes('package 2') || normalized.includes('100')) {
      return {
        color: 'hsl(16, 100%, 60%)',
        bgColor: 'hsl(16, 100%, 97%)',
        borderColor: 'hsl(16, 100%, 90%)',
        progressColor: 'from-orange-500 to-amber-600',
      };
    } else if (normalized.includes('business') || normalized.includes('package 3') || normalized.includes('200')) {
      return {
        color: 'hsl(168, 51%, 48%)',
        bgColor: 'hsl(168, 51%, 97%)',
        borderColor: 'hsl(168, 51%, 90%)',
        progressColor: 'from-teal-500 to-emerald-600',
      };
    } else {
      return {
        color: 'hsl(227, 52%, 34%)',
        bgColor: 'hsl(227, 52%, 97%)',
        borderColor: 'hsl(227, 52%, 90%)',
        progressColor: 'from-blue-700 to-indigo-800',
      };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in plans-surface">
      {plans.map(plan => {
        const totalQuota = getCreativeQuota(plan.packageType);
        const used = plan.creativeUsed || 0;
        const progressPercent = totalQuota > 0 ? Math.min(Math.round((used / totalQuota) * 100), 100) : 0;
        const styles = getPackageStyles(plan.packageType);

        return (
          <div
            key={plan.id}
            onClick={() => onSelect(plan)}
            className="group relative cursor-pointer pt-2 pb-6 project-card"
          >
            {/* Architectural Image Container */}
            <div className="h-56 w-full rounded-[2rem] overflow-hidden relative shadow-md will-change-transform project-card-media">
              {imageLoading[plan.id] && (
                <div className="absolute inset-0 bg-slate-200 animate-pulse" />
              )}
              {plan.thumbnail ? (
                <img
                  src={plan.thumbnail}
                  alt={plan.name}
                  className="w-full h-full object-cover"
                  onLoad={() => setImageLoading(prev => ({ ...prev, [plan.id]: false }))}
                  onLoadStart={() => setImageLoading(prev => ({ ...prev, [plan.id]: true }))}
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Layers className="w-12 h-12 text-slate-300" />
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/10" />

              {/* Floating Badges */}
              <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
                <div className="backdrop-blur-xl px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black shadow-sm border"
                  style={{
                    backgroundColor: styles.bgColor,
                    borderColor: styles.borderColor,
                    color: styles.color
                  }}
                >
                  {plan.packageType}
                </div>
              </div>
            </div>

            {/* Overlapping Glass Content Box */}
            <div className="relative z-20 mx-4 -mt-12 bg-white/90 backdrop-blur-2xl rounded-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-white/60 hover:shadow-xl transition-shadow duration-300 project-card-content">
              <div className="mb-2">
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight line-clamp-1">{plan.name}</h3>
              </div>

              <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">{plan.description || "No description provided."}</p>

              {/* Creative Quota Progress */}
              <div className="mb-5">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Creative Quota</span>
                  <span className="text-sm font-black text-slate-800">
                    {used}/{totalQuota} used ({progressPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    style={{ width: `${progressPercent}%` }}
                    className={`bg-gradient-to-r ${styles.progressColor} h-full rounded-full transition-all duration-1000 ease-out`}
                  />
                </div>
              </div>

              {/* Refined Footer */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-100/80">
                <div className="flex items-center gap-1">
                  {user?.role === Role.ADMIN && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlan(plan);
                          setIsNewPlanModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit plan"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRequestDelete(plan);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-[11px] uppercase tracking-wider font-bold text-slate-500">
                    {formatDateToIndian(plan.deadline) || 'No date'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};


type ViewState = 'dashboard' | 'projects' | 'plans' | 'clients' | 'designers' | 'admins' | 'settings' | 'scheduler';

function App() {
  // Lifted state to allow NotificationProvider access to projects
  const [projects, setProjects] = useState<Project[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  return (
    <AuthProvider>
      <NotificationProvider projects={projects}>
        <LoadingProvider>
          <AppContent
            projects={projects}
            setProjects={setProjects}
            plans={plans}
            setPlans={setPlans}
            users={users}
            setUsers={setUsers}
          />
        </LoadingProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

interface AppContentProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  plans: Plan[];
  setPlans: React.Dispatch<React.SetStateAction<Plan[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

function AppContent({ projects, setProjects, plans, setPlans, users, setUsers }: AppContentProps) {

  const { user, logout, updateUser, loading: authLoading, currentTenant } = useAuth();

  const adminProfileFallback = {
    name: 'Admin User',
    email: 'admin@vastcanvas.local',
    phone: '+91 9876543210'
  };

  const profileDisplayData = user && user.role === Role.ADMIN
    ? {
      ...user,
      name: user.name?.trim() || adminProfileFallback.name,
      email: user.email?.trim() || adminProfileFallback.email,
      phone: user.phone?.trim() || adminProfileFallback.phone,
    }
    : user;

  const { unreadCount, addNotification } = useNotifications();
  const { brandName, logoUrl } = useTenantBranding();

  const [currentView, setCurrentView] = useState<ViewState>(() => {
    // Default clients to Projects view, others to Dashboard
    return (user && user.role === Role.CLIENT) ? 'projects' : 'dashboard';
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskOnlyView, setIsTaskOnlyView] = useState(false);
  const [initialProjectTab, setInitialProjectTab] = useState<'discovery' | 'plan' | 'financials' | 'team' | 'timeline' | 'documents' | 'meetings' | undefined>(undefined);
  // Store pending deep-link params found on page load and apply them after projects/tasks load
  const [pendingDeepLink, setPendingDeepLink] = useState<{ projectId?: string; taskId?: string; meetingId?: string; tab?: string; open?: string } | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isDeletingPlan, setIsDeletingPlan] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  const [planToChange, setPlanToChange] = useState<Plan | null>(null);
  const [isBrandingSettingsOpen, setIsBrandingSettingsOpen] = useState(false);
  const [isEditingProfileName, setIsEditingProfileName] = useState(false);
  const [profileNameValue, setProfileNameValue] = useState('');
  const [isSavingProfileName, setIsSavingProfileName] = useState(false);
  // const [isFirmSettingsOpen, setIsFirmSettingsOpen] = useState(false); // COMMENTED OUT: Cross-firm support disabled
  const [isLoading, setIsLoading] = useState(true);
  const [realTimeTasks, setRealTimeTasks] = useState<Map<string, Task[]>>(new Map());
  const [showNotifPermissionBanner, setShowNotifPermissionBanner] = useState(false);

  // --- Project Filter State ---
  const [projectNameFilter, setProjectNameFilter] = useState('');
  const [projectCategoryFilterValue, setProjectCategoryFilterValue] = useState<ProjectCategory | 'All'>('All');
  const [projectSortBy, setProjectSortBy] = useState<'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'recent-asc' | 'recent-desc'>('recent-desc');

  // Initialize push notifications
  useEffect(() => {
    if (user) {
      // Check current permission status
      const checkPermission = async () => {
        if ('Notification' in window) {
          const permission = Notification.permission;
          if (permission === 'default') {
            // Show banner to request permission
            setShowNotifPermissionBanner(true);
          } else if (permission === 'granted') {
            // Request token
            await requestNotificationPermission(user.id);
          }
        }
      };

      checkPermission();

      onMessageListener().then((payload: any) => {
        // console.log('Received foreground message: ', payload);
        if (payload?.notification) {
          addNotification({
            title: payload.notification.title,
            message: payload.notification.body,
            type: 'info'
          });
        }
      }).catch(err => console.log('failed: ', err));
    }
  }, [user]);

  const handleEnableNotifications = async () => {
    if (user) {
      const token = await requestNotificationPermission(user.id);
      if (token) {
        setShowNotifPermissionBanner(false);
        // Test notification
        if (Notification.permission === 'granted') {
          new Notification('Notifications Enabled! 🎉', {
            body: 'You will now receive push notifications for project updates',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-192x192.png'
          });
        }
      }
    }
  };



  // Subscribe to Firebase real-time updates
  useEffect(() => {
    // Capture URL query params on load and defer applying until data is available
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const qProject = params.get('projectId') || params.get('project') || undefined;
        const qTask = params.get('taskId') || params.get('task') || undefined;
        const qMeeting = params.get('meetingId') || undefined;
        const qTab = params.get('tab') || undefined;
        const qOpen = params.get('open') || undefined;
        if (qProject || qTask || qMeeting || qTab || qOpen) {
          setPendingDeepLink({ projectId: qProject, taskId: qTask, meetingId: qMeeting, tab: qTab, open: qOpen });
        }
      }
    } catch (e) {
      // ignore URL parse errors
    }

    if (!user) return;

    setIsLoading(false); // No loading state needed, show empty immediately

    // Subscribe to projects (will be empty initially)
    let unsubscribeProjects: any;

    // Use global subscription for all roles for now to ensure visibility
    // The security rules are permissive enough to allow this, and it fixes the issue where
    // vendors couldn't see projects they were assigned to via tasks but not in vendorIds array.
    // Long term fix: Ensure vendorIds is always updated when tasks are assigned (implemented in projectDetailsService)
    // But for immediate fix for existing data, we fetch all.

    const effectiveTenantId = user.tenantId || 'vast-canvas';

    unsubscribeProjects = subscribeToProjects((firebaseProjects) => {
      setProjects(firebaseProjects || []);
    }, effectiveTenantId);

    // Subscribe to plans
    const unsubscribePlans = subscribeToPlans((firebasePlans) => {
      setPlans(firebasePlans || []);
    }, effectiveTenantId);

    // Keep references to latest lists from each subscription
    const latestUsers = { general: [] as User[], designers: [] as User[], clients: [] as User[] };

    const refreshUsers = () => {
      const map = new Map<string, User>();
      latestUsers.general.forEach(u => map.set(u.id, u));
      latestUsers.designers.forEach(u => map.set(u.id, u));
      latestUsers.clients.forEach(u => map.set(u.id, u));
      setUsers(Array.from(map.values()));
    };

    // Subscribe to users - combines from all role collections correctly without keeping deleted items
    const unsubscribeUsers = subscribeToUsers((data) => {
      latestUsers.general = data || [];
      refreshUsers();
    }, effectiveTenantId);

    // Also subscribe to role-specific collections for redundancy/updates
    const unsubscribeDesigners = subscribeToDesigners((data) => {
      latestUsers.designers = data || [];
      refreshUsers();
    }, effectiveTenantId);

    const unsubscribeClients = subscribeToClients((data) => {
      latestUsers.clients = data || [];
      refreshUsers();
    }, effectiveTenantId);

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeProjects();
      unsubscribePlans();
      unsubscribeUsers();
      unsubscribeDesigners();
      unsubscribeClients();
    };
  }, [user, setProjects, setPlans, setUsers]);

  // Apply pending deep-link after projects or realTimeTasks update
  useEffect(() => {
    if (!pendingDeepLink) return;
    const { projectId, taskId, meetingId, tab } = pendingDeepLink;
    if (!projectId) return;

    const proj = projects.find(p => p.id === projectId);
    if (proj) {
      setSelectedProject(proj);
      const normalizedTab = tab === 'meetings' ? 'discovery' : tab;
      setInitialProjectTab((normalizedTab as any) || undefined);

      if (taskId) {
        const tasks = realTimeTasks.get(projectId) || proj.tasks || [];
        const t = tasks.find(tsk => tsk.id === taskId) || null;
        if (t) {
          setSelectedTask(t);
          setIsTaskOnlyView(true);
        }
      }

      // If meetingId provided, ensure project opens with chat tab
      if (meetingId && !taskId) {
        setInitialProjectTab('discovery');
      }

      // Clear pending deep link so it doesn't re-run
      setPendingDeepLink(null);
      // Remove query params from URL so child components can also check URL if needed
      try { window.history.replaceState({}, document.title, window.location.pathname); } catch (e) { /* ignore */ }
    }
  }, [projects, realTimeTasks, pendingDeepLink]);

  // Subscribe to all project tasks for real-time updates
  useEffect(() => {
    if (projects.length === 0) return;

    const unsubscribers: Array<() => void> = [];

    projects.forEach((project) => {
      const unsubscribe = subscribeToProjectTasks(project.id, (tasks) => {
        setRealTimeTasks((prev) => new Map(prev).set(project.id, tasks));
      });
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [projects]);

  // Reset view to dashboard on login
  useEffect(() => {
    if (user) {
      // If a pending deep-link requests opening Admins, honor it after login
      try {
        const p = (pendingDeepLink as any) || {};
        if (p.open === 'admins') {
          setCurrentView('admins');
        } else {
          // Send clients directly to Projects, other roles to Dashboard
          setCurrentView(user.role === Role.CLIENT ? 'projects' : 'dashboard');
        }
      } catch (e) {
        setCurrentView(user.role === Role.CLIENT ? 'projects' : 'dashboard');
      }
      setSelectedProject(null);
    }
  }, [user]);

  // Sync selectedProject with real-time updates
  useEffect(() => {
    if (selectedProject) {
      const updated = projects.find(p => p.id === selectedProject.id);
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedProject)) {
        setSelectedProject(updated);
      }
    }
  }, [projects, selectedProject]);

  // If not logged in, show login screen or home page
  if (!user) {
    return <Login users={users} />;
  }

  // Permission Logic for Views
  const canSeeProjects = true; // All roles can see some form of projects
  const canSeeClients = user.role === Role.ADMIN || user.role === Role.DESIGNER;
  const canSeeDesigners = user.role === Role.ADMIN;
  const canSeeAdmins = user.role === Role.ADMIN;

  // Handlers
  const handleUpdateProject = (updated: Project) => {
    const isPlan = plans.some(p => p.id === updated.id) || (!!updated.packageType && !projects.some(p => p.id === updated.id));
    if (isPlan) {
      setPlans(prev => prev.map(p => p.id === updated.id ? (updated as unknown as Plan) : p));
      setSelectedProject(updated);
      const { id, ...planDataWithoutId } = updated as any;
      updatePlan(updated.id, planDataWithoutId).catch((err: any) => {
        console.error('Failed to save plan update to Firebase:', err);
      });
    } else {
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
      setSelectedProject(updated);
      const { id, ...projectDataWithoutId } = updated;
      updateProject(updated.id, projectDataWithoutId as Partial<Project>).catch((err: any) => {
        console.error('Failed to save project update to Firebase:', err);
      });
    }
  };

  const handleAddUser = (newUser: User) => {
    setUsers(prev => {
      if (prev.find(u => u.id === newUser.id)) return prev;
      return [...prev, newUser];
    });
  };

  const handleAddProject = (newProject: Project) => {
    // Don't add to local state - let Firebase subscription handle it
    // This prevents duplicate projects
  };

  const handleDeleteProject = async (project: Project) => {
    try {
      const isPlan = plans.some(p => p.id === project.id) || (!!project.packageType && !projects.some(p => p.id === project.id));
      if (isPlan) {
        setPlans(prev => prev.filter(p => p.id !== project.id));
        await deletePlan(project.id);
      } else {
        setProjects(prev => prev.filter(p => p.id !== project.id));
        await deleteProject(project.id);
      }
      addNotification('Success', `${isPlan ? 'Plan' : 'Project'} "${project.name}" deleted successfully`, 'success');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      addNotification('Error', `Failed to delete project: ${error.message}`, 'error');
    }
  };

  const handleAddPlan = (newPlan: Plan) => {
    // Don't add to local state - let Firebase subscription handle it
  };

  const handleUpdatePlan = (updatedPlan: Plan) => {
    setPlans(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
  };

  const handleDeletePlan = async (plan: Plan) => {
    try {
      setPlans(prev => prev.filter(p => p.id !== plan.id));
      await deletePlan(plan.id);
      addNotification('Success', `Plan "${plan.name}" deleted successfully`, 'success');
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      addNotification('Error', `Failed to delete plan: ${error.message}`, 'error');
    }
  };

  // Filter Projects for List View based on Role
  const visibleProjects = projects.filter(p => {
    if (user.isApproved === false) return false;
    if (user.role === Role.ADMIN) return true;
    if (user.role === Role.DESIGNER) return p.leadDesignerId === user.id || (p.teamMembers || []).includes(user.id);
    if (user.role === Role.CLIENT) return p.clientId === user.id || (p.clientIds || []).includes(user.id);
    return false;
  });

  // Filter Plans for List View based on Role
  const visiblePlans = plans.filter(p => {
    if (user.isApproved === false) return false;
    if (user.role === Role.ADMIN) return true;
    if (user.role === Role.DESIGNER) return p.leadDesignerId === user.id || (p.teamMembers || []).includes(user.id);
    if (user.role === Role.CLIENT) return p.clientId === user.id || (p.clientIds || []).includes(user.id);
    return false;
  });

  const SidebarItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setSelectedProject(null);
        setSelectedTask(null);
        setIsTaskOnlyView(false);
        setIsSidebarOpen(false);
      }}
      className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-start px-4'} gap-2 py-3 rounded-lg transition-colors mb-1
        ${currentView === view && !selectedProject
          ? 'bg-gray-900 text-white shadow-lg'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
      title={isSidebarCollapsed ? label : ""}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isSidebarCollapsed && <span className="font-medium">{label}</span>}
    </button>
  );

  const BottomNavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setCurrentView(view);
        setSelectedProject(null);
        setSelectedTask(null);
        setIsTaskOnlyView(false);
      }}
      className={`flex flex-col items-center justify-center py-2 px-3 transition-all duration-300 min-w-[64px] ${currentView === view && !selectedProject
        ? 'mobile-nav-item-active'
        : 'text-gray-400 hover:text-gray-900'
        }`}
      title={label}
    >
      <Icon className={`w-5 h-5 transition-transform duration-300 ${currentView === view && !selectedProject ? 'scale-110' : ''}`} />
      <span className="text-[10px] font-bold mt-1.5 uppercase tracking-tighter mobile-nav-label">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden flex-col md:flex-row">
      <Loader />
      <SessionExpiryWarning />
      {/* Mobile Overlay - Hidden on mobile, kept for animation purposes */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-[250] hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Sidebar - Desktop only */}
      <aside className={`
        hidden md:flex fixed md:relative inset-y-0 left-0 z-[300] bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out md:translate-x-0
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-48'}
      `}>
        <div className="h-full flex flex-col relative">
          <div className="p-4 flex items-center justify-center overflow-hidden">
            <img src={logoUrl} alt={`${brandName} Logo`} className={`object-contain shrink-0 ${isSidebarCollapsed ? 'h-[32px] w-[48px]' : 'h-[34px] w-auto max-w-[120px]'}`} style={{ background: 'none', filter: 'invert(0)' }} />
            <button className="md:hidden absolute right-4" onClick={() => setIsSidebarOpen(false)} title="Close sidebar">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Toggle Button - On Right Border */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex absolute -right-3 top-6 bg-white text-gray-900 rounded-md items-center justify-center hover:bg-gray-100 transition-all duration-300 shadow-md border border-gray-200 z-[310] p-1.5"
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : 'rotate-0'}`} />
          </button>

          <div className="px-4 flex-1 overflow-y-auto">
            <div className="mb-6">
              {!isSidebarCollapsed && <p className="px-4 text-xs font-semibold text-gray-400 tracking-wider mb-2">Main</p>}
              {/* Hide Dashboard for clients; clients should see Projects directly */}
              {user.role !== Role.CLIENT && <SidebarItem view="dashboard" icon={FaRegCompass} label="Dashboard" />}
              {canSeeProjects && (
                <>
                  <SidebarItem view="projects" icon={FaRegFolderOpen} label="Projects" />
                  <SidebarItem view="plans" icon={Layers} label="Plans" />
                </>
              )}
              {/* DISABLED FOR DEPLOYMENT: Team Pulse */}
              {/* {user.role !== Role.CLIENT && <SidebarItem view="scheduler" icon={CalendarDays} label="Team Pulse" />} */}
            </div>

            {(canSeeClients || canSeeDesigners || canSeeAdmins) && (
              <div className="mb-6">
                {!isSidebarCollapsed && <p className="px-4 text-xs font-semibold text-gray-400 tracking-wider mb-2">Studio</p>}
                {canSeeClients && <SidebarItem view="clients" icon={FaRegAddressCard} label="Clients" />}
                {canSeeDesigners && <SidebarItem view="designers" icon={FaPaintBrush} label="Designers" />}
                {canSeeAdmins && <SidebarItem view="admins" icon={FaUserShield} label="Admins" />}
              </div>
            )}

            <div className="mb-6">
              {!isSidebarCollapsed && <p className="px-4 text-xs font-semibold text-gray-400 tracking-wider mb-2">Account</p>}
              <SidebarItem view="settings" icon={Settings} label="Settings" />
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            {/* Show Sign Out in sidebar only on md+ screens. On mobile, user can sign out from Settings view. */}
            <div className="hidden md:block">
              <button
                onClick={async () => {
                  try {
                    await logout();
                  } catch (error) {
                    console.error('Logout failed:', error);
                  }
                }}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2' : 'justify-start px-4'} gap-3 py-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
                title={isSidebarCollapsed ? "Sign Out" : ""}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!isSidebarCollapsed && <span className="font-medium">Sign Out</span>}
              </button>
            </div>
            <div className="block md:hidden text-center text-xs text-gray-400">Sign out is available in Settings</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Notification Permission Banner */}
        {showNotifPermissionBanner && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-900">
                Enable push notifications to stay updated on project activities
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleEnableNotifications}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Enable
              </button>
              <button
                onClick={() => setShowNotifPermissionBanner(false)}
                aria-label="Dismiss notification banner"
                title="Dismiss notification banner"
                className="text-blue-600 px-2 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Top Navbar */}
        {/* Added relative and z-[200] to ensure it stays above main sticky content but below modals */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 relative z-10">
          <div className="flex items-center gap-4">
            {/* Settings Gear - Mobile Only, Top Left */}
            <button
              onClick={() => {
                setCurrentView('settings');
                setSelectedProject(null);
                setSelectedTask(null);
                setIsTaskOnlyView(false);
              }}
              className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
              aria-label="Open settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* Notifications Feature Disabled Completely
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                title="Toggle notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
                )}
              </button>
              <NotificationPanel
                isOpen={isNotifOpen}
                onClose={() => setIsNotifOpen(false)}
                projects={projects}
                onSelectProject={(project, opts) => {
                  setSelectedProject(project);
                  setSelectedTask(null);
                  setIsTaskOnlyView(false);
                  setInitialProjectTab(opts?.initialTab);
                }}
              />
            </div>
            */}

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{profileDisplayData?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{profileDisplayData?.role}</p>
              </div>
              <AvatarCircle avatar={profileDisplayData?.avatar} name={profileDisplayData?.name || 'User'} size="sm" role={String(profileDisplayData?.role || '').toLowerCase()} />
            </div>
          </div>
        </header>

        {/* View Content */}
        <main
          className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6 pb-24 md:pb-0 relative"
          onClick={() => isNotifOpen && setIsNotifOpen(false)}
        >
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-gray-900 animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-medium">Loading data from Firebase...</p>
              </div>
            </div>
          )}

          {!isLoading && (
            <>
              {selectedProject ? (
                <ProjectDetail
                  project={selectedProject}
                  projects={projects}
                  users={users}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  onBack={() => {
                    setSelectedProject(null);
                    setSelectedTask(null);
                    setIsTaskOnlyView(false);
                    setInitialProjectTab(undefined);
                  }}
                  initialTask={selectedTask || undefined}
                  initialTab={initialProjectTab}
                  onCloseTask={() => {
                    if (isTaskOnlyView) {
                      setSelectedProject(null);
                      setSelectedTask(null);
                      setIsTaskOnlyView(false);
                    }
                  }}
                />
              ) : (
                <>
                  {currentView === 'dashboard' && <Dashboard projects={visibleProjects} plans={visiblePlans} users={users} onSelectProject={(project, opts) => {
                    setSelectedProject(project);
                    setSelectedTask(null);
                    setIsTaskOnlyView(false);
                    setInitialProjectTab(opts?.initialTab);
                  }} onSelectTask={(task, project) => {
                    setSelectedProject(project);
                    setSelectedTask(task);
                    setIsTaskOnlyView(true);
                  }} />}

                  {currentView === 'projects' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
                          <p className="text-sm text-gray-500 mt-1">Individual tailored design services</p>
                        </div>
                        {(user.role === Role.ADMIN || user.role === Role.DESIGNER) && (
                          <button
                            onClick={() => setIsNewProjectModalOpen(true)}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                          >
                            <Palette className="w-4 h-4" /> New Project
                          </button>
                        )}
                      </div>

                      {/* Project Filters */}
                      <div className="bg-white rounded-lg border border-gray-200 p-3">
                        {/* Desktop: All in one row */}
                        <div className="hidden md:flex md:items-end gap-3">
                          <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Search by Name</label>
                            <input
                              type="text"
                              placeholder="Search projects..."
                              value={projectNameFilter}
                              onChange={(e) => setProjectNameFilter(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                            <select
                              aria-label="Filter by category"
                              value={projectCategoryFilterValue}
                              onChange={(e) => setProjectCategoryFilterValue(e.target.value as ProjectCategory | 'All')}
                              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white hover:bg-gray-50 cursor-pointer font-medium text-gray-700 appearance-none"
                              style={{
                                backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" viewBox=\"0 0 20 20\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 8l3 3 3-3\" stroke=\"%23333\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path></svg>')",
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.25rem 1.25rem',
                                paddingRight: '1.75rem'
                              }}
                            >
                              <option value="All">All Categories</option>
                              <option value={ProjectCategory.RESIDENTIAL}>Residential</option>
                              <option value={ProjectCategory.COMMERCIAL}>Commercial</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                            <select
                              aria-label="Sort projects"
                              value={projectSortBy}
                              onChange={(e) => setProjectSortBy(e.target.value as 'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'recent-asc' | 'recent-desc')}
                              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white hover:bg-gray-50 cursor-pointer font-medium text-gray-700 appearance-none"
                              style={{
                                backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" viewBox=\"0 0 20 20\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 8l3 3 3-3\" stroke=\"%23333\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path></svg>')",
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.25rem 1.25rem',
                                paddingRight: '1.75rem'
                              }}
                            >
                              <option value="recent-desc">Recent (Newest First)</option>
                              <option value="recent-asc">Recent (Oldest First)</option>
                              <option value="name-asc">Name (A-Z)</option>
                              <option value="name-desc">Name (Z-A)</option>
                              <option value="progress-asc">Progress (Low to High)</option>
                              <option value="progress-desc">Progress (High to Low)</option>
                            </select>
                          </div>

                          {(projectNameFilter || projectCategoryFilterValue !== 'All') && (
                            <button
                              type="button"
                              aria-label="Clear all filters"
                              title="Clear all filters"
                              onClick={() => {
                                setProjectNameFilter('');
                                setProjectCategoryFilterValue('All');
                              }}
                              className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors whitespace-nowrap"
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        {/* Mobile: Search above, Category and Sort in one row */}
                        <div className="md:hidden space-y-3">
                          <div className="flex items-end">
                            <div className="flex-1 min-w-[180px]">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Search by Name</label>
                              <input
                                type="text"
                                placeholder="Search projects..."
                                value={projectNameFilter}
                                onChange={(e) => setProjectNameFilter(e.target.value)}
                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                              />
                            </div>
                          </div>

                          <div className="flex items-end gap-3 flex-wrap">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Category:</label>
                              <select
                                aria-label="Filter by category"
                                value={projectCategoryFilterValue}
                                onChange={(e) => setProjectCategoryFilterValue(e.target.value as ProjectCategory | 'All')}
                                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white hover:bg-gray-50 cursor-pointer font-medium text-gray-700 appearance-none"
                                style={{
                                  backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" viewBox=\"0 0 20 20\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 8l3 3 3-3\" stroke=\"%23333\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path></svg>')",
                                  backgroundPosition: 'right 0.5rem center',
                                  backgroundRepeat: 'no-repeat',
                                  backgroundSize: '1.25rem 1.25rem',
                                  paddingRight: '1.75rem'
                                }}
                              >
                                <option value="All">All Categories</option>
                                <option value={ProjectCategory.RESIDENTIAL}>Residential</option>
                                <option value={ProjectCategory.COMMERCIAL}>Commercial</option>
                              </select>
                            </div>


                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Sort By: </label>
                              <select
                                aria-label="Sort projects"
                                value={projectSortBy}
                                onChange={(e) => setProjectSortBy(e.target.value as 'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'recent-asc' | 'recent-desc')}
                                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white hover:bg-gray-50 cursor-pointer font-medium text-gray-700 appearance-none"
                                style={{
                                  backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" viewBox=\"0 0 20 20\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 8l3 3 3-3\" stroke=\"%23333\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path></svg>')",
                                  backgroundPosition: 'right 0.5rem center',
                                  backgroundRepeat: 'no-repeat',
                                  backgroundSize: '1.25rem 1.25rem',
                                  paddingRight: '1.75rem'
                                }}
                              >
                                <option value="recent-desc">Recent (Newest First)</option>
                                <option value="recent-asc">Recent (Oldest First)</option>
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="progress-asc">Progress (Low to High)</option>
                                <option value="progress-desc">Progress (High to Low)</option>
                              </select>
                            </div>

                            {(projectNameFilter || projectCategoryFilterValue !== 'All') && (
                              <button
                                type="button"
                                aria-label="Clear all filters"
                                title="Clear all filters"
                                onClick={() => {
                                  setProjectNameFilter('');
                                  setProjectCategoryFilterValue('All');
                                }}
                                className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors whitespace-nowrap"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>
                      </div>



                      {visibleProjects.filter(p => !p.packageType).length > 0 ? (
                        <ProjectList
                          projects={(() => {
                            // First filter the projects (Only custom ones)
                            let filtered = visibleProjects.filter(p => !p.packageType).filter(p => {
                              // Name filter
                              if (projectNameFilter.trim() && !p.name.toLowerCase().includes(projectNameFilter.toLowerCase())) {
                                return false;
                              }
                              // Category filter
                              if (projectCategoryFilterValue !== 'All' && p.category !== projectCategoryFilterValue) {
                                return false;
                              }
                              return true;
                            });

                            // Then sort the filtered projects
                            return filtered.sort((a, b) => {
                              switch (projectSortBy) {
                                case 'name-asc':
                                  return a.name.localeCompare(b.name);
                                case 'name-desc':
                                  return b.name.localeCompare(a.name);
                                case 'progress-asc': {
                                  const progressA = calculateProjectProgress(realTimeTasks.get(a.id) || []);
                                  const progressB = calculateProjectProgress(realTimeTasks.get(b.id) || []);
                                  return progressA - progressB;
                                }
                                case 'progress-desc': {
                                  const progressA = calculateProjectProgress(realTimeTasks.get(a.id) || []);
                                  const progressB = calculateProjectProgress(realTimeTasks.get(b.id) || []);
                                  return progressB - progressA;
                                }
                                case 'recent-asc': {
                                  const dateA = new Date(typeof a.createdAt === 'string' ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date());
                                  const dateB = new Date(typeof b.createdAt === 'string' ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date());
                                  return dateA.getTime() - dateB.getTime();
                                }
                                case 'recent-desc': {
                                  const dateA = new Date(typeof a.createdAt === 'string' ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date());
                                  const dateB = new Date(typeof b.createdAt === 'string' ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date());
                                  return dateB.getTime() - dateA.getTime();
                                }
                                default:
                                  return 0;
                              }
                            });
                          })()}
                          onSelect={(project) => {
                            setSelectedProject(project);
                            setSelectedTask(null);
                            setIsTaskOnlyView(false);
                            setInitialProjectTab(undefined);
                          }}
                          user={user}
                          setEditingProject={setEditingProject}
                          setIsNewProjectModalOpen={setIsNewProjectModalOpen}
                          onRequestDelete={(project) => {
                            setProjectToDelete(project);
                            setIsDeletingProject(true);
                          }}
                          realTimeTasks={realTimeTasks}
                        />
                      ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                          <p className="text-gray-500">No custom projects found.</p>
                        </div>
                      )}
                    </div>
                  )}
                  {currentView === 'plans' && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800">Firm Creative Plans</h2>
                          <p className="text-sm text-gray-500 mt-1">Predefined package structures and creative quotas</p>
                        </div>
                        {user.role === Role.ADMIN && (
                          <button
                            onClick={() => setIsNewPlanModalOpen(true)}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto"
                          >
                            <Palette className="w-4 h-4" /> New Creative Plan
                          </button>
                        )}
                      </div>

                      {/* Plan Filters */}
                      <div className="bg-white rounded-lg border border-gray-200 p-3">
                        <div className="flex flex-col md:flex-row md:items-end gap-3">
                          <div className="flex-1 min-w-[180px]">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Search by Name</label>
                            <input
                              type="text"
                              placeholder="Search plans..."
                              value={projectNameFilter}
                              onChange={(e) => setProjectNameFilter(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sort By</label>
                            <select
                              aria-label="Sort plans"
                              value={projectSortBy}
                              onChange={(e) => setProjectSortBy(e.target.value as 'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'recent-asc' | 'recent-desc')}
                              className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white hover:bg-gray-50 cursor-pointer font-medium text-gray-700 appearance-none"
                              style={{
                                backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"none\" height=\"20\" viewBox=\"0 0 20 20\" width=\"20\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 8l3 3 3-3\" stroke=\"%23333\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.5\"></path></svg>')",
                                backgroundPosition: 'right 0.5rem center',
                                backgroundRepeat: 'no-repeat',
                                backgroundSize: '1.25rem 1.25rem',
                                paddingRight: '1.75rem'
                              }}
                            >
                              <option value="recent-desc">Recent (Newest First)</option>
                              <option value="recent-asc">Recent (Oldest First)</option>
                              <option value="name-asc">Name (A-Z)</option>
                              <option value="name-desc">Name (Z-A)</option>
                              <option value="progress-asc">Progress (Low to High)</option>
                              <option value="progress-desc">Progress (High to Low)</option>
                            </select>
                          </div>

                          {projectNameFilter && (
                            <button
                              type="button"
                              onClick={() => {
                                setProjectNameFilter('');
                              }}
                              className="px-2 py-1.5 bg-gray-200 hover:bg-gray-300 rounded text-xs font-medium transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {visiblePlans.length > 0 ? (
                        <PlanList
                          plans={(() => {
                            // Filter in-memory plans
                            let filtered = visiblePlans.filter(p => {
                              if (projectNameFilter.trim() && !p.name.toLowerCase().includes(projectNameFilter.toLowerCase())) {
                                return false;
                              }
                              return true;
                            });

                            // Then sort
                            return filtered.sort((a, b) => {
                              switch (projectSortBy) {
                                case 'name-asc':
                                  return a.name.localeCompare(b.name);
                                case 'name-desc':
                                  return b.name.localeCompare(a.name);
                                case 'progress-asc': {
                                  const progressA = a.creativeUsed || 0;
                                  const progressB = b.creativeUsed || 0;
                                  return progressA - progressB;
                                }
                                case 'progress-desc': {
                                  const progressA = a.creativeUsed || 0;
                                  const progressB = b.creativeUsed || 0;
                                  return progressB - progressA;
                                }
                                case 'recent-asc': {
                                  const dateA = new Date(typeof a.createdAt === 'string' ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date());
                                  const dateB = new Date(typeof b.createdAt === 'string' ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date());
                                  return dateA.getTime() - dateB.getTime();
                                }
                                case 'recent-desc': {
                                  const dateA = new Date(typeof a.createdAt === 'string' ? a.createdAt : (a.createdAt as any)?.toDate?.() || new Date());
                                  const dateB = new Date(typeof b.createdAt === 'string' ? b.createdAt : (b.createdAt as any)?.toDate?.() || new Date());
                                  return dateB.getTime() - dateA.getTime();
                                }
                                default:
                                  return 0;
                              }
                            });
                          })()}
                          onSelect={(plan) => {
                            setSelectedProject(plan as unknown as Project);
                            setSelectedTask(null);
                            setIsTaskOnlyView(false);
                            setInitialProjectTab(undefined);
                          }}
                          user={user}
                          setEditingPlan={setEditingPlan}
                          setIsNewPlanModalOpen={setIsNewPlanModalOpen}
                          onRequestDelete={(plan) => {
                            setPlanToDelete(plan);
                            setIsDeletingPlan(true);
                          }}
                          realTimeTasks={realTimeTasks}
                        />
                      ) : (
                        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                          <p className="text-gray-500">No creative plans found.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {currentView === 'clients' && <PeopleList users={users} roleFilter={Role.CLIENT} onAddUser={handleAddUser} projects={visibleProjects} onSelectProject={(project) => {
                    setSelectedProject(project);
                    setSelectedTask(null);
                    setIsTaskOnlyView(false);
                    setInitialProjectTab(undefined);
                  }} onSelectTask={(task, project) => {
                    setSelectedProject(project);
                    setSelectedTask(task);
                    setIsTaskOnlyView(true);
                  }} />}
                  {currentView === 'designers' && <PeopleList users={users} roleFilter={Role.DESIGNER} onAddUser={handleAddUser} projects={visibleProjects} onSelectProject={(project) => {
                    setSelectedProject(project);
                    setSelectedTask(null);
                    setIsTaskOnlyView(false);
                    setInitialProjectTab(undefined);
                  }} onSelectTask={(task, project) => {
                    setSelectedProject(project);
                    setSelectedTask(task);
                    setIsTaskOnlyView(true);
                  }} />}
                  {currentView === 'admins' && <PeopleList users={users} roleFilter={Role.ADMIN} onAddUser={handleAddUser} projects={visibleProjects} onSelectProject={(project) => {
                    setSelectedProject(project);
                    setSelectedTask(null);
                    setIsTaskOnlyView(false);
                    setInitialProjectTab(undefined);
                  }} onSelectTask={(task, project) => {
                    setSelectedProject(project);
                    setSelectedTask(task);
                    setIsTaskOnlyView(true);
                  }} />}

                  {currentView === 'scheduler' && <TeamScheduler />}

                  {currentView === 'settings' && (
                    <div className="w-full min-h-full">
                      <div className="max-w-3xl mx-auto space-y-8 pb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-gray-800 mb-2">Settings</h2>
                          <p className="text-gray-600">Manage your account security and preferences</p>
                        </div>

                        {/* Account Info Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-gray-500 font-semibold mb-1">Name</p>
                                {isEditingProfileName ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={profileNameValue}
                                      onChange={(e) => setProfileNameValue(e.target.value)}
                                      disabled={isSavingProfileName}
                                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                      autoFocus
                                      onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                          if (!user) return;
                                          if (!profileNameValue.trim()) {
                                            addNotification('Error', 'Name cannot be empty', 'error');
                                            return;
                                          }
                                          setIsSavingProfileName(true);
                                          try {
                                            const { db } = await import('./services/firebaseConfig');
                                            const { doc, updateDoc } = await import('firebase/firestore');
                                            await updateDoc(doc(db, 'users', user.id), { name: profileNameValue.trim() });
                                            updateUser({ name: profileNameValue.trim() });
                                            addNotification('Success', 'Profile name updated successfully', 'success');
                                            setIsEditingProfileName(false);
                                          } catch (error) {
                                            console.error('Failed to update profile name:', error);
                                            addNotification('Error', 'Failed to update profile name', 'error');
                                          } finally {
                                            setIsSavingProfileName(false);
                                          }
                                        } else if (e.key === 'Escape') {
                                          setIsEditingProfileName(false);
                                        }
                                      }}
                                    />
                                    <button
                                      onClick={async () => {
                                        if (!user) return;
                                        if (!profileNameValue.trim()) {
                                          addNotification('Error', 'Name cannot be empty', 'error');
                                          return;
                                        }
                                        setIsSavingProfileName(true);
                                        try {
                                          const { db } = await import('./services/firebaseConfig');
                                          const { doc, updateDoc } = await import('firebase/firestore');
                                          await updateDoc(doc(db, 'users', user.id), { name: profileNameValue.trim() });
                                          updateUser({ name: profileNameValue.trim() });
                                          addNotification('Success', 'Profile name updated successfully', 'success');
                                          setIsEditingProfileName(false);
                                        } catch (error) {
                                          console.error('Failed to update profile name:', error);
                                          addNotification('Error', 'Failed to update profile name', 'error');
                                        } finally {
                                          setIsSavingProfileName(false);
                                        }
                                      }}
                                      disabled={isSavingProfileName}
                                      className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                                    >
                                      <span className="text-xs font-medium">{isSavingProfileName ? '...' : 'Save'}</span>
                                    </button>
                                    <button
                                      onClick={() => setIsEditingProfileName(false)}
                                      disabled={isSavingProfileName}
                                      className="p-1.5 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 disabled:opacity-50"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <p className="text-gray-900 font-medium">{profileDisplayData?.name}</p>
                                    <button
                                      onClick={() => {
                                        setProfileNameValue(profileDisplayData?.name || '');
                                        setIsEditingProfileName(true);
                                      }}
                                      className="p-1 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                      title="Edit Name"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Email</p>
                                <p className="text-gray-900 font-medium break-words max-w-full">{profileDisplayData?.email}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 font-semibold">Role</p>
                                <p className="text-gray-900 font-medium capitalize">{profileDisplayData?.role}</p>
                              </div>
                              {profileDisplayData?.phone && (
                                <div>
                                  <p className="text-xs text-gray-500 font-semibold">Phone</p>
                                  <p className="text-gray-900 font-medium">{profileDisplayData.phone}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Mobile-only Sign Out (visible inside Settings) */}
                        <div className="md:hidden mt-4">
                          <button
                            onClick={async () => {
                              try {
                                await logout();
                              } catch (error) {
                                console.error('Logout failed:', error);
                              }
                            }}
                            className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                          >
                            Sign Out
                          </button>
                        </div>

                        {/* Branding Settings - Admin Only */}
                        {user.role === Role.ADMIN && (
                          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">Company Branding</h3>
                                <p className="text-sm text-gray-600">Customize your organization's brand name and logo</p>
                              </div>
                              <button
                                onClick={() => setIsBrandingSettingsOpen(true)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                              >
                                <Palette className="w-4 h-4" />
                                Edit Branding
                              </button>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center gap-3">
                                <img src={logoUrl} alt={brandName} className="h-8 w-auto max-w-[96px] object-contain shrink-0" />
                                <span className="font-medium text-gray-900">{brandName}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Firm Settings - Admin & Designer */}
                        {/* COMMENTED OUT: Cross-firm support disabled
{/* COMMENTED OUT: Cross-firm support disabled
                      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Firm Management</h3>
                            <p className="text-sm text-gray-600">View and switch between your firms</p>
                          </div>
                          <button
                            onClick={() => setIsFirmSettingsOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <Building2 className="w-4 h-4" />
                            Manage Firms
                          </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Current Firm</p>
                              <span className="font-medium text-gray-900">{currentTenant?.name || 'Loading...'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      */}

                        {/* Remembered Devices */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                          <RememberedDevices />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </main>

        {/* Bottom Navigation Bar - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[250] mobile-bottom-nav border-t border-gray-200/50">
          <div className="flex justify-around items-center h-16 px-2">
            {user.role !== Role.CLIENT && (
              <BottomNavItem view="dashboard" icon={FaRegCompass} label="Dashboard" />
            )}
            {canSeeProjects && (
              <>
                <BottomNavItem view="projects" icon={FaRegFolderOpen} label="Projects" />
                <BottomNavItem view="plans" icon={Layers} label="Plans" />
              </>
            )}
            {canSeeClients && (
              <BottomNavItem view="clients" icon={FaRegAddressCard} label="Clients" />
            )}
            {canSeeDesigners && (
              <BottomNavItem view="designers" icon={FaPaintBrush} label="Designers" />
            )}
            {canSeeAdmins && (
              <BottomNavItem view="admins" icon={FaUserShield} label="Admins" />
            )}
          </div>
        </nav>
      </div>

      {isNewProjectModalOpen && (
        <NewProjectModal
          users={users}
          onClose={() => {
            setIsNewProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={(newOrUpdatedProject: Project) => {
            if (editingProject) {
              handleUpdateProject(newOrUpdatedProject);
            } else {
              handleAddProject(newOrUpdatedProject);
            }
          }}
          initialProject={editingProject}
        />
      )}

      {isNewPlanModalOpen && (
        <NewPlanModal
          users={users}
          onClose={() => {
            setIsNewPlanModalOpen(false);
            setEditingPlan(null);
          }}
          onSave={(newOrUpdatedPlan: Plan) => {
            if (editingPlan) {
              handleUpdatePlan(newOrUpdatedPlan);
            } else {
              handleAddPlan(newOrUpdatedPlan);
            }
          }}
          initialPlan={editingPlan}
        />
      )}

      {isChangePlanModalOpen && planToChange && (
        <ChangePlanModal
          isOpen={isChangePlanModalOpen}
          onClose={() => {
            setIsChangePlanModalOpen(false);
            setPlanToChange(null);
          }}
          plan={planToChange}
          onSave={handleUpdatePlan}
        />
      )}

      {isBrandingSettingsOpen && (
        <BrandingSettings
          isOpen={isBrandingSettingsOpen}
          onClose={() => setIsBrandingSettingsOpen(false)}
        />
      )}

      {/* Page title updater for tenant branding */}
      <PageTitleUpdater />

      {isDeletingProject && projectToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => {
            setIsDeletingProject(false);
            setProjectToDelete(null);
          }}
          title="Delete Project"
          message={`Are you sure you want to delete project "${projectToDelete.name}"? This action cannot be undone.`}
          onConfirm={() => {
            handleDeleteProject(projectToDelete);
            setIsDeletingProject(false);
            setProjectToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}

      {isDeletingPlan && planToDelete && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => {
            setIsDeletingPlan(false);
            setPlanToDelete(null);
          }}
          title="Delete Plan"
          message={`Are you sure you want to delete plan "${planToDelete.name}"? This action cannot be undone.`}
          onConfirm={() => {
            handleDeletePlan(planToDelete);
            setIsDeletingPlan(false);
            setPlanToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
        />
      )}
    </div>
  );
}

export default App;
