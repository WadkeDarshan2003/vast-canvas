import { Task, Project, TaskStatus } from '../types';

export const calculateTaskProgress = (task: Task | Partial<Task>): number => {
  // If task has explicit progress field set, use that
  if (task.progress !== undefined && task.progress !== null) {
    return Math.min(Math.max(task.progress, 0), 100); // Clamp between 0-100
  }
  
  // If task has subtasks, calculate based on completion
  if (task.subtasks && task.subtasks.length > 0) {
    const completedCount = task.subtasks.filter(s => s.isCompleted).length;
    return Math.round((completedCount / task.subtasks.length) * 100);
  }

  // If task is DONE, it's 100% complete
  if (task.status === TaskStatus.DONE) return 100;
  
  // If task is in REVIEW, it's also 100% complete
  if (task.status === TaskStatus.REVIEW) return 100;
  
  // If task has started, return 50%, otherwise 0
  if (task.status === TaskStatus.IN_PROGRESS) return 50;
  
  // Otherwise, return 0 for tasks not yet started
  return 0;
};

export const calculateProjectProgress = (tasks: Task[]): number => {
  if (!tasks || tasks.length === 0) return 0;

  const totalProgress = tasks.reduce((sum, task) => {
    return sum + calculateTaskProgress(task);
  }, 0);

  return Math.round(totalProgress / tasks.length);
};

export const isTaskFrozen = (status?: TaskStatus) => {
  return status === TaskStatus.ABORTED || status === TaskStatus.ON_HOLD;
};

export const isTaskBlocked = (task: Partial<Task>, allTasks: Task[]) => {
  // If frozen, it's effectively blocked from interaction
  if (isTaskFrozen(task.status)) return true;

  // Dependency rules removed
  return false;
};

export const getBlockingTasks = (task: Partial<Task>, allTasks: Task[]) => {
  if (!task.dependencies) return [];
  return allTasks.filter(t => task.dependencies?.includes(t.id) && t.status !== TaskStatus.DONE);
};

export const deriveStatus = (task: Task | Partial<Task>, currentStatus: TaskStatus = TaskStatus.TODO): TaskStatus => {
   // If locked by Admin, don't auto-change
   if (currentStatus === TaskStatus.ABORTED || currentStatus === TaskStatus.ON_HOLD) {
       return currentStatus;
   }

   const subtasks = task.subtasks || [];
   if (subtasks.length === 0) {
       // If no subtasks, rely on current status (buttons trigger changes)
       // But ensure we don't regress from Done unless intended
       return currentStatus;
   }

   const completedCount = subtasks.filter(s => s.isCompleted).length;
   
   if (completedCount === 0) return TaskStatus.TODO;
   
   if (completedCount === subtasks.length) {
       // Check Approvals
       const startClient = task.approvals?.start?.client?.status === 'approved';
       const startAdmin = task.approvals?.start?.admin?.status === 'approved';
       const completionClient = task.approvals?.completion?.client?.status === 'approved';
       const completionAdmin = task.approvals?.completion?.admin?.status === 'approved';
       
       if (startClient && startAdmin && completionClient && completionAdmin) {
           return TaskStatus.DONE;
       }
       return TaskStatus.REVIEW; // Needs approval to go to DONE
   }
   
   return TaskStatus.IN_PROGRESS;
};

// Format relative time (e.g., "2 hours ago", "3 days ago")
export const formatRelativeTime = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    
    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffWeeks < 4) {
      return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    } else {
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    }
  } catch {
    return dateStr;
  }
};

// Date formatting utilities for Indian date format (DD/MM/YYYY)
export const formatDateToIndian = (value?: unknown): string => {
  if (value === undefined || value === null) return '';

  try {
    let date: Date | null = null;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'number') {
      date = new Date(value);
    } else if (typeof value === 'object' && value && typeof (value as any).toDate === 'function') {
      // Support Firestore Timestamp values.
      date = (value as any).toDate();
    } else if (typeof value === 'string') {
      const dateStr = value.trim();
      if (!dateStr || /^invalid date$/i.test(dateStr)) return '';

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const [dayStr, monthStr, yearStr] = dateStr.split('/');
        const day = Number(dayStr);
        const month = Number(monthStr);
        const year = Number(yearStr);
        const parsed = new Date(year, month - 1, day);

        if (
          parsed.getFullYear() === year &&
          parsed.getMonth() === month - 1 &&
          parsed.getDate() === day
        ) {
          return dateStr;
        }
        return '';
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [yearStr, monthStr, dayStr] = dateStr.split('-');
        const day = Number(dayStr);
        const month = Number(monthStr);
        const year = Number(yearStr);
        date = new Date(year, month - 1, day);

        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          return '';
        }
      } else {
        date = new Date(dateStr);
      }
    }

    if (!date || Number.isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

// Convert Indian format (DD/MM/YYYY) to ISO format (YYYY-MM-DD)
export const formatIndianToISO = (indianDate: string): string => {
  if (!indianDate) return '';
  try {
    // Remove any whitespace
    indianDate = indianDate.trim();
    
    // If already in ISO format, return as-is
    if (indianDate.includes('-') && !indianDate.includes('/')) {
      return indianDate;
    }
    
    const [day, month, year] = indianDate.split('/');
    if (!day || !month || !year) return indianDate;
    
    const d = parseInt(day);
    const m = parseInt(month);
    const y = parseInt(year);
    
    // Validate date
    if (d < 1 || d > 31 || m < 1 || m > 12) return indianDate;
    
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  } catch {
    return indianDate;
  }
};
