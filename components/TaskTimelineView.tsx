// New Timeline View Component to integrate into ProjectDetail.tsx
// This shows tasks as timeline-style approval cards

import React from 'react';
import { Task, TaskStatus, User, Role, Project } from '../types';
import AdminApprovalCard from './AdminApprovalCard';
import ClientApprovalCard from './ClientApprovalCard';
import { getPackageColor } from '../utils/colorUtils';
import { formatDateToIndian, calculateTaskProgress } from '../utils/taskUtils';
import { AvatarCircle } from '../utils/avatarUtils';
import { Calendar, Clock } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  project: Project;
  users: User[];
  currentUser: User;
  onEditTask: (task: Task) => void;
  onApproveTask?: (taskId: string) => void;
  onRejectTask?: (taskId: string) => void;
  isProcessing?: string | null;
}

export const TaskTimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  project,
  users,
  currentUser,
  onEditTask,
  onApproveTask,
  onRejectTask,
  isProcessing = null,
}) => {
  const packageColor = getPackageColor(project.packageType);
  const isAdmin = currentUser.role === Role.ADMIN;
  const isClient = currentUser.role === Role.CLIENT;

  // Get user name from ID
  const getUserName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  // Get days left for task
  const getDaysLeft = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get approval status for display
  const getApprovalStatus = (task: Task): 'pending' | 'approved' | 'rejected' | 'review' => {
    if (task.status !== TaskStatus.REVIEW) {
      if (task.status === TaskStatus.DONE) return 'approved';
      if (task.status === TaskStatus.ABORTED) return 'rejected';
      return 'pending';
    }
    return 'review';
  };

  // Get admin approval status for client card
  const getAdminApprovalStatus = (task: Task): 'pending' | 'approved' | 'rejected' => {
    const adminApproval = task.approvals?.start?.admin?.status;
    if (adminApproval === 'approved') return 'approved';
    if (adminApproval === 'rejected') return 'rejected';
    return 'pending';
  };

  // Group tasks by category, then by status
  const groupedTasks = tasks.reduce((acc: Record<string, Record<string, Task[]>>, task) => {
    const category = task.category || 'General';
    const status = task.status || TaskStatus.TODO;
    
    if (!acc[category]) acc[category] = {};
    if (!acc[category][status]) acc[category][status] = [];
    acc[category][status].push(task);
    
    return acc;
  }, {});

  return (
    <div className="space-y-8 pb-8">
      {Object.entries(groupedTasks).map(([category, statusGroups]) => (
        <div key={category}>
          {/* Category Header */}
          <h3 className="text-base font-bold text-gray-600 mb-4 px-1 border-l-4 border-gray-400 pl-3">
            {category}
          </h3>

          {/* Status sections */}
          <div className="space-y-6">
            {Object.entries(statusGroups).map(([status, categoryTasks]) => (
              <div key={status}>
                {/* Status Label */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <span className={`text-xs font-bold uppercase tracking-wide ${
                    status === TaskStatus.DONE ? 'text-green-600' :
                    status === TaskStatus.REVIEW ? 'text-purple-600' :
                    status === TaskStatus.IN_PROGRESS ? 'text-blue-600' :
                    'text-gray-500'
                  }`}>
                    {status}
                  </span>
                  <span className="text-xs text-gray-400">({categoryTasks.length})</span>
                </div>

                {/* Timeline cards */}
                <div className="space-y-3">
                  {categoryTasks.map((task) => {
                    const assignee = users.find(u => u.id === task.assigneeId);
                    const daysLeft = getDaysLeft(task.dueDate);
                    const approvalStatus = getApprovalStatus(task);
                    const adminStatus = getAdminApprovalStatus(task);
                    const isProcessingThis = isProcessing === task.id;

                    // Determine which card to render based on role
                    if (isAdmin) {
                      return (
                        <AdminApprovalCard
                          key={task.id}
                          title={task.title}
                          projectName={project.name}
                          type="task"
                          status={approvalStatus}
                          phase={`Phase: ${status}`}
                          assignee={assignee ? { name: assignee.name, avatar: assignee.avatar } : undefined}
                          dueDate={formatDateToIndian(task.dueDate)}
                          daysLeft={daysLeft}
                          packageColor={packageColor.name}
                          onApprove={() => onApproveTask?.(task.id)}
                          onReject={() => onRejectTask?.(task.id)}
                          onViewDetails={() => onEditTask(task)}
                          isProcessing={isProcessingThis}
                          approveLabel="Approve"
                          rejectLabel="Reject"
                        />
                      );
                    } else if (isClient) {
                      return (
                        <ClientApprovalCard
                          key={task.id}
                          title={task.title}
                          projectName={project.name}
                          type="task"
                          status={approvalStatus}
                          phase={`Phase: ${status}`}
                          assignee={assignee ? { name: assignee.name, avatar: assignee.avatar } : undefined}
                          dueDate={formatDateToIndian(task.dueDate)}
                          daysLeft={daysLeft}
                          packageColor={packageColor.name}
                          adminApprovalStatus={adminStatus}
                          onViewDetails={() => onEditTask(task)}
                        />
                      );
                    } else {
                      // Designer view - read-only
                      return (
                        <div
                          key={task.id}
                          onClick={() => onEditTask(task)}
                          className={`flex flex-col border-l-4 ${packageColor.tailwind.border} ${packageColor.tailwind.bg} bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer`}
                        >
                          <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold ${packageColor.tailwind.text} truncate`}>
                                  {project.name}
                                </span>
                              </div>
                              <h4 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h4>
                            </div>
                          </div>

                          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
                            {assignee && (
                              <div className="flex items-center gap-2 min-w-0">
                                {assignee.avatar ? (
                                  <img src={assignee.avatar} alt={assignee.name} className="w-6 h-6 rounded-full" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700">
                                    {assignee.name.charAt(0)}
                                  </div>
                                )}
                                <span className="text-sm text-gray-700 truncate">{assignee.name}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-4 text-xs text-gray-600">
                              <div className="flex items-center gap-1">
                                <span className="font-medium">Due:</span>
                                <span>{formatDateToIndian(task.dueDate)}</span>
                              </div>
                              {daysLeft !== undefined && (
                                <div className={`font-semibold ${daysLeft < 3 ? 'text-red-600' : 'text-gray-600'}`}>
                                  {daysLeft} days left
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskTimelineView;
