import { Project, Task, Meeting, ProjectStatus, ProjectType, ProjectCategory, TaskStatus, FinancialRecord, ProjectDocument, ActivityLog } from '../types';

/**
 * Demo Project Seed - Create a sample advanced project with designers scope
 */
export const createDemoProject = (): Omit<Project, 'id'> => {
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 5);
  const deadline = new Date(today);
  deadline.setDate(deadline.getDate() + 30);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  const demoTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Brand Strategy & Discovery',
      description: 'Initial brand positioning, market analysis, and brand guidelines setup',
      status: TaskStatus.DONE,
      progress: 100,
      category: 'Branding',
      assigneeId: 'designer-1',
      startDate: formatDate(startDate),
      dueDate: formatDate(new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
      priority: 'high',
      dependencies: [],
      subtasks: [
        { id: 'subtask-1', title: 'Market Research', isCompleted: true },
        { id: 'subtask-2', title: 'Competitor Analysis', isCompleted: true },
        { id: 'subtask-3', title: 'Brand Positioning', isCompleted: true },
      ],
      comments: [
        {
          id: 'comment-1',
          userId: 'designer-1',
          userName: 'Sarah Designer',
          text: 'Great brand direction! The research shows strong market differentiation potential.',
          timestamp: new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'done'
        }
      ],
      approvals: {
        start: { client: { status: 'approved' }, admin: { status: 'approved' } },
        completion: { client: { status: 'approved' }, admin: { status: 'approved' } }
      }
    },
    {
      id: 'task-2',
      title: 'Visual Identity Design',
      description: 'Logo design, color palette, and typography system creation',
      status: TaskStatus.IN_PROGRESS,
      progress: 65,
      category: 'Branding',
      assigneeId: 'designer-1',
      startDate: formatDate(new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
      dueDate: formatDate(new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000)),
      priority: 'high',
      dependencies: ['task-1'],
      subtasks: [
        { id: 'subtask-4', title: 'Logo Concepts (5 variations)', isCompleted: true },
        { id: 'subtask-5', title: 'Color Palette Development', isCompleted: true },
        { id: 'subtask-6', title: 'Typography Selection', isCompleted: false },
        { id: 'subtask-7', title: 'Icon Set Creation', isCompleted: false },
      ],
      comments: [],
      approvals: {
        start: { client: { status: 'pending' }, admin: { status: 'approved' } },
        completion: { client: { status: 'pending' }, admin: { status: 'pending' } }
      }
    },
    {
      id: 'task-3',
      title: 'Marketing Collateral Design',
      description: 'Business cards, letterhead, social media templates, and marketing materials',
      status: TaskStatus.TODO,
      progress: 0,
      category: 'Print Design',
      assigneeId: 'designer-2',
      startDate: formatDate(new Date(startDate.getTime() + 10 * 24 * 60 * 60 * 1000)),
      dueDate: formatDate(deadline),
      priority: 'medium',
      dependencies: ['task-2'],
      subtasks: [
        { id: 'subtask-8', title: 'Business Card Design', isCompleted: false },
        { id: 'subtask-9', title: 'Letterhead & Envelope', isCompleted: false },
        { id: 'subtask-10', title: 'Social Media Templates', isCompleted: false },
      ],
      comments: [],
      approvals: {
        start: { client: { status: 'pending' }, admin: { status: 'pending' } },
        completion: { client: { status: 'pending' }, admin: { status: 'pending' } }
      }
    }
  ];

  const demoMeetings: Meeting[] = [
    {
      id: 'meeting-1',
      date: formatDate(new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000)),
      title: 'Brand Strategy Kickoff',
      attendees: ['admin-1', 'designer-1', 'client-1'],
      notes: 'Discussed initial brand directions, market positioning, and timeline. Client approved 3 out of 5 concepts.',
      type: 'Discovery',
      comments: [
        {
          id: 'meet-comment-1',
          userId: 'admin-1',
          userName: 'Admin User',
          text: 'Great session! Moving forward with the approved direction.',
          timestamp: new Date(startDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    },
    {
      id: 'meeting-2',
      date: formatDate(new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)),
      title: 'Visual Identity Review - Round 1',
      attendees: ['admin-1', 'designer-1', 'client-1'],
      notes: 'Presented 5 logo variations. Client feedback on color palette preferences and refinements needed.',
      type: 'Progress',
      comments: []
    },
    {
      id: 'chat-1',
      date: new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Client + Lead Designer Direct Chat',
      attendees: ['client-1', 'designer-1'],
      notes: 'Direct thread for quick design clarifications.',
      type: 'direct-chat',
      comments: [
        {
          id: 'chat-1-msg-1',
          userId: 'client-1',
          userName: 'Client Contact',
          text: 'Can we explore a softer accent color for social creatives?',
          timestamp: new Date(startDate.getTime() + 4.2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'chat-1-msg-2',
          userId: 'designer-1',
          userName: 'Sarah Designer',
          text: 'Absolutely. I will share two alternate palettes by evening.',
          timestamp: new Date(startDate.getTime() + 4.25 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    },
    {
      id: 'chat-2',
      date: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      title: 'Branding Project Group',
      attendees: ['admin-1', 'designer-1', 'designer-2', 'client-1'],
      notes: 'Group thread for milestones, approvals, and delivery updates.',
      type: 'group-chat',
      comments: [
        {
          id: 'chat-2-msg-1',
          userId: 'admin-1',
          userName: 'Admin User',
          text: 'Team, we are targeting final identity approval by Friday.',
          timestamp: new Date(startDate.getTime() + 7.05 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'chat-2-msg-2',
          userId: 'designer-2',
          userName: 'Mike Creative',
          text: 'Collateral drafts are 60% ready. I will upload by tomorrow noon.',
          timestamp: new Date(startDate.getTime() + 7.15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 'chat-2-msg-3',
          userId: 'client-1',
          userName: 'Client Contact',
          text: 'Perfect, sharing stakeholder comments after internal review.',
          timestamp: new Date(startDate.getTime() + 7.2 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    }
  ];

  const demoFinancials: FinancialRecord[] = [
    {
      id: 'fin-1',
      date: formatDate(startDate),
      timestamp: startDate.toISOString(),
      description: 'Initial Project Budget - Brand Identity Design',
      amount: 150000,
      type: 'income',
      status: 'pending',
      category: 'Project Budget',
      paymentMode: 'bank_transfer',
      paidBy: 'client',
      paidByRole: 'client',
      receivedBy: 'Studio Account',
      adminApproved: false,
      clientApproved: false
    },
    {
      id: 'fin-2',
      date: formatDate(new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
      timestamp: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      description: 'Designer Charge - Sarah (Brand Strategy & Discovery)',
      amount: 45000,
      type: 'designer-charge',
      status: 'pending',
      category: 'Designer Fee',
      paidByRole: 'admin',
      receivedByName: 'Sarah Designer',
      receivedByRole: 'designer-received',
      adminApproved: true,
      clientApproved: false,
    }
  ];

  const demoDocuments: ProjectDocument[] = [
    {
      id: 'doc-1',
      name: 'Brand Strategy Presentation.pdf',
      type: 'pdf',
      url: 'https://via.placeholder.com/500x300?text=Brand+Strategy',
      uploadedBy: 'designer-1',
      uploadDate: formatDate(new Date(startDate.getTime() + 2 * 24 * 60 * 60 * 1000)),
      sharedWith: ['admin-1', 'client-1', 'designer-1'],
      approvalStatus: 'approved',
      approvedBy: 'admin-1',
      approvalDate: formatDate(new Date(startDate.getTime() + 2.5 * 24 * 60 * 60 * 1000)),
      comments: []
    },
    {
      id: 'doc-2',
      name: 'Logo Concepts - Round 1.pdf',
      type: 'pdf',
      url: 'https://via.placeholder.com/500x300?text=Logo+Concepts',
      uploadedBy: 'designer-1',
      uploadDate: formatDate(new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000)),
      sharedWith: ['admin-1', 'client-1', 'designer-1'],
      approvalStatus: 'pending',
      comments: [
        {
          id: 'doc-comment-1',
          userId: 'client-1',
          userName: 'Client Contact',
          text: 'Love concepts 2 and 4! Can we explore variations with these?',
          timestamp: new Date(startDate.getTime() + 5.5 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    },
    {
      id: 'doc-3',
      name: 'Social Media Key Visual - Option A.png',
      type: 'image',
      url: '/demo-gallery/social-key-visual-a.svg',
      uploadedBy: 'designer-2',
      uploadDate: formatDate(new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)),
      sharedWith: ['admin-1', 'client-1', 'designer-1', 'designer-2'],
      approvalStatus: 'approved',
      approvedBy: 'admin-1',
      approvalDate: formatDate(new Date(startDate.getTime() + 7.25 * 24 * 60 * 60 * 1000)),
      comments: [
        {
          id: 'doc-comment-2',
          userId: 'admin-1',
          userName: 'Admin User',
          text: 'Looks strong for campaign launch. Please prepare resized exports.',
          timestamp: new Date(startDate.getTime() + 7.3 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ]
    },
    {
      id: 'doc-4',
      name: 'Moodboard Exploration.jpg',
      type: 'image',
      url: '/demo-gallery/moodboard-exploration.svg',
      uploadedBy: 'designer-1',
      uploadDate: formatDate(new Date(startDate.getTime() + 8 * 24 * 60 * 60 * 1000)),
      sharedWith: ['admin-1', 'client-1', 'designer-1', 'designer-2'],
      approvalStatus: 'pending',
      comments: []
    },
    {
      id: 'doc-5',
      name: 'Packaging Dieline Preview.svg',
      type: 'image',
      url: '/demo-gallery/packaging-dieline-preview.svg',
      uploadedBy: 'designer-2',
      uploadDate: formatDate(new Date(startDate.getTime() + 9 * 24 * 60 * 60 * 1000)),
      sharedWith: ['admin-1', 'designer-2'],
      approvalStatus: 'pending',
      comments: []
    }
  ];

  const demoActivityLog: ActivityLog[] = [
    {
      id: 'activity-1',
      userId: 'admin-1',
      action: 'Project Created',
      details: 'Brand Identity & Branding package project initialized with advanced designer scope',
      timestamp: formatDate(startDate),
      type: 'creation'
    },
    {
      id: 'activity-2',
      userId: 'designer-1',
      action: 'Task Completed',
      details: 'Brand Strategy & Discovery phase completed with 100% progress',
      timestamp: formatDate(new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000)),
      type: 'success'
    },
    {
      id: 'activity-3',
      userId: 'client-1',
      action: 'Document Reviewed',
      details: 'Client reviewed Logo Concepts - Round 1 and provided feedback',
      timestamp: formatDate(new Date(startDate.getTime() + 5.5 * 24 * 60 * 60 * 1000)),
      type: 'info'
    },
    {
      id: 'activity-4',
      userId: 'designer-1',
      action: 'Task In Progress',
      details: 'Visual Identity Design moved to In Progress (65% complete)',
      timestamp: formatDate(today),
      type: 'info'
    }
  ];

  return {
    name: 'Modern Brand Identity Design',
    clientId: 'client-1',
    clientIds: ['client-1'],
    leadDesignerId: 'designer-1',
    teamMembers: ['designer-1', 'designer-2'],
    team: [],
    status: ProjectStatus.EXECUTION,
    type: ProjectType.DESIGNING,
    category: ProjectCategory.BRANDING,
    startDate: formatDate(startDate),
    deadline: formatDate(deadline),
    budget: 150000,
    initialBudget: 150000,
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=500&h=300',
    description: 'Complete brand identity redesign for a modern tech startup. Includes strategy, visual identity design, and marketing collateral. This is a demo project showcasing the advanced designer scope with multi-designer collaboration.',
    tasks: demoTasks,
    financials: demoFinancials,
    meetings: demoMeetings,
    documents: demoDocuments,
    activityLog: demoActivityLog,
    createdAt: formatDate(startDate),
    createdBy: 'admin-1',
    updatedAt: formatDate(today),
    updatedBy: 'designer-1',
    tenantId: 'demo-tenant',
    // Advanced Designer Scope Fields
    designerRequirements: 'Create a modern, minimalist brand identity that appeals to tech-savvy millennials. Must include logo system, complete color palette, bold typography, and cohesive marketing collateral. Brand should communicate innovation, trust, and growth.',
    requiredSkills: ['UI/UX Design', 'Brand Strategy', 'Visual Design', 'Motion Design', 'Print Design'],
    clientPreferences: {
      designStyle: 'Modern Minimal with Bold Accents',
      targetAudience: 'Tech professionals, 25-45 years old, high income',
      competitors: ['Figma', 'Adobe Creative Cloud', 'InVision']
    },
    designerAvailabilityRequirements: {
      fullTime: true,
      projectDuration: '4-6 weeks'
    }
  };
};

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const createDemoProjects = (): Omit<Project, 'id'>[] => {
  const base = createDemoProject();

  const webProject = deepClone(base);
  webProject.name = 'SaaS Product Website Redesign';
  webProject.category = ProjectCategory.WEB_DESIGN;
  webProject.status = ProjectStatus.PLANNING;
  webProject.budget = 220000;
  webProject.initialBudget = 220000;
  webProject.description =
    'Complete web redesign for a SaaS startup with responsive pages, landing sections, and reusable design system components.';
  webProject.requiredSkills = ['Web Design', 'UI Design', 'UX Research', 'Responsive Layout'];
  webProject.clientPreferences = {
    designStyle: 'Clean SaaS layout with conversion-focused sections',
    targetAudience: 'Startup founders, marketing teams, product managers',
    competitors: ['Webflow', 'Framer', 'HubSpot']
  };
  webProject.tasks = webProject.tasks.map((task, index) => ({
    ...task,
    id: `web-task-${index + 1}`,
    title:
      index === 0
        ? 'Website Discovery & IA Mapping'
        : index === 1
          ? 'Landing Page UI & Components'
          : 'Responsive Pages & QA Handoff',
    category: index === 2 ? 'Web Design' : task.category,
    status: index === 0 ? TaskStatus.DONE : index === 1 ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
    progress: index === 0 ? 100 : index === 1 ? 55 : 0,
    dependencies: index === 0 ? [] : [`web-task-${index}`],
    subtasks: (task.subtasks || []).map((subtask, subIndex) => ({
      ...subtask,
      id: `web-subtask-${index + 1}-${subIndex + 1}`,
      isCompleted: index === 0 ? true : subtask.isCompleted
    })),
    comments: (task.comments || []).map((comment, commentIndex) => ({
      ...comment,
      id: `web-comment-${index + 1}-${commentIndex + 1}`
    }))
  }));
  webProject.meetings = webProject.meetings.map((meeting, index) => ({
    ...meeting,
    id: `web-meeting-${index + 1}`,
    title:
      index === 0
        ? 'Website Discovery Kickoff'
        : index === 1
          ? 'Homepage Review Session'
          : meeting.title
  }));
  webProject.financials = webProject.financials.map((financial, index) => ({
    ...financial,
    id: `web-fin-${index + 1}`,
    description:
      index === 0
        ? 'Initial Project Budget - SaaS Website Redesign'
        : 'Designer Charge - Web UI System Development'
  }));
  webProject.documents = webProject.documents.map((document, index) => ({
    ...document,
    id: `web-doc-${index + 1}`,
    name:
      index === 0
        ? 'Website Sitemap & Wireframes.pdf'
        : index === 1
          ? 'Homepage Concepts - Round 1.pdf'
          : document.name
  }));
  webProject.activityLog = webProject.activityLog.map((activity, index) => ({
    ...activity,
    id: `web-activity-${index + 1}`
  }));

  const packagingProject = deepClone(base);
  packagingProject.name = 'Premium Product Packaging Suite';
  packagingProject.category = ProjectCategory.PACKAGING;
  packagingProject.status = ProjectStatus.DISCOVERY;
  packagingProject.budget = 175000;
  packagingProject.initialBudget = 175000;
  packagingProject.description =
    'End-to-end packaging design for premium consumer products, including dielines, print-ready artwork, and shelf mockups.';
  packagingProject.requiredSkills = ['Packaging', 'Print Design', 'Visual Design', 'Brand Strategy'];
  packagingProject.clientPreferences = {
    designStyle: 'Luxury minimal packaging with strong shelf presence',
    targetAudience: 'Urban premium buyers, 22-40 years old',
    competitors: ['Minimalist Labs', 'Paper Boat', 'RAW Pressery']
  };
  packagingProject.tasks = packagingProject.tasks.map((task, index) => ({
    ...task,
    id: `pkg-task-${index + 1}`,
    title:
      index === 0
        ? 'Packaging Strategy & Material Research'
        : index === 1
          ? 'Primary Pack Visual Concepts'
          : 'Print Production & Vendor Prep',
    category: 'Packaging',
    status: index === 0 ? TaskStatus.IN_PROGRESS : TaskStatus.TODO,
    progress: index === 0 ? 40 : 0,
    dependencies: index === 0 ? [] : [`pkg-task-${index}`],
    subtasks: (task.subtasks || []).map((subtask, subIndex) => ({
      ...subtask,
      id: `pkg-subtask-${index + 1}-${subIndex + 1}`,
      isCompleted: false
    })),
    comments: (task.comments || []).map((comment, commentIndex) => ({
      ...comment,
      id: `pkg-comment-${index + 1}-${commentIndex + 1}`
    }))
  }));
  packagingProject.meetings = packagingProject.meetings.map((meeting, index) => ({
    ...meeting,
    id: `pkg-meeting-${index + 1}`,
    title:
      index === 0
        ? 'Packaging Discovery Workshop'
        : index === 1
          ? 'Material & Cost Review'
          : meeting.title
  }));
  packagingProject.financials = packagingProject.financials.map((financial, index) => ({
    ...financial,
    id: `pkg-fin-${index + 1}`,
    description:
      index === 0
        ? 'Initial Project Budget - Packaging Design'
        : 'Designer Charge - Packaging Concept Development'
  }));
  packagingProject.documents = packagingProject.documents.map((document, index) => ({
    ...document,
    id: `pkg-doc-${index + 1}`,
    name:
      index === 0
        ? 'Packaging Research Deck.pdf'
        : index === 1
          ? 'Packaging Concepts - Round 1.pdf'
          : document.name
  }));
  packagingProject.activityLog = packagingProject.activityLog.map((activity, index) => ({
    ...activity,
    id: `pkg-activity-${index + 1}`
  }));

  return [base, webProject, packagingProject];
};
