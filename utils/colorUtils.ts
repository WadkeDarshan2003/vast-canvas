// Color system based on package levels
// Maps package levels to consistent color values

export const PACKAGE_COLORS = {
  STARTER: {
    name: 'pink',
    hex: '#E91E63',
    light: '#FCE4EC',
    lightHex: '#FCE4EC',
    main: '#E91E63',
    dark: '#C2185B',
    tailwind: {
      bg: 'bg-pink-50',
      bgMain: 'bg-pink-500',
      bgDark: 'bg-pink-700',
      text: 'text-pink-700',
      textMain: 'text-pink-600',
      border: 'border-pink-500',
      badgeBg: 'bg-pink-100',
      badgeText: 'text-pink-700'
    }
  },
  GROWTH: {
    name: 'orange',
    hex: '#FF9800',
    light: '#FFF3E0',
    lightHex: '#FFF3E0',
    main: '#FF9800',
    dark: '#E65100',
    tailwind: {
      bg: 'bg-orange-50',
      bgMain: 'bg-orange-500',
      bgDark: 'bg-orange-700',
      text: 'text-orange-700',
      textMain: 'text-orange-600',
      border: 'border-orange-500',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700'
    }
  },
  BUSINESS: {
    name: 'teal',
    hex: '#009688',
    light: '#E0F2F1',
    lightHex: '#E0F2F1',
    main: '#009688',
    dark: '#00695C',
    tailwind: {
      bg: 'bg-teal-50',
      bgMain: 'bg-teal-500',
      bgDark: 'bg-teal-700',
      text: 'text-teal-700',
      textMain: 'text-teal-600',
      border: 'border-teal-500',
      badgeBg: 'bg-teal-100',
      badgeText: 'text-teal-700'
    }
  },
  IMPACT: {
    name: 'indigo',
    hex: '#283593',
    light: '#E8EAF6',
    lightHex: '#E8EAF6',
    main: '#283593',
    dark: '#1A237E',
    tailwind: {
      bg: 'bg-indigo-50',
      bgMain: 'bg-indigo-900',
      bgDark: 'bg-indigo-900',
      text: 'text-indigo-900',
      textMain: 'text-indigo-800',
      border: 'border-indigo-800',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-900'
    }
  }
};

// Role-based color overrides
export const ROLE_COLORS = {
  ADMIN: {
    border: 'border-blue-500',
    headerBg: 'bg-blue-600',
    headerText: 'text-white',
    approve: 'bg-green-600 hover:bg-green-700',
    reject: 'bg-red-600 hover:bg-red-700',
    badge: 'bg-blue-100 text-blue-700'
  },
  CLIENT: {
    border: 'border-gray-300',
    headerBg: 'bg-gray-50',
    headerText: 'text-gray-900',
    status: 'bg-gray-100 text-gray-700',
    badge: 'bg-gray-200 text-gray-800'
  }
};

// Status colors
export const STATUS_COLORS = {
  PENDING: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    hex: '#FEF3C7'
  },
  APPROVED: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    hex: '#DCFCE7'
  },
  REJECTED: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    hex: '#FEE2E2'
  },
  REVIEW: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    hex: '#F3E8FF'
  }
};

// Get package color by project package type
export function getPackageColor(packageType?: string) {
  switch (packageType?.toUpperCase()) {
    case 'PACKAGE_50':
    case 'STARTER':
      return PACKAGE_COLORS.STARTER;
    case 'PACKAGE_100':
    case 'GROWTH':
      return PACKAGE_COLORS.GROWTH;
    case 'PACKAGE_200':
    case 'PACKAGE_100':
    case 'BUSINESS':
      return PACKAGE_COLORS.BUSINESS;
    case 'CUSTOM':
    case 'IMPACT':
      return PACKAGE_COLORS.IMPACT;
    default:
      return PACKAGE_COLORS.GROWTH; // Default fallback
  }
}

// Get color by project priority or custom logic
export function getProjectColor(index: number) {
  const colors = [PACKAGE_COLORS.STARTER, PACKAGE_COLORS.GROWTH, PACKAGE_COLORS.BUSINESS, PACKAGE_COLORS.IMPACT];
  return colors[index % colors.length];
}
