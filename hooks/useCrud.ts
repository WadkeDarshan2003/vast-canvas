import { useState } from 'react';
import { Project, User, FinancialRecord, Task, Meeting, ProjectDocument, Comment, Timeline, SubTask, Plan } from '../types';
import {
  createProject,
  updateProject,
  deleteProject,
  createUser,
  updateUser,
  createPlan,
  updatePlan,
  deletePlan
} from '../services/firebaseService';
import {
  createTask,
  updateTask,
  deleteTask,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  createDocument,
  updateDocument,
  deleteDocument,
  addCommentToDocument,
  deleteCommentFromDocument,
  addTeamMember,
  removeTeamMember,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addCommentToTask,
  deleteCommentFromTask,
  updateTaskApproval
} from '../services/projectDetailsService';
import {
  createProjectFinancialRecord,
  updateProjectFinancialRecord,
  deleteProjectFinancialRecord
} from '../services/financialService';

interface UseCrudState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export const useProjectCrud = () => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewProject = async (project: Omit<Project, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createProject(project);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingProject = async (projectId: string, updates: Partial<Project>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateProject(projectId, updates);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingProject = async (projectId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteProject(projectId);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewProject,
    updateExistingProject,
    deleteExistingProject
  };
};

export const usePlanCrud = () => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewPlan = async (plan: Omit<Plan, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createPlan(plan);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingPlan = async (planId: string, updates: Partial<Plan>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updatePlan(planId, updates);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingPlan = async (planId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deletePlan(planId);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewPlan,
    updateExistingPlan,
    deleteExistingPlan
  };
};

export const useUserCrud = () => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewUser = async (user: User) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createUser(user);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingUser = async (userId: string, updates: Partial<User>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateUser(userId, updates);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewUser,
    updateExistingUser
  };
};

export const useFinancialCrud = (projectId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewRecord = async (record: Omit<FinancialRecord, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createProjectFinancialRecord(projectId, record, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingRecord = async (recordId: string, updates: Partial<FinancialRecord>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateProjectFinancialRecord(projectId, recordId, updates, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingRecord = async (recordId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteProjectFinancialRecord(projectId, recordId, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewRecord,
    updateExistingRecord,
    deleteExistingRecord
  };
};

// ============ TASK CRUD ============
export const useTaskCrud = (projectId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewTask = async (task: Omit<Task, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createTask(projectId, task, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingTask = async (taskId: string, updates: Partial<Task>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateTask(projectId, taskId, updates, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingTask = async (taskId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteTask(projectId, taskId, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewTask,
    updateExistingTask,
    deleteExistingTask
  };
};

// ============ MEETING CRUD ============
export const useMeetingCrud = (projectId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewMeeting = async (meeting: Omit<Meeting, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createMeeting(projectId, meeting, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingMeeting = async (meetingId: string, updates: Partial<Meeting>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateMeeting(projectId, meetingId, updates, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingMeeting = async (meetingId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteMeeting(projectId, meetingId, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewMeeting,
    updateExistingMeeting,
    deleteExistingMeeting
  };
};

// ============ DOCUMENT CRUD ============
export const useDocumentCrud = (projectId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewDocument = async (doc: Omit<ProjectDocument, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createDocument(projectId, doc, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingDocument = async (docId: string, updates: Partial<ProjectDocument>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateDocument(projectId, docId, updates, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingDocument = async (docId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteDocument(projectId, docId, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewDocument,
    updateExistingDocument,
    deleteExistingDocument
  };
};

// ============ COMMENT CRUD ============
export const useCommentCrud = (projectId: string, documentId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const addNewComment = async (comment: Omit<Comment, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await addCommentToDocument(projectId, documentId, comment, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingComment = async (commentId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteCommentFromDocument(projectId, documentId, commentId, undefined, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    addNewComment,
    deleteExistingComment
  };
};

// ============ TEAM MEMBER CRUD ============
export const useTeamMemberCrud = (projectId: string) => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const addMember = async (userId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await addTeamMember(projectId, userId);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const removeMember = async (userId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await removeTeamMember(projectId, userId);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    addMember,
    removeMember
  };
};

// ============ TIMELINE CRUD ============
export const useTimelineCrud = (projectId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewTimeline = async (timeline: Omit<Timeline, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createTimeline(projectId, timeline, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingTimeline = async (timelineId: string, updates: Partial<Timeline>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateTimeline(projectId, timelineId, updates, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingTimeline = async (timelineId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteTimeline(projectId, timelineId, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewTimeline,
    updateExistingTimeline,
    deleteExistingTimeline
  };
};

// ============ TASK CHECKLIST CRUD ============
export const useChecklistCrud = (projectId: string, taskId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const addNewChecklistItem = async (checklist: Omit<SubTask, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await addChecklistItem(projectId, taskId, checklist, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingChecklistItem = async (checklistId: string, updates: Partial<SubTask>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateChecklistItem(projectId, taskId, checklistId, updates, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingChecklistItem = async (checklistId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteChecklistItem(projectId, taskId, checklistId, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    addNewChecklistItem,
    updateExistingChecklistItem,
    deleteExistingChecklistItem
  };
};

// ============ TASK COMMENT CRUD ============
export const useTaskCommentCrud = (projectId: string, taskId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const addNewTaskComment = async (comment: Omit<Comment, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await addCommentToTask(projectId, taskId, comment, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingTaskComment = async (commentId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteCommentFromTask(projectId, taskId, commentId, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    addNewTaskComment,
    deleteExistingTaskComment
  };
};

// ============ TASK APPROVAL CRUD ============
export const useTaskApprovalCrud = (projectId: string, taskId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const updateTaskApprovalStatus = async (stage: 'start' | 'completion', approval: any) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateTaskApproval(projectId, taskId, stage, approval, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    updateTaskApprovalStatus
  };
};

// ============ PROJECT FINANCIAL RECORD CRUD ============
export const useProjectFinancialCrud = (projectId: string, parentCollection: string = "projects") => {
  const [state, setState] = useState<UseCrudState>({
    loading: false,
    error: null,
    success: false
  });

  const createNewFinancialRecord = async (record: Omit<FinancialRecord, 'id'>) => {
    setState({ loading: true, error: null, success: false });
    try {
      const id = await createProjectFinancialRecord(projectId, record, parentCollection);
      setState({ loading: false, error: null, success: true });
      return id;
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const updateExistingFinancialRecord = async (recordId: string, updates: Partial<FinancialRecord>) => {
    setState({ loading: true, error: null, success: false });
    try {
      await updateProjectFinancialRecord(projectId, recordId, updates, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  const deleteExistingFinancialRecord = async (recordId: string) => {
    setState({ loading: true, error: null, success: false });
    try {
      await deleteProjectFinancialRecord(projectId, recordId, parentCollection);
      setState({ loading: false, error: null, success: true });
    } catch (error: any) {
      setState({ loading: false, error: error.message, success: false });
      throw error;
    }
  };

  return {
    ...state,
    createNewFinancialRecord,
    updateExistingFinancialRecord,
    deleteExistingFinancialRecord
  };
};
