import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  IndianRupee,
  Layers3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  FinancialRecord,
  Project,
  Plan,
  ProjectPackage,
  ProjectDocument,
  Role,
  Task,
  TaskStatus,
  User,
} from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { subscribeToProjectTasks, subscribeToProjectDocuments } from '../services/projectDetailsService';
import { subscribeToProjectFinancialRecords } from '../services/financialService';
import { calculateProjectProgress, calculateTaskProgress, formatDateToIndian } from '../utils/taskUtils';
import { PACKAGE_VISUALS, buildPackageCreativeSummary, buildPlanCreativeSummary } from '../utils/packageUtils';
import { getPackages } from '../services/packageService';
import { Package } from '../types';

interface DashboardProps {
  projects: Project[];
  plans: Plan[];
  users: User[];
  onSelectProject?: (project: Project, opts?: { initialTab?: 'discovery' | 'plan' | 'financials' | 'team' | 'timeline' | 'documents' | 'meetings' }) => void;
  onSelectTask?: (task: Task, project: Project) => void;
}

type ApprovalItem = {
  id: string;
  label: string;
  type: 'task' | 'document' | 'financial';
  project: Project;
  task?: Task;
};

const getSafeTimestamp = (value: any): number => {
  if (!value) return 0;
  if (typeof value === 'string') return new Date(value).getTime();
  if (value?.toDate && typeof value.toDate === 'function') return value.toDate().getTime();
  if (value instanceof Date) return value.getTime();
  return new Date(value).getTime() || 0;
};

const Dashboard: React.FC<DashboardProps> = ({ projects, plans, users, onSelectProject, onSelectTask }) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [realTimeTasks, setRealTimeTasks] = useState<Map<string, Task[]>>(new Map());
  const [realTimeDocuments, setRealTimeDocuments] = useState<Map<string, ProjectDocument[]>>(new Map());
  const [realTimeFinancials, setRealTimeFinancials] = useState<Map<string, FinancialRecord[]>>(new Map());
  const [availablePackages, setAvailablePackages] = useState<Package[]>([]);

  useEffect(() => {
    const fetchPackages = async () => {
      const pkgs = await getPackages(user?.tenantId);
      setAvailablePackages(pkgs);
    };
    fetchPackages();
  }, [user?.tenantId]);

  useEffect(() => {
    const allWork = [...projects, ...plans];
    if (allWork.length === 0) {
      setRealTimeTasks(new Map());
      setRealTimeDocuments(new Map());
      setRealTimeFinancials(new Map());
      return;
    }

    const unsubscribers: Array<() => void> = [];

    // Subscribe to projects
    projects.forEach((project) => {
      unsubscribers.push(
        subscribeToProjectTasks(project.id, (tasks) => {
          setRealTimeTasks((prev) => new Map(prev).set(project.id, tasks || []));
        }, "projects")
      );

      unsubscribers.push(
        subscribeToProjectDocuments(project.id, (documents) => {
          setRealTimeDocuments((prev) => new Map(prev).set(project.id, documents || []));
        }, "projects")
      );

      unsubscribers.push(
        subscribeToProjectFinancialRecords(project.id, (financials) => {
          setRealTimeFinancials((prev) => new Map(prev).set(project.id, financials || []));
        }, "projects")
      );
    });

    // Subscribe to plans
    plans.forEach((plan) => {
      unsubscribers.push(
        subscribeToProjectTasks(plan.id, (tasks) => {
          setRealTimeTasks((prev) => new Map(prev).set(plan.id, tasks || []));
        }, "plans")
      );

      unsubscribers.push(
        subscribeToProjectDocuments(plan.id, (documents) => {
          setRealTimeDocuments((prev) => new Map(prev).set(plan.id, documents || []));
        }, "plans")
      );

      unsubscribers.push(
        subscribeToProjectFinancialRecords(plan.id, (financials) => {
          setRealTimeFinancials((prev) => new Map(prev).set(plan.id, financials || []));
        }, "plans")
      );
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [projects, plans]);

  if (!user) return null;

  const getProjectTasks = (projectId: string): Task[] => {
    return realTimeTasks.get(projectId) || projects.find((p) => p.id === projectId)?.tasks || [];
  };

  const getProjectDocuments = (projectId: string): ProjectDocument[] => {
    return realTimeDocuments.get(projectId) || projects.find((p) => p.id === projectId)?.documents || [];
  };

  const getProjectFinancials = (projectId: string): FinancialRecord[] => {
    return realTimeFinancials.get(projectId) || projects.find((p) => p.id === projectId)?.financials || [];
  };

  const visibleProjects = useMemo(() => {
    if (user.role === Role.ADMIN) return projects;

    if (user.role === Role.DESIGNER) {
      return projects.filter(
        (project) => project.leadDesignerId === user.id || (project.teamMembers || []).includes(user.id)
      );
    }

    if (user.role === Role.CLIENT) {
      return projects.filter((project) => {
        const allClientIds = [project.clientId, ...(project.clientIds || [])].filter(Boolean) as string[];
        return allClientIds.includes(user.id);
      });
    }

    return [];
  }, [projects, user.id, user.role]);

  const visiblePlans = useMemo(() => {
    if (user.role === Role.ADMIN) return plans;

    if (user.role === Role.DESIGNER) {
      return plans.filter(
        (plan) => plan.leadDesignerId === user.id || (plan.teamMembers || []).includes(user.id)
      );
    }

    if (user.role === Role.CLIENT) {
      return plans.filter((plan) => {
        const allClientIds = [plan.clientId, ...(plan.clientIds || [])].filter(Boolean) as string[];
        return allClientIds.includes(user.id);
      });
    }

    return [];
  }, [plans, user.id, user.role]);

  const openTaskItems = useMemo(() => {
    const allWork = [...visibleProjects, ...visiblePlans];
    const pool = allWork.flatMap((project) =>
      getProjectTasks(project.id).map((task) => ({ task, project: project as Project }))
    );

    const scoped = user.role === Role.DESIGNER
      ? pool.filter((item) => item.task.assigneeId === user.id)
      : pool;

    return scoped.filter(
      (item) =>
        item.task.status !== TaskStatus.DONE &&
        item.task.status !== TaskStatus.ABORTED &&
        item.task.status !== TaskStatus.ON_HOLD
    );
  }, [visibleProjects, realTimeTasks, user.id, user.role]);

  const approvalItems = useMemo(() => {
    const items: ApprovalItem[] = [];
    const allWork = [...visibleProjects, ...visiblePlans];

    allWork.forEach((project) => {
      const tasks = getProjectTasks(project.id);
      const documents = getProjectDocuments(project.id);
      const financials = getProjectFinancials(project.id);

      tasks.forEach((task) => {
        if (user.role === Role.ADMIN) {
          if (task.approvals?.start?.admin?.status === 'pending') {
            items.push({ id: `${project.id}-${task.id}-start-admin`, label: `Start: ${task.title}`, type: 'task', project, task });
          }
          if (task.approvals?.completion?.admin?.status === 'pending') {
            items.push({ id: `${project.id}-${task.id}-end-admin`, label: `End: ${task.title}`, type: 'task', project, task });
          }
        }

        if (user.role === Role.CLIENT) {
          if (task.approvals?.start?.client?.status === 'pending') {
            items.push({ id: `${project.id}-${task.id}-start-client`, label: `Start: ${task.title}`, type: 'task', project, task });
          }
          if (task.approvals?.completion?.client?.status === 'pending') {
            items.push({ id: `${project.id}-${task.id}-end-client`, label: `End: ${task.title}`, type: 'task', project, task });
          }
        }

        if (user.role === Role.DESIGNER) {
          if (task.approvals?.start?.designer?.status === 'pending') {
            items.push({ id: `${project.id}-${task.id}-start-designer`, label: `Start: ${task.title}`, type: 'task', project, task });
          }
          if (task.approvals?.completion?.designer?.status === 'pending') {
            items.push({ id: `${project.id}-${task.id}-end-designer`, label: `End: ${task.title}`, type: 'task', project, task });
          }
        }
      });

      documents.forEach((doc) => {
        if (user.role === Role.ADMIN && doc.approvalStatus === 'pending') {
          items.push({ id: `${project.id}-${doc.id}-doc-admin`, label: `Doc: ${doc.name}`, type: 'document', project });
        }

        if (user.role === Role.CLIENT) {
          const needsClientApproval =
            doc.approvalStatus === 'approved' &&
            (doc.clientApprovalStatus === 'pending' || !doc.clientApprovalStatus);

          const isSharedWithClient =
            Array.isArray(doc.sharedWith) &&
            (doc.sharedWith.includes(user.id) || doc.sharedWith.includes(user.role));

          const isClientInProject =
            project.clientId === user.id || (project.clientIds || []).includes(user.id);

          if (needsClientApproval && (isSharedWithClient || isClientInProject)) {
            items.push({ id: `${project.id}-${doc.id}-doc-client`, label: `Doc: ${doc.name}`, type: 'document', project });
          }
        }
      });

      financials.forEach((record) => {
        if (user.role === Role.ADMIN) {
          if (record.isAdditionalBudget && record.adminApprovalForAdditionalBudget === 'pending') {
            items.push({ id: `${project.id}-${record.id}-budget-admin`, label: `Budget: ${record.description}`, type: 'financial', project });
          }
          if (record.isClientPayment && record.adminApprovalForPayment === 'pending') {
            items.push({ id: `${project.id}-${record.id}-payment-admin`, label: `Payment: ${record.description}`, type: 'financial', project });
          }
        }

        if (user.role === Role.CLIENT) {
          if (record.isAdditionalBudget && record.clientApprovalForAdditionalBudget === 'pending') {
            items.push({ id: `${project.id}-${record.id}-budget-client`, label: `Budget: ${record.description}`, type: 'financial', project });
          }
          if (record.isClientPayment && record.clientApprovalForPayment === 'pending') {
            items.push({ id: `${project.id}-${record.id}-payment-client`, label: `Payment: ${record.description}`, type: 'financial', project });
          }
        }
      });
    });

    return items;
  }, [visibleProjects, realTimeTasks, realTimeDocuments, realTimeFinancials, user.id, user.role]);

  const recentProjects = useMemo(() => {
    const allWork = [...visibleProjects, ...visiblePlans];
    return [...allWork]
      .sort((a, b) => {
        const aTs = Math.max(
          getSafeTimestamp(a.updatedAt),
          getSafeTimestamp(a.createdAt),
          ...getProjectTasks(a.id).map((task) => getSafeTimestamp((task as any).updatedAt || (task as any).timestamp))
        );
        const bTs = Math.max(
          getSafeTimestamp(b.updatedAt),
          getSafeTimestamp(b.createdAt),
          ...getProjectTasks(b.id).map((task) => getSafeTimestamp((task as any).updatedAt || (task as any).timestamp))
        );
        return bTs - aTs;
      })
      .slice(0, 4) as Project[];
  }, [visibleProjects, realTimeTasks]);

  const upcomingTasks = useMemo(() => {
    return [...openTaskItems]
      .sort((a, b) => getSafeTimestamp(a.task.dueDate) - getSafeTimestamp(b.task.dueDate))
      .slice(0, 6);
  }, [openTaskItems]);

  const dueSoonCount = useMemo(() => {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return openTaskItems.filter(({ task }) => {
      const due = new Date(task.dueDate);
      return due >= now && due <= sevenDaysFromNow;
    }).length;
  }, [openTaskItems]);



  const openApprovalItem = (item: ApprovalItem) => {
    if (item.type === 'task' && item.task) {
      onSelectTask?.(item.task, item.project);
      return;
    }

    if (item.type === 'document') {
      onSelectProject?.(item.project, { initialTab: 'documents' });
      return;
    }

    onSelectProject?.(item.project, { initialTab: 'financials' });
  };

  const totalWorkCount = visibleProjects.length + visiblePlans.length;
  const openTasks = openTaskItems.length;
  const pendingApprovals = approvalItems.length;
  const avgProgress =
    totalWorkCount === 0
      ? 0
      : Math.round(
          [...visibleProjects, ...visiblePlans].reduce((sum, project) => sum + calculateProjectProgress(getProjectTasks(project.id)), 0) /
            totalWorkCount
        );

  const packageCreativeSummary = useMemo(() => {
    // Sync creative counts from both plans and regular projects that have a package assigned
    const projectsWithPackage = visibleProjects.filter(p => !!p.packageType);
    const combinedPlans = [...(projectsWithPackage as any[]), ...visiblePlans];
    return buildPlanCreativeSummary(combinedPlans, availablePackages);
  }, [visibleProjects, visiblePlans, availablePackages]);

  const dashboardPackagePalette: Record<
    ProjectPackage,
    {
      cardBg: string;
      border: string;
      title: string;
      value: string;
      meta: string;
    }
  > = {
    [ProjectPackage.PACKAGE_50]: {
      // Starter plan pink
      cardBg: '#FEF0F5',
      border: '#E8356E',
      title: '#E8356E',
      value: '#E8356E',
      meta: '#BE185D',
    },
    [ProjectPackage.PACKAGE_100]: {
      // Growth plan orange
      cardBg: '#FFF5F0',
      border: '#FF6B35',
      title: '#FF6B35',
      value: '#FF6B35',
      meta: '#C2410C',
    },
    [ProjectPackage.PACKAGE_200]: {
      // Business plan teal
      cardBg: '#F0FDFB',
      border: '#3CB89F',
      title: '#3CB89F',
      value: '#3CB89F',
      meta: '#0F766E',
    },
    [ProjectPackage.IMPACT]: {
      // Impact plan deep blue
      cardBg: '#F0F4FB',
      border: '#2E4A7E',
      title: '#2E4A7E',
      value: '#2E4A7E',
      meta: '#1E3A8A',
    },
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto dashboard-surface">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 md:p-8 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Workspace Snapshot</p>
            <h2 className="text-2xl md:text-3xl font-bold mt-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-amber-300" />
              Fresh Dashboard
            </h2>
            <p className="text-sm text-slate-200 mt-2">
              Quick visibility into projects, deadlines, and approvals while your full redesign is in progress.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3 w-full lg:w-auto">
            <span className="px-4 py-2 rounded-full border border-slate-500 text-slate-100 text-sm">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm dashboard-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Work items</p>
            <Briefcase className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{totalWorkCount}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm dashboard-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Open Tasks</p>
            <Layers3 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{openTasks}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm dashboard-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Due This Week</p>
            <CalendarClock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{dueSoonCount}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm dashboard-card">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Avg Progress</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900 mt-3">{avgProgress}%</p>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 dashboard-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-gray-900">Package Project Counts</h3>
          <span className="text-xs font-semibold text-gray-500">
            {packageCreativeSummary.totalProjectCount} projects assigned
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {packageCreativeSummary.byPackage.map((item) => {
            const visuals = PACKAGE_VISUALS[item.packageType];
            const palette = dashboardPackagePalette[item.packageType];
            const perProjectLabel =
              item.creativesPerProject > 0 ? `${item.creativesPerProject} per project` : 'Custom quota';

            return (
              <div
                key={item.packageType}
                className="rounded-xl border p-4 dashboard-card-interactive"
                style={{
                  backgroundColor: palette.cardBg,
                  borderColor: palette.border,
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: palette.title }}
                >
                  {visuals.shortLabel}
                </p>
                <p
                  className="text-2xl font-bold mt-2"
                  style={{ color: palette.value }}
                >
                  {item.projectCount}
                </p>
                <p className="text-xs mt-1" style={{ color: palette.meta }}>
                  project{item.projectCount === 1 ? '' : 's'} · {perProjectLabel}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-gray-200 rounded-xl shadow-sm p-5 dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Recent Projects</h3>
            <span className="text-xs font-semibold text-gray-500">Top {recentProjects.length}</span>
          </div>

          {recentProjects.length === 0 ? (
            <div className="h-44 rounded-lg border border-dashed border-gray-300 grid place-items-center text-sm text-gray-500">
              No projects available yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentProjects.map((project) => {
                const tasks = getProjectTasks(project.id);
                const progress = calculateProjectProgress(tasks);
                const openCount = tasks.filter((task) => task.status !== TaskStatus.DONE).length;
                const clientName =
                  project.clientIds
                    ?.map((id) => users.find((entry) => entry.id === id)?.name)
                    .filter(Boolean)
                    .join(', ') ||
                  users.find((entry) => entry.id === project.clientId)?.name ||
                  'No client';

                return (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject?.(project)}
                    className="text-left rounded-2xl border border-slate-200/60 p-4 bg-white hover:shadow-lg transition-shadow dashboard-card-interactive"
                  >
                    <p className="font-bold text-slate-800 text-base truncate">{project.name}</p>
                    <p className="text-xs text-slate-500 mt-1 truncate font-medium">{clientName}</p>
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600">{progress}%</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs pt-3 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">{openCount} open tasks</span>
                      <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                        Open <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Upcoming Tasks</h3>
            <span className="text-xs font-semibold text-gray-500">{upcomingTasks.length} shown</span>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="h-44 rounded-lg border border-dashed border-gray-300 grid place-items-center text-sm text-gray-500">
              No upcoming tasks.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(({ task, project }) => (
                <button
                  key={`${project.id}-${task.id}`}
                  onClick={() => onSelectTask?.(task, project)}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow dashboard-card-interactive"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 truncate mt-1">{project.name}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500 shrink-0">
                      {calculateTaskProgress(task)}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Clock3 className="w-3 h-3" />
                      Due {formatDateToIndian(task.dueDate)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                      {task.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">Approvals Snapshot</h3>
          <span className="text-xs font-semibold text-gray-500">{pendingApprovals} pending</span>
        </div>

        {approvalItems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
            No pending approvals right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {approvalItems.slice(0, 9).map((item) => (
              <button
                key={item.id}
                onClick={() => openApprovalItem(item)}
                className="text-left p-3 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow dashboard-card-interactive"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.label}</p>
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  {item.type === 'document' ? <FileText className="w-3 h-3" /> : item.type === 'financial' ? <IndianRupee className="w-3 h-3" /> : <Layers3 className="w-3 h-3" />}
                  <span className="truncate">{item.project.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
