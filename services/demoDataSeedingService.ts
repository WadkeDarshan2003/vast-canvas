import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where,
  writeBatch
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebaseConfig';
import { Role, Timeline } from '../types';
import { createDemoUsers } from './demoUsersService';
import { createDemoProjects } from './demoProjectService';

type SeedOptions = {
  replaceExisting?: boolean;
};

type SeedResult = {
  success: boolean;
  message: string;
  demoUserIds?: string[];
  demoProjectIds?: string[];
  demoProjectId?: string;
};

type ExistingDemoInfo = {
  hasDemo: boolean;
  userIds?: string[];
  projectIds?: string[];
  projectId?: string;
};

const cleanUndefined = (value: any): any => {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanUndefined(item))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, cleanUndefined(item)])
        .filter(([, item]) => item !== undefined)
    );
  }

  return value;
};

const mapUserId = (id: string, map: Record<string, string>) => map[id] || id;

const createTimelineSeed = (project: any): Omit<Timeline, 'id'>[] => {
  const startDate = project.startDate;
  const deadline = project.deadline;
  const taskIds = (project.tasks || []).map((task: any) => task.id);

  return [
    {
      projectId: '',
      title: 'Discovery & Scope',
      description: 'Collect requirements, references, and approval constraints.',
      startDate,
      endDate: startDate,
      status: project.status === 'Discovery' ? 'in-progress' : 'completed',
      type: 'phase',
      relatedTaskIds: taskIds.slice(0, 1)
    },
    {
      projectId: '',
      title: 'Design Production',
      description: 'Core production stage including iterations and client feedback loops.',
      startDate,
      endDate: deadline,
      status: project.status === 'Execution' ? 'in-progress' : 'planned',
      type: 'phase',
      relatedTaskIds: taskIds.slice(0, 2)
    },
    {
      projectId: '',
      title: 'Final Delivery Milestone',
      description: 'Final approvals, exports, and handoff package delivery.',
      startDate: deadline,
      endDate: deadline,
      status: 'planned',
      type: 'milestone',
      relatedTaskIds: taskIds
    }
  ];
};

const seedDemoDataViaAdminFunction = async (
  tenantId: string,
  adminId: string,
  options: SeedOptions = {}
): Promise<SeedResult> => {
  const demoUsers = createDemoUsers(tenantId);
  const demoProjects = createDemoProjects();

  const seedCallable = httpsCallable(functions, 'seedDemoDataAdmin');
  const response = await seedCallable({
    tenantId,
    adminId,
    replaceExisting: Boolean(options.replaceExisting),
    demoUsers,
    demoProjects,
  });

  return response.data as SeedResult;
};

/**
 * Seeds the Firebase database with demo data for testing
 * Includes: users, role collections, projects, tasks, meetings, documents, finances, timelines, activity logs
 */
export async function seedDemoData(
  tenantId: string,
  adminId: string,
  options: SeedOptions = {}
): Promise<SeedResult> {
  try {
    // Preferred path: server-side seed through Admin SDK so client Firestore rules do not block demo seeding.
    try {
      const callableResult = await seedDemoDataViaAdminFunction(tenantId, adminId, options);
      if (callableResult?.success) {
        return callableResult;
      }
      // If callable returns a controlled non-success response, surface it directly.
      if (typeof callableResult?.success === 'boolean') {
        return callableResult;
      }
    } catch (callableError) {
      console.warn('Admin callable demo seed unavailable, falling back to client seeding:', callableError);
    }

    console.log('🌱 Starting demo data seeding for tenant:', tenantId);
    
    // Check if demo data already exists for this tenant
    const existingDemo = await checkExistingDemo(tenantId);
    if (existingDemo.hasDemo && options.replaceExisting) {
      await clearDemoData(tenantId);
    }

    if (existingDemo.hasDemo && !options.replaceExisting) {
      return {
        success: false,
        message: 'Demo data already exists for this tenant. Clear existing demo data first.',
        demoUserIds: existingDemo.userIds,
        demoProjectIds: existingDemo.projectIds,
        demoProjectId: existingDemo.projectId
      };
    }

    const now = new Date().toISOString();
    const demoUsers = createDemoUsers(tenantId);
    const demoUserIds: string[] = [];

    // Seed demo users
    console.log('👥 Seeding', demoUsers.length, 'demo users...');
    const seedBatch = writeBatch(db);
    for (const user of demoUsers) {
      const userId = user.id;
      const baseUser = cleanUndefined({
        ...user,
        tenantId,
        tenantIds: user.role === Role.DESIGNER
          ? Array.from(new Set([tenantId, ...(user.tenantIds || [])]))
          : user.tenantIds,
        createdAt: now,
        createdBy: adminId,
        isDemoUser: true // Mark as demo for easy identification
      });

      seedBatch.set(doc(db, 'users', userId), baseUser);

      if (user.role === Role.DESIGNER) {
        seedBatch.set(doc(db, 'designers', userId), baseUser);
      }

      if (user.role === Role.CLIENT) {
        seedBatch.set(doc(db, 'clients', userId), baseUser);
      }

      demoUserIds.push(userId);
    }

    // Seed demo projects
    console.log('📋 Seeding demo projects...');
    const demoProjects = createDemoProjects();
    const demoProjectIds: string[] = [];
    const userIdMap: Record<string, string> = {
      'admin-1': demoUserIds[0],
      'client-1': demoUserIds[1],
      'designer-1': demoUserIds[2],
      'designer-2': demoUserIds[3],
      'client-2': demoUserIds[4]
    };

    for (let index = 0; index < demoProjects.length; index++) {
      const demoProject = demoProjects[index];
      const demoProjectRef = doc(collection(db, 'projects'));
      const projectId = demoProjectRef.id;
      const mappedClientId = mapUserId(demoProject.clientId, userIdMap);
      const mappedClientIds = ((demoProject.clientIds && demoProject.clientIds.length > 0)
        ? demoProject.clientIds
        : [demoProject.clientId]
      ).map((id) => mapUserId(id, userIdMap));

      const mappedTasks = (demoProject.tasks || []).map((task) => ({
        ...task,
        assigneeId: mapUserId(task.assigneeId, userIdMap),
        comments: (task.comments || []).map((comment) => ({
          ...comment,
          userId: mapUserId(comment.userId, userIdMap)
        }))
      }));

      const mappedMeetings = (demoProject.meetings || []).map((meeting) => ({
        ...meeting,
        attendees: (meeting.attendees || []).map((id) => mapUserId(id, userIdMap)),
        comments: (meeting.comments || []).map((comment) => ({
          ...comment,
          userId: mapUserId(comment.userId, userIdMap)
        }))
      }));

      const mappedDocuments = (demoProject.documents || []).map((document) => ({
        ...document,
        uploadedBy: mapUserId(document.uploadedBy, userIdMap),
        approvedBy: document.approvedBy ? mapUserId(document.approvedBy, userIdMap) : document.approvedBy,
        rejectedBy: document.rejectedBy ? mapUserId(document.rejectedBy, userIdMap) : document.rejectedBy,
        clientApprovedBy: document.clientApprovedBy ? mapUserId(document.clientApprovedBy, userIdMap) : document.clientApprovedBy,
        sharedWith: (document.sharedWith || []).map((id) => mapUserId(id, userIdMap)),
        comments: (document.comments || []).map((comment) => ({
          ...comment,
          userId: mapUserId(comment.userId, userIdMap)
        }))
      }));

      const mappedFinancials = (demoProject.financials || []).map((record) => ({ ...record }));

      const mappedActivityLog = (demoProject.activityLog || []).map((activity) => ({
        ...activity,
        userId: mapUserId(activity.userId, userIdMap)
      }));

      const projectData = {
        ...demoProject,
        id: projectId,
        tenantId,
        createdAt: now,
        createdBy: adminId,
        updatedAt: now,
        updatedBy: adminId,
        isDemoProject: true, // Mark as demo for easy identification
        demoProjectIndex: index + 1,
        // Update user references to seeded user IDs
        leadDesignerId: mapUserId(demoProject.leadDesignerId, userIdMap),
        teamMembers: (demoProject.teamMembers || []).map(id => mapUserId(id, userIdMap)),
        clientId: mappedClientId,
        clientIds: mappedClientIds,
        tasks: mappedTasks,
        meetings: mappedMeetings,
        documents: mappedDocuments,
        financials: mappedFinancials,
        activityLog: mappedActivityLog
      };

      seedBatch.set(demoProjectRef, cleanUndefined(projectData));

      // Seed task subcollection
      for (const task of mappedTasks) {
        const { id: taskId, ...taskData } = task as any;
        seedBatch.set(
          doc(db, 'projects', projectId, 'tasks', taskId),
          cleanUndefined({ ...taskData, createdAt: now, updatedAt: now })
        );
      }

      // Seed meetings + meeting comments subcollection
      for (const meeting of mappedMeetings) {
        const { id: meetingId, comments, ...meetingData } = meeting as any;
        seedBatch.set(
          doc(db, 'projects', projectId, 'meetings', meetingId),
          cleanUndefined({ ...meetingData, comments: comments || [], createdAt: now, updatedAt: now })
        );

        for (const comment of comments || []) {
          const { id: commentId, ...commentData } = comment as any;
          seedBatch.set(
            doc(db, 'projects', projectId, 'meetings', meetingId, 'comments', commentId),
            cleanUndefined({ ...commentData, createdAt: now })
          );
        }
      }

      // Seed documents + comments subcollection
      for (const documentRecord of mappedDocuments) {
        const { id: documentId, comments, ...documentData } = documentRecord as any;
        seedBatch.set(
          doc(db, 'projects', projectId, 'documents', documentId),
          cleanUndefined({ ...documentData, comments: comments || [], createdAt: now, updatedAt: now })
        );

        for (const comment of comments || []) {
          const { id: commentId, ...commentData } = comment as any;
          seedBatch.set(
            doc(db, 'projects', projectId, 'documents', documentId, 'comments', commentId),
            cleanUndefined({ ...commentData, createdAt: now })
          );
        }
      }

      // Seed finances subcollection
      for (const finance of mappedFinancials) {
        const { id: financeId, ...financeData } = finance as any;
        seedBatch.set(
          doc(db, 'projects', projectId, 'finances', financeId),
          cleanUndefined({ ...financeData, createdAt: now, updatedAt: now })
        );
      }

      // Seed timeline subcollection
      const timelines = createTimelineSeed(projectData).map((timeline) => ({
        ...timeline,
        projectId
      }));

      for (let timelineIndex = 0; timelineIndex < timelines.length; timelineIndex++) {
        const timeline = timelines[timelineIndex];
        const timelineId = `timeline-${timelineIndex + 1}`;
        seedBatch.set(
          doc(db, 'projects', projectId, 'timelines', timelineId),
          cleanUndefined({ ...timeline, createdAt: now, updatedAt: now })
        );
      }

      // Seed activity logs subcollection
      for (const activity of mappedActivityLog) {
        const { id: activityId, ...activityData } = activity as any;
        seedBatch.set(
          doc(db, 'projects', projectId, 'activityLogs', activityId),
          cleanUndefined({ ...activityData, createdAt: now })
        );
      }

      demoProjectIds.push(projectId);
    }

    const demoProjectId = demoProjectIds[0];

    // Commit all changes
    await seedBatch.commit();
    
    console.log('✅ Demo data seeded successfully!');
    console.log('   Users:', demoUserIds);
    console.log('   Projects:', demoProjectIds);

    return {
      success: true,
      message: 'Demo data seeded successfully',
      demoUserIds,
      demoProjectIds,
      demoProjectId
    };
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw new Error(`Failed to seed demo data: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if demo data already exists for a tenant
 */
async function checkExistingDemo(tenantId: string): Promise<ExistingDemoInfo> {
  try {
    // Check for demo users
    const demoUsersQuery = query(
      collection(db, 'users'),
      where('tenantId', '==', tenantId),
      where('isDemoUser', '==', true)
    );
    const demoUsersDocs = await getDocs(demoUsersQuery);
    
    // Check for demo project
    const demoProjectsQuery = query(
      collection(db, 'projects'),
      where('tenantId', '==', tenantId),
      where('isDemoProject', '==', true)
    );
    const demoProjectsDocs = await getDocs(demoProjectsQuery);

    if (demoUsersDocs.empty && demoProjectsDocs.empty) {
      return { hasDemo: false };
    }

    return {
      hasDemo: true,
      userIds: demoUsersDocs.docs.map(d => d.id),
      projectIds: demoProjectsDocs.docs.map(d => d.id),
      projectId: demoProjectsDocs.docs[0]?.id
    };
  } catch (error) {
    console.error('Error checking for existing demo data:', error);
    return { hasDemo: false };
  }
}

/**
 * Clear demo data from a tenant (useful for testing)
 */
export async function clearDemoData(tenantId: string): Promise<{
  success: boolean;
  deletedUsers: number;
  deletedProjects: number;
}> {
  try {
    const batch = writeBatch(db);
    let deletedUsers = 0;
    let deletedProjects = 0;

    // Find and delete demo users
    const demoUsersQuery = query(
      collection(db, 'users'),
      where('tenantId', '==', tenantId),
      where('isDemoUser', '==', true)
    );
    const demoUsersDocs = await getDocs(demoUsersQuery);
    demoUsersDocs.forEach((userDoc) => {
      batch.delete(userDoc.ref);
      batch.delete(doc(db, 'clients', userDoc.id));
      batch.delete(doc(db, 'designers', userDoc.id));
      deletedUsers++;
    });

    // Find and delete demo projects
    const demoProjectsQuery = query(
      collection(db, 'projects'),
      where('tenantId', '==', tenantId),
      where('isDemoProject', '==', true)
    );
    const demoProjectsDocs = await getDocs(demoProjectsQuery);
    for (const projectDoc of demoProjectsDocs.docs) {
      const projectId = projectDoc.id;

      const taskDocs = await getDocs(collection(db, 'projects', projectId, 'tasks'));
      taskDocs.forEach((taskDoc) => batch.delete(taskDoc.ref));

      const financeDocs = await getDocs(collection(db, 'projects', projectId, 'finances'));
      financeDocs.forEach((financeDoc) => batch.delete(financeDoc.ref));

      const timelineDocs = await getDocs(collection(db, 'projects', projectId, 'timelines'));
      timelineDocs.forEach((timelineDoc) => batch.delete(timelineDoc.ref));

      const activityLogDocs = await getDocs(collection(db, 'projects', projectId, 'activityLogs'));
      activityLogDocs.forEach((activityLogDoc) => batch.delete(activityLogDoc.ref));

      const meetingDocs = await getDocs(collection(db, 'projects', projectId, 'meetings'));
      for (const meetingDoc of meetingDocs.docs) {
        const meetingComments = await getDocs(
          collection(db, 'projects', projectId, 'meetings', meetingDoc.id, 'comments')
        );
        meetingComments.forEach((commentDoc) => batch.delete(commentDoc.ref));
        batch.delete(meetingDoc.ref);
      }

      const documentDocs = await getDocs(collection(db, 'projects', projectId, 'documents'));
      for (const documentDoc of documentDocs.docs) {
        const documentComments = await getDocs(
          collection(db, 'projects', projectId, 'documents', documentDoc.id, 'comments')
        );
        documentComments.forEach((commentDoc) => batch.delete(commentDoc.ref));
        batch.delete(documentDoc.ref);
      }

      batch.delete(projectDoc.ref);
      deletedProjects++;
    }

    await batch.commit();

    console.log('🗑️ Demo data cleared:', { deletedUsers, deletedProjects });
    return { success: true, deletedUsers, deletedProjects };
  } catch (error) {
    console.error('❌ Error clearing demo data:', error);
    throw error;
  }
}
