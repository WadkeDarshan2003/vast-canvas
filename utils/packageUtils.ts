import { Project, ProjectPackage } from '../types';

type PackageVisual = {
  shortLabel: string;
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
  totalCommittedCreatives: number;
  unassignedProjects: number;
}

export const PACKAGE_VISUALS: Record<ProjectPackage, PackageVisual> = {
  [ProjectPackage.PACKAGE_50]: {
    shortLabel: '20 Creatives',
    creativesPerYear: 20,
    badgeClass: 'bg-emerald-500/90 text-white border-white/45',
    tileClass: 'bg-emerald-50 border-emerald-200',
    titleClass: 'text-emerald-700',
    valueClass: 'text-emerald-900',
    subTextClass: 'text-emerald-700',
  },
  [ProjectPackage.PACKAGE_100]: {
    shortLabel: '50 Creatives',
    creativesPerYear: 50,
    badgeClass: 'bg-sky-500/90 text-white border-white/45',
    tileClass: 'bg-sky-50 border-sky-200',
    titleClass: 'text-sky-700',
    valueClass: 'text-sky-900',
    subTextClass: 'text-sky-700',
  },
  [ProjectPackage.PACKAGE_200]: {
    shortLabel: '100 Creatives',
    creativesPerYear: 100,
    badgeClass: 'bg-amber-400/95 text-slate-900 border-amber-100/80',
    tileClass: 'bg-amber-50 border-amber-200',
    titleClass: 'text-amber-700',
    valueClass: 'text-amber-900',
    subTextClass: 'text-amber-700',
  },
  [ProjectPackage.CUSTOM]: {
    shortLabel: '200 Creatives',
    creativesPerYear: 200,
    badgeClass: 'bg-slate-600/90 text-white border-white/35',
    tileClass: 'bg-slate-50 border-slate-200',
    titleClass: 'text-slate-700',
    valueClass: 'text-slate-900',
    subTextClass: 'text-slate-600',
  },
};

export const getPackageBadgeClasses = (packageType?: ProjectPackage): string => {
  if (!packageType) {
    return 'bg-slate-600/90 text-white border-white/35';
  }

  return PACKAGE_VISUALS[packageType]?.badgeClass || 'bg-slate-600/90 text-white border-white/35';
};

export const buildPackageCreativeSummary = (projects: Project[]): PackageCreativeSummary => {
  const packageOrder = Object.values(ProjectPackage) as ProjectPackage[];

  const counters = new Map<ProjectPackage, PackageCreativeSummaryItem>(
    packageOrder.map((pkg) => [
      pkg,
      {
        packageType: pkg,
        projectCount: 0,
        creativesPerProject: PACKAGE_VISUALS[pkg].creativesPerYear,
        committedCreatives: 0,
      },
    ])
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
    entry.committedCreatives += entry.creativesPerProject;
  }

  const byPackage = packageOrder.map((pkg) => counters.get(pkg)!);
  const totalCommittedCreatives = byPackage.reduce((sum, item) => sum + item.committedCreatives, 0);

  return {
    byPackage,
    totalCommittedCreatives,
    unassignedProjects,
  };
};