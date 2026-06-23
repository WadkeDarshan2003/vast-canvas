export enum Role {
  ADMIN = 'Admin',
  DESIGNER = 'Designer',
  CLIENT = 'Client',
  VENDOR = 'Vendor'
}

export interface Tenant {
  id: string;
  name: string; // Organization name (defaults to business name)
  ownerId: string; // Admin who created the tenant
  createdAt: string;
  status: 'active' | 'inactive';
  // Customization fields
  brandName?: string; // Custom brand name (fallback to "Vast Canvas Connect")
  logoUrl?: string; // Custom logo URL (fallback to "/qt=q_95.webp")
  // Optional additional branding
  primaryColor?: string; // For future theme customization
  secondaryColor?: string;
}

// Early definition - needed before header checks
export interface Meeting {
  id: string;
  date: string;
  title: string;
  attendees: string[]; // List of user IDs
  notes: string;
  type: string; // Flexible meeting type (e.g., Discovery, Progress, Site Visit, etc.)
  comments?: Comment[]; // Comments on the meeting
}

export enum ProjectStatus {
  DISCOVERY = 'Discovery',
  PLANNING = 'Planning',
  EXECUTION = 'Execution',
  COMPLETED = 'Completed',
  ON_HOLD = 'On Hold'
}

export enum ProjectType {
  DESIGN_SERVICE = 'Design Service',
  DESIGNING = 'Designing'
}

export enum ProjectCategory {
  BRANDING = 'Branding',
  WEB_DESIGN = 'Web Design',
  PRINT_DESIGN = 'Print Design',
  PACKAGING = 'Packaging',
  DIGITAL_MEDIA = 'Digital Media',
  ILLUSTRATION = 'Illustration',
  RESIDENTIAL = 'Residential',
  COMMERCIAL = 'Commercial'
}

export enum ProjectPackage {
  PACKAGE_20 = '20 Creatives p.a.',
  PACKAGE_50 = '50 Creatives p.a.',
  PACKAGE_100 = '100 Creatives p.a.',
  IMPACT = 'Impact Plan' // Renamed from CUSTOM to make it a distinct firm plan
}

export interface Package {
  id: string;
  tenantId?: string;
  name: string;
  description: string;
  creativeQuota: number;
  type: ProjectPackage;
  price?: number;
  features?: string[];
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done',
  OVERDUE = 'Overdue',
  ABORTED = 'Aborted',
  ON_HOLD = 'On Hold'
}

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string; // Acts as Login ID
  password?: string; // Acts as Password (Aadhar)
  phone?: string;
  avatar?: string;
  tenantId?: string;
  tenantIds?: string[]; // For designers: array of tenant IDs they can access (multi-tenant support - can work across multiple firms)
  company?: string; // For clients
  specialty?: string; // For designers
  authMethod?: 'email' | 'phone'; // Authentication method for vendors (email or phone-based OTP)
  createdBy?: string; // ID of the user who created this user
  createdAt?: string; // ISO timestamp of when user was created
  updatedAt?: string; // ISO timestamp of last update
  // Designer-specific fields
  skills?: string[]; // Array of design skills/specializations (e.g., "UI/UX", "Branding", "Print Design")
  certifications?: string[]; // Professional certifications
  portfolioUrl?: string; // Link to designer's portfolio
  yearsOfExperience?: number;
  hourlyRate?: number; // For designers/consultants
  maxCapacity?: number; // Maximum number of concurrent projects (0-100% capacity scale or count)
  availability?: {
    isAvailable: boolean;
    availableFrom?: string; // YYYY-MM-DD
    availableTill?: string; // YYYY-MM-DD
    workingHours?: { start: string; end: string }; // e.g., "09:00" to "18:00"
  };
  // Vendor project metrics - aggregated from all projects
  projectMetrics?: Record<string, {
    projectName: string;
    taskCount: number; // Number of completed tasks in this project
    netAmount: number; // Net amount (approved only) in this project
  }>;
  isApproved?: boolean; // Whether the user has been approved by an admin
}

export interface FinancialRecord {
  id: string;
  date: string;
  timestamp?: string; // ISO timestamp for sorting by date and time
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'designer-charge'; // Income = From Client, Expense = To Vendor, Designer-Charge = Design Fee
  status: 'paid' | 'pending' | 'overdue' | 'hold';
  category: string;
  vendorId?: string; // ID of vendor for expense tracking
  vendorName?: string; // Name of vendor for expense tracking
  paidBy?: 'client' | 'vendor' | 'designer' | 'admin' | 'other'; // Who paid (for income/expenses)
  paidByOther?: string; // Name and role for "other" paid by option (e.g., "John Smith (Partner)")
  paidByRole?: 'client' | 'vendor' | 'designer' | 'admin' | 'other'; // Role of who paid for income transactions
  receivedBy?: string; // Who received the payment (person/entity name)
  receivedByName?: string; // Name of who received the payment (for expense transactions)
  receivedByRole?: 'client' | 'vendor' | 'designer' | 'admin' | 'other' | 'client-received' | 'vendor-received' | 'designer-received' | 'admin-received' | 'other-received'; // Role of who received the payment
  paidTo?: string; // Recipient (vendor/designer name) - kept for backward compatibility
  adminApproved?: boolean; // Admin approval for billing
  clientApproved?: boolean; // Client approval for billing
  // Approvals for additional budgets
  isAdditionalBudget?: boolean; // Flag to indicate this is an additional budget increase
  clientApprovalForAdditionalBudget?: ApprovalStatus; // Client approval for additional budget
  adminApprovalForAdditionalBudget?: ApprovalStatus; // Admin approval for additional budget
  // Approvals for received payments from client
  isClientPayment?: boolean; // Flag to indicate this is a payment received from client
  clientApprovalForPayment?: ApprovalStatus; // Client approval for payment record
  adminApprovalForPayment?: ApprovalStatus; // Admin approval for payment record
  paymentMode?: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'credit_card' | 'other';
}

export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  userName?: string; // Store commenter's name for resilience when user data is unavailable
  text: string;
  timestamp: string;
  status?: 'pending' | 'done'; // Mark comment as done or pending
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface TaskApproval {
  status: ApprovalStatus;
  updatedBy?: string; // User ID
  timestamp?: string;
}

export interface ApprovalFlow {
  client: TaskApproval;
  admin: TaskApproval;
  designer?: TaskApproval;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  progress?: number; // 0-100, explicit progress tracking (independent of status)
  category: string; // e.g. Civil, Electrical, Painting
  assigneeId: string; // ID of Designer or Vendor
  startDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD (End Date)
  priority: 'low' | 'medium' | 'high';
  dependencies: string[]; // Array of Task IDs that must finish before this starts
  subtasks: SubTask[];
  comments: Comment[];
  documents?: string[]; // Array of document IDs specific to this task
  approvals: {
    start: ApprovalFlow;
    completion: ApprovalFlow;
  };
}

export enum ScheduleItemType {
  MEETING = 'Meeting',
  SITE_VISIT = 'Site Visit',
  FOCUS_WORK = 'Focus Work',
  LEAVE = 'Leave / Unavailable',
  TRAVEL = 'In Transit'
}

export type ScheduleItemStatus = 'planned' | 'in-progress' | 'completed' | 'cancelled';

export interface WorkScheduleItem {
  id: string;
  tenantId: string;
  userId: string;
  creatorId: string;
  type: ScheduleItemType;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  status: ScheduleItemStatus;
  slotType: 'first_half' | 'second_half' | 'hourly';
  startTime: string; // ISO
  endTime: string; // ISO
  projectId?: string;
  isConfirmed: boolean;
  comments: Comment[];
  googleEventId?: string;
}

export interface UserAvailability {
  userId: string;
  workingHours: {
    start: string; // e.g. "09:00"
    end: string; // e.g. "18:00"
  };
  defaultBreak?: string;
}

export interface Timeline {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  milestone?: string; // e.g., "Phase 1 Complete", "Design Approval"
  status: 'planned' | 'in-progress' | 'completed' | 'delayed';
  type: 'phase' | 'milestone' | 'deadline';
  relatedTaskIds?: string[]; // IDs of related tasks
  relatedMeetingIds?: string[]; // IDs of related meetings
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string; // e.g., "Created Task", "Approved Phase 1"
  details: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'creation';
}

export interface ProjectDocument {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'cad' | 'other';
  url: string;
  uploadedBy: string;
  uploadDate: string;
  sharedWith: string[]; // User IDs that can see this file
  comments?: Comment[]; // Comments on this document
  approvalStatus: 'pending' | 'approved' | 'rejected'; // Admin approval status
  approvedBy?: string; // Admin user ID of approver
  rejectedBy?: string; // Admin user ID of rejector
  approvalDate?: string;
  rejectionDate?: string;
  clientApprovalStatus?: 'pending' | 'approved' | 'rejected'; // Client approval status
  clientApprovedBy?: string; // Client user ID of approver
  clientApprovedDate?: string;
}

export interface CreativeCard {
  id: string;
  title?: string;
  description: string;
  status: 'in-process' | 'delivered';
  createdBy: string;
  assigneeId?: string;
  createdAt: string;
  deliveredAt?: string;
}

// Plan: Package-based creative work with fixed creative quotas (50/100/200 Creatives p.a., Impact Plan)
export interface Plan {
  id: string;
  tenantId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  name: string;
  clientId: string; // Primary client
  clientIds?: string[]; // Additional clients
  leadDesignerId: string;
  teamMembers?: string[]; // IDs of explicitly added members
  team?: User[];
  packageType: ProjectPackage; // 50/100/200 Creatives p.a. or Impact Plan
  status: ProjectStatus;

  startDate: string;
  deadline: string;
  budget: number;
  initialBudget?: number; // Original budget before any increases
  thumbnail: string;
  description: string;
  discountAmount?: number; // Optional discount applied to plan (absolute)
  discountPercent?: number; // Optional discount applied to plan (percent)

  // Creative tracking for plans
  creativeUsed: number; // Number of creatives delivered/used
  meetings: Meeting[];
  activityLog: ActivityLog[];
  documents: ProjectDocument[];
  creatives?: CreativeCard[];
}

// Project: Custom work items (print, packaging, logo design, etc.)
export interface Project {
  id: string;
  tenantId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  name: string;
  clientId: string; // Primary client
  clientIds?: string[]; // Additional clients
  leadDesignerId: string;
  teamMembers?: string[]; // IDs of explicitly added members
  vendorIds?: string[]; // IDs of vendors assigned to this project
  hiddenVendors?: string[]; // IDs of vendors hidden from certain views
  team?: User[];
  status: ProjectStatus;
  type: ProjectType; // Design Service or Full Service
  category: ProjectCategory; // Commercial or Residential
  packageType?: ProjectPackage; // For plan-based projects inside custom projects list

  startDate: string;
  deadline: string;
  budget: number;
  initialBudget?: number; // Original budget before any increases
  thumbnail: string;
  description: string;
  discountAmount?: number; // Optional discount applied to project (absolute)
  discountPercent?: number; // Optional discount applied to project (percent)
  tasks: Task[];
  financials: FinancialRecord[];
  meetings: Meeting[];
  activityLog: ActivityLog[];
  documents: ProjectDocument[];
  creatives?: CreativeCard[];
  workCards?: CreativeCard[];
  designerChargePercentage?: number; // Design fee as percentage of project budget
  // Advanced Designer Scope Fields
  designerRequirements?: string; // Detailed project requirements and specifications
  requiredSkills?: string[]; // Array of required design skills (e.g., ["UI/UX", "Brand Strategy", "Motion Design"])
  designerAllocations?: Record<string, {
    designerId: string;
    designerName?: string;
    allocatedBudget?: number; // Budget allocated for this specific designer
    skills?: string[]; // Designer's applicable skills for this project
    role?: string; // e.g., "Lead Designer", "UI Designer", "Motion Designer"
  }>;
  designerAvailabilityRequirements?: {
    fullTime: boolean;
    hoursPerWeek?: number; // If part-time
    projectDuration?: string; // Timeline duration  
  };
  clientPreferences?: {
    designStyle?: string; // e.g., "Modern Minimal", "Bold & Colorful"
    targetAudience?: string;
    competitors?: string[]; // Reference competitors or sites
  };
}

export interface Notification {
  id: string;
  recipientId?: string; // Optional: If null, global/system notification
  projectId?: string; // Context
  projectName?: string; // Project name for reference if projectId is set
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  targetTab?: string;
}
