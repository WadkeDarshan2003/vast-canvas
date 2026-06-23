import { Project, Plan, ProjectPackage } from '../types';

type PackageVisual = {
  shortLabel: string;
  planName: string;
  creativesPerYear: number;
  badgeClass: string;
  tileClass: string;
  titleClass: string;
  valueClass: string;
  subTextClass: string;
};

export interface PackageCreativeSummaryItem {
  packageType: ProjectPackage;
  projectCount: number;
  creativesPerProject: number;
  committedCreatives: number;
}

export interface PackageCreativeSummary {
  byPackage: PackageCreativeSummaryItem[];
  totalProjectCount: number;
  totalCommittedCreatives: number;
  unassignedProjects: number;
}

export const PACKAGE_VISUALS: Record<ProjectPackage, PackageVisual> = {
  [ProjectPackage.PACKAGE_20]: {
    shortLabel: '20 Creatives',
    planName: 'Starter Plan',
    creativesPerYear: 20,
    badgeClass: 'bg-emerald-500/90 text-white border-white/45',
    tileClass: 'bg-emerald-50 border-emerald-200',
    titleClass: 'text-emerald-700',
    valueClass: 'text-emerald-900',
    subTextClass: 'text-emerald-700',
  },
  [ProjectPackage.PACKAGE_50]: {
    shortLabel: '50 Creatives',
    planName: 'Growth Plan',
    creativesPerYear: 50,
    badgeClass: 'bg-sky-500/90 text-white border-white/45',
    tileClass: 'bg-sky-50 border-sky-200',
    titleClass: 'text-sky-700',
    valueClass: 'text-sky-900',
    subTextClass: 'text-sky-700',
  },
  [ProjectPackage.PACKAGE_100]: {
    shortLabel: '100 Creatives',
    planName: 'Business Plan',
    creativesPerYear: 100,
    badgeClass: 'bg-amber-400/95 text-slate-900 border-amber-100/80',
    tileClass: 'bg-amber-50 border-amber-200',
    titleClass: 'text-amber-700',
    valueClass: 'text-amber-900',
    subTextClass: 'text-amber-700',
  },
  [ProjectPackage.IMPACT]: {
    shortLabel: 'Impact Plan',
    planName: 'Impact Plan',
    creativesPerYear: 200,
    badgeClass: 'bg-indigo-900 text-white border-white/35',
    tileClass: 'bg-indigo-50 border-indigo-200',
    titleClass: 'text-indigo-700',
    valueClass: 'text-indigo-900',
    subTextClass: 'text-indigo-600',
  },
};

export const getPackageBadgeClasses = (packageType?: ProjectPackage): string => {
  if (!packageType) {
    return 'bg-slate-600/90 text-white border-white/35';
  }

  return PACKAGE_VISUALS[packageType]?.badgeClass || 'bg-slate-600/90 text-white border-white/35';
};

export const buildPackageCreativeSummary = (projects: Project[], availablePackages: any[] = []): PackageCreativeSummary => {
  const packageOrder = Object.values(ProjectPackage) as ProjectPackage[];

  const counters = new Map<ProjectPackage, PackageCreativeSummaryItem>(
    packageOrder.map((pkg) => {
      // Find dynamic package data if provided
      const dbPackage = availablePackages.find(p => p.type === pkg);
      const quota = dbPackage ? dbPackage.creativeQuota : PACKAGE_VISUALS[pkg].creativesPerYear;

      return [
        pkg,
        {
          packageType: pkg,
          projectCount: 0,
          creativesPerProject: quota,
          committedCreatives: 0,
        },
      ];
    })
  );

  let unassignedProjects = 0;

  for (const project of projects) {
    const packageType = project.packageType;
    if (!packageType) {
      unassignedProjects += 1;
      continue;
    }

    const entry = counters.get(packageType);
    if (!entry) {
      continue;
    }

    entry.projectCount += 1;
    // In this logic, each "Plan Project" consumes its package's full quota? 
    // Or maybe we should just show the quota once per package type?
    // User said "count of plans syn with dashboard", so adding it up per project seems to be what was intended for "committed" total.
    entry.committedCreatives += entry.creativesPerProject;
  }

  const byPackage = packageOrder.map((pkg) => counters.get(pkg)!);
  const totalProjectCount = byPackage.reduce((sum, item) => sum + item.projectCount, 0);
  const totalCommittedCreatives = byPackage.reduce((sum, item) => sum + item.committedCreatives, 0);

  return {
    byPackage,
    totalProjectCount,
    totalCommittedCreatives,
    unassignedProjects,
  };
};

// Build creative summary from Plans (new collection)
export const buildPlanCreativeSummary = (plans: Plan[], availablePackages: any[] = []): PackageCreativeSummary => {
  const packageOrder = Object.values(ProjectPackage) as ProjectPackage[];

  const counters = new Map<ProjectPackage, PackageCreativeSummaryItem>(
    packageOrder.map((pkg) => {
      // Find dynamic package data if provided
      const dbPackage = availablePackages.find(p => p.type === pkg);
      const quota = dbPackage ? dbPackage.creativeQuota : PACKAGE_VISUALS[pkg].creativesPerYear;

      return [
        pkg,
        {
          packageType: pkg,
          projectCount: 0,
          creativesPerProject: quota,
          committedCreatives: 0,
        },
      ];
    })
  );

  for (const plan of plans) {
    const packageType = plan.packageType;
    const entry = counters.get(packageType);
    if (!entry) {
      continue;
    }

    entry.projectCount += 1;
    entry.committedCreatives += entry.creativesPerProject;
  }

  const byPackage = packageOrder.map((pkg) => counters.get(pkg)!);
  const totalProjectCount = byPackage.reduce((sum, item) => sum + item.projectCount, 0);
  const totalCommittedCreatives = byPackage.reduce((sum, item) => sum + item.committedCreatives, 0);

  return {
    byPackage,
    totalProjectCount,
    totalCommittedCreatives,
    unassignedProjects: 0, // Plans always have a packageType, so no unassigned
  };
};