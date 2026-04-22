# Project Bifurcation & Application Strategy

## Overview

Bifurcating projects means organizing/splitting them into separate logical groups based on a specific criteria. Your design system enables multiple bifurcation strategies using the 4 package colors as visual anchors.

---

## Strategy 1: Bifurcation by Package Level (Recommended)

### Color-Coded Project Grouping

```
Dashboard / Projects View:

┌─ STARTER PLANS (50 Creatives/Year) ─┐  ← Pink (#E91E63)
│ ▌ Client 1 Project                  │
│ ▌ Client 2 Project                  │
│ ▌ Client 3 Project                  │
└─────────────────────────────────────┘

┌─ GROWTH PLANS (100 Creatives/Year) ─┐  ← Orange (#FF9800)
│ ▌ Client 4 Project                  │
│ ▌ Client 5 Project                  │
└─────────────────────────────────────┘

┌─ BUSINESS PLANS (200 Creatives/Year) ┐ ← Teal (#009688)
│ ▌ Client 6 Project                  │
│ ▌ Client 7 Project                  │
│ ▌ Client 8 Project                  │
└─────────────────────────────────────┘

┌─ IMPACT PLANS (Custom/Premium) ────┐  ← Dark Blue (#283593)
│ ▌ VIP Client Project                │
└─────────────────────────────────────┘
```

### Implementation in Dashboard/Projects View

```tsx
// In Dashboard.tsx or Projects component

const projectsByPackage = useMemo(() => {
  return {
    STARTER: projects.filter(p => p.packageType === 'PACKAGE_50'),
    GROWTH: projects.filter(p => p.packageType === 'PACKAGE_100'),
    BUSINESS: projects.filter(p => p.packageType === 'PACKAGE_200'),
    IMPACT: projects.filter(p => p.packageType === 'CUSTOM'),
  };
}, [projects]);

const packageOrder = ['STARTER', 'GROWTH', 'BUSINESS', 'IMPACT'];

return (
  <div className="space-y-8">
    {packageOrder.map(pkg => {
      const color = getPackageColor(pkg.toLowerCase());
      const items = projectsByPackage[pkg as keyof typeof projectsByPackage];
      
      if (items.length === 0) return null;
      
      return (
        <div key={pkg}>
          {/* Section Header */}
          <div className={`border-l-4 ${color.tailwind.border} pl-4 mb-4`}>
            <h2 className={`text-xl font-bold ${color.tailwind.text}`}>
              {pkg} Plans ({items.length})
            </h2>
            <p className="text-sm text-gray-600">
              {pkg === 'STARTER' && '50 Creatives per year'}
              {pkg === 'GROWTH' && '100 Creatives per year'}
              {pkg === 'BUSINESS' && '200 Creatives per year'}
              {pkg === 'IMPACT' && 'Custom premium packages'}
            </p>
          </div>

          {/* Project Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                packageColor={color}
                onClick={() => onSelectProject(project)}
              />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);
```

---

## Strategy 2: Bifurcation by Review Status

For review management, split projects by approval stage:

```
┌─ PENDING APPROVALS ──────────────────┐  ← Yellow/Urgent
│ [Admin Approval Cards]               │
│ [Client Approval Cards]              │
└──────────────────────────────────────┘

┌─ IN REVIEW ──────────────────────────┐  ← Purple/Reviewing
│ [Timeline cards showing progress]    │
└──────────────────────────────────────┘

┌─ APPROVED & ACTIVE ──────────────────┐  ← Green/Active
│ [Execution phase cards]              │
└──────────────────────────────────────┘

┌─ COMPLETED ──────────────────────────┐  ← Gray/Done
│ [Archived project cards]             │
└──────────────────────────────────────┘
```

### Implementation

```tsx
// Separate cards by approval status
const cardsByApprovalStage = useMemo(() => {
  return {
    pending: tasks.filter(t => t.status === TaskStatus.TODO || t.status === TaskStatus.REVIEW),
    active: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS),
    completed: tasks.filter(t => t.status === TaskStatus.DONE),
    blocked: tasks.filter(t => t.status === TaskStatus.ON_HOLD || t.status === TaskStatus.ABORTED)
  };
}, [tasks]);

// Render with section headers
<section className="mb-8">
  <h3 className="text-lg font-bold text-yellow-700 mb-4 flex items-center gap-2">
    ⏳ Pending Approvals ({cardsByApprovalStage.pending.length})
  </h3>
  <div className="grid gap-3">
    {cardsByApprovalStage.pending.map(task => (
      // Render AdminApprovalCard or ClientApprovalCard
    ))}
  </div>
</section>
```

---

## Strategy 3: Bifurcation by Role

Different views for different user roles:

```
ADMIN VIEW:
├── All Projects (All packages)
├── Pending Approvals Section
├── Team Management
├── Financial Dashboard
└── All Timeline Views

CLIENT VIEW:
├── My Projects (Package grouped)
├── Approvals Needed From Me
├── Documents to Review
└── Status Updates

DESIGNER VIEW:
├── My Assigned Tasks
├── In-Progress Work
├── Task Deadlines
└── My Performance Metrics

VENDOR VIEW:
├── Assigned Tasks Only
├── Time Tracking
├── Payment Records
└── Performance History
```

### Implementation

```tsx
// In Dashboard.tsx conditional rendering

if (user.role === Role.ADMIN) {
  return <AdminDashboard />;
} else if (user.role === Role.CLIENT) {
  return <ClientDashboard />;
} else if (user.role === Role.DESIGNER) {
  return <DesignerDashboard />;
} else if (user.role === Role.VENDOR) {
  return <VendorDashboard />;
}
```

---

## Strategy 4: Bifurcation by Project Phase

Split projects by their current workflow stage:

```
┌─ DISCOVERY PHASE ────────────────────┐  ← Light Blue
│ [Projects in discovery phase]        │
│ [Gathering requirements & ideas]     │
└──────────────────────────────────────┘

┌─ PLANNING PHASE ─────────────────────┐  ← Teal (Strategy 1)
│ [Projects in planning phase]         │
│ [Timeline, roadmap, resource planning]
└──────────────────────────────────────┘

┌─ EXECUTION PHASE ────────────────────┐  ← Blue
│ [Active projects]                    │
│ [Designs in progress, deliverables]  │
└──────────────────────────────────────┘

┌─ REVIEW & APPROVAL PHASE ───────────┐  ← Purple
│ [Waiting for client/admin approval]  │
└──────────────────────────────────────┘

┌─ COMPLETED ──────────────────────────┐  ← Green
│ [Finished projects]                  │
│ [Final deliverables handed over]     │
└──────────────────────────────────────┘
```

### Implementation

```tsx
const projectsByPhase = useMemo(() => {
  return {
    discovery: projects.filter(p => p.status === ProjectStatus.DISCOVERY),
    planning: projects.filter(p => p.status === ProjectStatus.PLANNING),
    execution: projects.filter(p => p.status === ProjectStatus.EXECUTION),
    review: projects.filter(p => p.status === ProjectStatus.ON_HOLD),
    completed: projects.filter(p => p.status === ProjectStatus.COMPLETED),
  };
}, [projects]);

const phases = [
  { key: 'discovery', label: 'Discovery', color: 'blue', icon: Lightbulb },
  { key: 'planning', label: 'Planning', color: 'cyan', icon: Layers },
  { key: 'execution', label: 'Execution', color: 'indigo', icon: Zap },
  { key: 'review', label: 'In Review', color: 'purple', icon: Clock },
  { key: 'completed', label: 'Completed', color: 'green', icon: CheckCircle },
];

return phases.map(phase => (
  <PhaseSection
    key={phase.key}
    phase={phase}
    projects={projectsByPhase[phase.key as keyof typeof projectsByPhase]}
  />
));
```

---

## Strategy 5: Hybrid Approach (Recommended)

Combine multiple strategies:

```
PRIMARY SPLIT: By Package Level
└── SECONDARY SPLIT: By Project Status
    └── TERTIARY SPLIT: By Review Status

Example Structure:

STARTER PLANS (Pink)
├── Active Projects
│   ├── Pending Approvals
│   ├── In Review
│   └── In Progress
├── Completed Projects
│   └── Archived

GROWTH PLANS (Orange)
├── Active Projects
│   ├── Pending Approvals
│   ├── In Review
│   └── In Progress
├── Completed Projects
│   └── Archived

... (BUSINESS, IMPACT)
```

### Implementation

```tsx
const projectsHierarchy = useMemo(() => {
  const result: Record<string, Record<string, Record<string, Project[]>>> = {};
  
  // Level 1: By Package
  projects.forEach(p => {
    const pkgType = p.packageType || 'CUSTOM';
    if (!result[pkgType]) result[pkgType] = {};
    
    // Level 2: By Status
    const status = p.status;
    if (!result[pkgType][status]) result[pkgType][status] = {};
    
    // Level 3: By Approval
    const approval = getProjectApprovalStatus(p);
    if (!result[pkgType][status][approval]) {
      result[pkgType][status][approval] = [];
    }
    result[pkgType][status][approval].push(p);
  });
  
  return result;
}, [projects]);
```

---

## Visual Hierarchy for Bifurcation

### Header Styling by Level

```
LEVEL 1 (Package):
  Font Size:   20px (text-2xl)
  Font Weight: 700 (bold)
  Color:       Package color (hex)
  Border:      3px left border in package color
  Spacing:     mb-8 (bottom margin)

LEVEL 2 (Status/Phase):
  Font Size:   16px (text-lg)
  Font Weight: 600 (semibold)
  Color:       Gray-700
  Border:      1px subtle line
  Spacing:     mb-4

LEVEL 3 (Sub-categories):
  Font Size:   14px (text-base)
  Font Weight: 600 (semibold)
  Color:       Gray-600
  Border:      None
  Spacing:     mb-3
```

### Example Full Implementation

```tsx
<div className="space-y-12">
  {/* LEVEL 1: Package Groups */}
  {packageOrder.map(pkg => {
    const color = getPackageColor(pkg.toLowerCase());
    const projects = projectsByPackage[pkg];
    
    return (
      <div key={pkg}>
        {/* Header */}
        <div className={`border-l-4 ${color.tailwind.border} pl-4 mb-8`}>
          <h1 className={`text-2xl font-bold ${color.tailwind.text}`}>
            {pkg} Plans
          </h1>
        </div>

        {/* LEVEL 2: Status Groups */}
        <div className="space-y-8 ml-4">
          {statusOrder.map(status => {
            const items = projects.filter(p => p.status === status);
            if (items.length === 0) return null;
            
            return (
              <div key={status}>
                <h2 className="text-lg font-semibold text-gray-700 mb-4">
                  {status} ({items.length})
                </h2>

                {/* LEVEL 3: Approval Status */}
                <div className="space-y-6">
                  {approvalOrder.map(approval => {
                    const approved = items.filter(p => 
                      getApprovalStatus(p) === approval
                    );
                    if (approved.length === 0) return null;
                    
                    return (
                      <div key={approval}>
                        <h3 className="text-base font-semibold text-gray-600 mb-3">
                          {approval}
                        </h3>
                        
                        {/* Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {approved.map(project => (
                            <ProjectCardComponent
                              key={project.id}
                              project={project}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  })}
</div>
```

---

## Dashboard Sections with Bifurcation

### Example Dashboard Layout

```
┌─────────────────────────────────────────────────────┐
│ DASHBOARD                                           │
├─────────────────────────────────────────────────────┤
│                                                     │
│ QUICK STATS (if Admin)                              │
│ Total Projects | Active | In Review | Completed    │
│                                                     │
│ BIFURCATED VIEWS (Choose one):                      │
│ [By Package] [By Status] [By Phase] [By Approval]  │
│                                                     │
│ PENDING APPROVALS (Priority)                        │
│ [Timeline cards showing urgent approvals]          │
│                                                     │
│ PROJECTS BY PACKAGE (Primary Bifurcation)           │
│                                                     │
│ ▌ STARTER (Pink) - 3 projects                      │
│   ├─ Pending Review: [Cards]                       │
│   ├─ In Progress: [Cards]                          │
│   └─ Completed: [Cards]                            │
│                                                     │
│ ▌ GROWTH (Orange) - 5 projects                     │
│   ├─ Pending Review: [Cards]                       │
│   ├─ In Progress: [Cards]                          │
│   └─ Completed: [Cards]                            │
│                                                     │
│ ▌ BUSINESS (Teal) - 7 projects                     │
│   ├─ Pending Review: [Cards]                       │
│   ├─ In Progress: [Cards]                          │
│   └─ Completed: [Cards]                            │
│                                                     │
│ ▌ IMPACT (Blue) - 1 project                        │
│   └─ In Progress: [Cards]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Filter & Toggle UI

```
┌─ View Options ──────────────────────────────┐
│ Bifurcate By:                               │
│ [By Package ✓] [By Status] [By Phase] [By Role] │
│                                              │
│ Show:                                        │
│ [Pending] [Active] [Completed] [Archived]   │
│                                              │
│ Package Filter:                              │
│ [All] [Starter] [Growth] [Business] [Impact]│
└─────────────────────────────────────────────┘
```

### Implementation

```tsx
const [bifurcateBy, setBifurcateBy] = useState<'package' | 'status' | 'phase' | 'role'>('package');
const [statusFilter, setStatusFilter] = useState<ProjectStatus[]>([...all]);
const [packageFilter, setPackageFilter] = useState<ProjectPackage[]>([...all]);

// Render bifurcated view
{bifurcateBy === 'package' && <BiByPackage />}
{bifurcateBy === 'status' && <BiByStatus />}
{bifurcateBy === 'phase' && <BiByPhase />}
{bifurcateBy === 'role' && <BiByRole />}
```

---

## Key Takeaways

✅ **Use package colors** to visually anchor different project groupings
✅ **Combine multiple bifurcation levels** for clarity
✅ **Maintain consistent card styling** across all bifurcations
✅ **Use timeline cards** for approval items in any bifurcation
✅ **Provide filter/view options** so users can switch bifurcation methods
✅ **Preserve user preference** in localStorage for last-used bifurcation method

---

## Implementation Roadmap

1. ✅ Create color system (DONE)
2. ✅ Create card components (DONE)
3. 📝 **Implement Package-based bifurcation** (NEXT)
4. 📝 Add filtering UI
5. 📝 Implement alternative bifurcation methods
6. 📝 Add user preference storage
7. 📝 Test all bifurcation combinations
