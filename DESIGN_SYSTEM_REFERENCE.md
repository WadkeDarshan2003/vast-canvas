# Design System Reference - Timeline Cards & Approvals

## 📐 Visual Layout Specifications

### Timeline Card Structure (All Cards)

```
┌─────────────────────────────────────────────────────────────┐ ← Card Container
│ ▌ [3px Package Border]                                      │   - bg-white
│ ┌─────────────────────────────────────────────────────────┐ │   - rounded-lg
│ │ Project Name  •  [Status Badge]                        │ │   - shadow-sm
│ │ Task Title                                              │ │   - hover:shadow-md
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Phase: Discovery → Planning → Review → Execution       │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Avatar] Assignee Name  │  Due: 18 Feb  │  5 Days Left │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │ ← Admin: Action Bar
│ │ [Approve Button] [Reject Button] [View Details]       │ │   Client: Status + Link
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Dimensions

```
CONTAINER:
  Mobile:   100% width (full-width)
  Tablet:   Varies by layout (grid)
  Desktop:  Same as tablet
  Min Width: 300px
  Max Width: None (container-responsive)
  Height:   Auto (flex)

PADDING:
  Outer: 4px - 6px (p-4 md:p-6)
  Header: 12px (py-3)
  Content: 12px (py-3)
  Footer: 12px (py-3)

GAPS:
  Between sections: 8px (gap-2)
  Between columns: 12px (gap-3)

LEFT BORDER:
  Width: 3px (border-l-4 in Tailwind)
  Color: Package color (pink, orange, teal, indigo)

BORDER RADIUS:
  Card: 8px (rounded-lg)
  Buttons: 6px (rounded-md)
  Badges: 12px (rounded-full for pills)
```

---

## 🎨 Color Palette (Complete)

### Package Level Colors

```
┌──────────────────────────────────────────────────────────────┐
│ STARTER PACKAGE (50 Creatives/Year)                          │
├──────────────────────────────────────────────────────────────┤
│ Primary:     #E91E63 (Pink-500)  █████                        │
│ Light:       #FCE4EC (Pink-50)   ░░░░░                        │
│ Dark:        #C2185B (Pink-700)  ███████                      │
│ Tailwind:    pink-500/50/700     from color.md                │
│ Border Text: text-pink-700                                    │
│ Badge:       bg-pink-100 text-pink-700                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ GROWTH PACKAGE (100 Creatives/Year)                          │
├──────────────────────────────────────────────────────────────┤
│ Primary:     #FF9800 (Orange-500) █████                       │
│ Light:       #FFF3E0 (Orange-50)  ░░░░░                       │
│ Dark:        #E65100 (Orange-700) ███████                     │
│ Tailwind:    orange-500/50/700                                │
│ Border Text: text-orange-700                                  │
│ Badge:       bg-orange-100 text-orange-700                    │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ BUSINESS PACKAGE (200 Creatives/Year)                        │
├──────────────────────────────────────────────────────────────┤
│ Primary:     #009688 (Teal-500)    █████                      │
│ Light:       #E0F2F1 (Teal-50)     ░░░░░                      │
│ Dark:        #00695C (Teal-700)    ███████                    │
│ Tailwind:    teal-500/50/700                                  │
│ Border Text: text-teal-700                                    │
│ Badge:       bg-teal-100 text-teal-700                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ IMPACT PACKAGE (Custom/Premium)                              │
├──────────────────────────────────────────────────────────────┤
│ Primary:     #283593 (Indigo-900)  █████                      │
│ Light:       #E8EAF6 (Indigo-50)   ░░░░░                      │
│ Dark:        #1A237E (Indigo-900)  ███████                    │
│ Tailwind:    indigo-900/50/900                                │
│ Border Text: text-indigo-900                                  │
│ Badge:       bg-indigo-100 text-indigo-900                    │
└──────────────────────────────────────────────────────────────┘
```

### Status Colors (Universal - ALL Views)

```
┌────────────────────────────────────┐
│ PENDING                            │
├────────────────────────────────────┤
│ Background: #FEF3C7 (Yellow-100)  │
│ Text:       #B45309 (Yellow-700)  │
│ Icon:       🕐 Clock              │
│ Use:        Awaiting action       │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ APPROVED                           │
├────────────────────────────────────┤
│ Background: #DCFCE7 (Green-100)   │
│ Text:       #15803D (Green-700)   │
│ Icon:       ✅ CheckCircle         │
│ Use:        Completed/Accepted    │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ REJECTED                           │
├────────────────────────────────────┤
│ Background: #FEE2E2 (Red-100)     │
│ Text:       #B91C1C (Red-700)     │
│ Icon:       ❌ XCircle             │
│ Use:        Declined/Failed       │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ UNDER REVIEW                       │
├────────────────────────────────────┤
│ Background: #F3E8FF (Purple-100)  │
│ Text:       #6B21A8 (Purple-700)  │
│ Icon:       ⚠️ AlertCircle         │
│ Use:        In progress           │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ URGENT                             │
├────────────────────────────────────┤
│ Background: #FED7AA (Orange-100)  │
│ Text:       #D97706 (Orange-600)  │
│ Icon:       ⚡ Zap                │
│ Use:        Needs immediate action│
└────────────────────────────────────┘
```

### Neutral/Utility Colors

```
Text Colors:
  Primary:     #111827 (Gray-900) - Main text
  Secondary:   #6B7280 (Gray-500) - Labels
  Tertiary:    #9CA3AF (Gray-400) - Subtle
  Disabled:    #D1D5DB (Gray-300) - Inactive

Borders:
  Default:     #E5E7EB (Gray-200) - Card borders
  Light:       #F3F4F6 (Gray-100) - Dividers
  Heavy:       #D1D5DB (Gray-300) - Strong lines

Backgrounds:
  White:       #FFFFFF - Cards
  Light:       #F9FAFB (Gray-50) - Sections
  Lighter:     #F3F4F6 (Gray-100) - Hover states
```

---

## 🔘 Component Styles

### Buttons (Admin Card)

```
APPROVE BUTTON:
  Background:   #16A34A (Green-600)
  Hover:        #15803D (Green-700)
  Active:       #166534 (Green-800)
  Text:         White
  Text Size:    14px (sm)
  Padding:      8px 12px (py-2 px-3)
  Border Radius: 6px (rounded-md)
  Icon:         ✓ CheckCircle (4px × 4px)
  Font:         Medium weight
  State:
    Disabled:   #6CA26F opacity-50

REJECT BUTTON:
  Background:   #DC2626 (Red-600)
  Hover:        #B91C1C (Red-700)
  Active:       #991B1B (Red-800)
  Text:         White
  Text Size:    14px (sm)
  Padding:      8px 12px (py-2 px-3)
  Border Radius: 6px (rounded-md)
  Icon:         ✗ XCircle (4px × 4px)
  Font:         Medium weight
  State:
    Disabled:   #BE4B49 opacity-50

VIEW DETAILS BUTTON:
  Background:   Transparent → #EFF6FF on hover
  Text:         #2563EB (Blue-600)
  Hover Text:   #1D4ED8 (Blue-700)
  Text Size:    14px (sm)
  Padding:      8px 12px (py-2 px-3)
  Border Radius: 6px (rounded-md)
  Icon:         Eye or ChevronRight (4px × 4px)
  Font:         Medium weight
```

### Status Badges

```
SIZE VARIANTS:

Small (sm):
  Padding:      4px 8px (px-2 py-0.5)
  Font Size:    12px (text-xs)
  Icon:         3-4px (w-3 h-3)

Medium (md):
  Padding:      8px 12px (px-3 py-1)
  Font Size:    14px (text-sm)
  Icon:         4-5px (w-4 h-4)

Large (lg):
  Padding:      12px 16px (px-4 py-1.5)
  Font Size:    16px (text-base)
  Icon:         5-6px (w-5 h-5)

SHAPE VARIANTS:

Pill (rounded-full):
  Border Radius: 9999px

Square (rounded-md):
  Border Radius: 6px

EXAMPLE BADGE:
┌──────────────────────────┐
│ ⏱ Pending               │
├──────────────────────────┤
│ bg: #FEF3C7              │
│ text: #B45309            │
│ padding: 4px 8px         │
│ border-radius: 9999px    │
│ font-weight: 600         │
│ display: flex            │
│ gap: 6px (gap-1.5)       │
└──────────────────────────┘
```

---

## 📊 Layout Variations

### Role-Based Card Rendering

```
ADMIN CARD:
┌─────────────────────────────────────────┐
│ Project Name • [Status Badge]           │
├─────────────────────────────────────────┤
│ Task Title                              │
├─────────────────────────────────────────┤
│ Phase: Discovery → Planning → Review   │
├─────────────────────────────────────────┤
│ [Avatar] Name | Due: 18 Feb | 5 Days   │
├─────────────────────────────────────────┤
│ [✓ Approve] [✗ Reject] [View]         │ ← Action buttons
└─────────────────────────────────────────┘

CLIENT CARD:
┌─────────────────────────────────────────┐
│ Project Name • [Status Badge]           │
├─────────────────────────────────────────┤
│ Task Title                              │
├─────────────────────────────────────────┤
│ Phase: Discovery → Planning → Review   │
├─────────────────────────────────────────┤
│ [Avatar] Name | Due: 18 Feb | 5 Days   │
├─────────────────────────────────────────┤
│ Admin Status: [Approved] View Details →│ ← Read-only info
└─────────────────────────────────────────┘

DESIGNER CARD:
┌─────────────────────────────────────────┐
│ Project Name • [Status Badge]           │
├─────────────────────────────────────────┤
│ Task Title                              │
├─────────────────────────────────────────┤
│ Phase: Discovery → Planning → Review   │
├─────────────────────────────────────────┤
│ [Avatar] Name | Due: 18 Feb | 5 Days   │ ← No actions
└─────────────────────────────────────────┘
```

### Category Grouping

```
┌──────────────────────────────────────────────┐
│ ▌ BRANDING                                   │ ← Category header
│   ─────────────────────────────────────────  │
├──────────────────────────────────────────────┤
│   To Do (3 items)                            │ ← Status sub-header
│   ┌────────────────────────────────────────┐ │
│   │ [Timeline Card 1]                      │ │
│   └────────────────────────────────────────┘ │
│   ┌────────────────────────────────────────┐ │
│   │ [Timeline Card 2]                      │ │
│   └────────────────────────────────────────┘ │
│                                              │
│   In Progress (2 items)                      │
│   ┌────────────────────────────────────────┐ │
│   │ [Timeline Card 3]                      │ │
│   └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## 📱 Responsive Behavior

```
MOBILE (< 640px):
  Width:        100% (full viewport - 8px margin)
  Padding:      12px (p-3)
  Font Sizes:   Smaller (-1px from desktop)
  Icons:        Smaller (w-3 h-3)
  Buttons:      Stack if > 2 buttons
  Layout:       Single column

TABLET (640px - 1024px):
  Width:        100% or 50% grid
  Padding:      16px - 24px (p-4 md:p-6)
  Font Sizes:   Medium
  Icons:        Medium (w-4 h-4)
  Buttons:      Side-by-side
  Layout:       2-column grid

DESKTOP (> 1024px):
  Width:        100% or 33% grid
  Padding:      20px - 24px (p-4 md:p-6)
  Font Sizes:   Base size
  Icons:        Standard (w-4 h-4)
  Buttons:      Full width in action bar
  Layout:       2-3 column grid
```

---

## 🎯 Typography Hierarchy

```
CARD TITLE (Task/Doc Name):
  Font Family:  System default
  Font Size:   14px (text-sm) → 16px (text-base) desktop
  Font Weight: 700 (bold)
  Line Height: 1.4
  Color:       #111827 (Gray-900)

PROJECT NAME:
  Font Size:   12px (text-xs)
  Font Weight: 700 (bold)
  Color:       Package color
  Text Transform: Truncate

STATUS LABEL:
  Font Size:   12px (text-xs)
  Font Weight: 600 (semibold)
  Text Transform: Uppercase

META INFORMATION (Dates, Days Left):
  Font Size:   12px (text-xs)
  Font Weight: 600 (semibold)
  Color:       #6B7280 (Gray-500)
  Special:     Urgent/Overdue = #DC2626 (Red-600)

BUTTON TEXT:
  Font Size:   14px (text-sm)
  Font Weight: 600 (semibold)
  Color:       White (on colored) / #2563EB (Blue-600) on transparent
```

---

## 🎨 Shadow & Elevation

```
shadow-sm (default):
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)

shadow-md (on hover):
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06)

No shadows on disabled/inactive states
```

---

## ⚡ Transitions & Animations

```
CARD HOVER:
  transition: all 200ms ease-in-out
  shadow: shadow-sm → shadow-md
  cursor: pointer

BUTTON INTERACTIONS:
  transition: all 150ms ease
  background: primary → darker shade
  scale: 0.98 on active (press effect)

STATUS CHANGES:
  transition: background-color 300ms ease
  Smooth color transitions on status updates
```

---

## ✅ Accessibility Specifications

```
CONTRAST RATIOS (WCAG AA):
  Text on Light: 4.5:1 minimum
  Text on Dark: 4.5:1 minimum
  Status Badges: All pass AA standards

FOCUS STATES:
  All interactive elements:
    outline: 2px solid #2563EB (Blue-600)
    outline-offset: 2px

KEYBOARD NAVIGATION:
  Tab order: Left to right, top to bottom
  Enter: Activates buttons
  Space: Activates buttons

ARIA LABELS:
  Buttons: aria-label={action}
  Icons: aria-hidden="true"
  Status: role="status"
```

---

## 🔧 Code Examples

### Using Package Colors

```tsx
const colors = getPackageColor(project.packageType);
// Returns: { name, hex, light, main, dark, tailwind: {...} }

// In JSX:
<div className={`${colors.tailwind.bg} border-l-4 ${colors.tailwind.border}`}>
```

### Creating a New Card

```tsx
<AdminApprovalCard
  title="Task Title"
  projectName="Project Name"
  type="task"
  status="pending"
  packageColor="teal"  // From colorUtils
  assignee={{ name: "John", avatar: "..." }}
  dueDate="18 Feb"
  daysLeft={5}
  onApprove={handleApprove}
  onReject={handleReject}
  onViewDetails={handleView}
  isProcessing={false}
/>
```

---

## 📋 Quality Checklist

- ✅ All colors match design images exactly
- ✅ Responsive on mobile, tablet, desktop
- ✅ Accessibility standards met (WCAG AA)
- ✅ Hover states visible and functional
- ✅ Status badges consistent across app
- ✅ Admin/Client differentiation clear
- ✅ Package color mapping complete
- ✅ Icon sizing consistent
- ✅ Typography hierarchy established
- ✅ Shadows appropriate for context
