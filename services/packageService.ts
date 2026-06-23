import { collection, getDocs, doc, setDoc, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Package, ProjectPackage } from '../types';

const PACKAGES_COLLECTION = 'packages';

const PACKAGE_FIXTURES: Record<ProjectPackage, Pick<Package, 'name' | 'creativeQuota' | 'price' | 'features' | 'description'>> = {
  [ProjectPackage.PACKAGE_20]: {
    name: 'Starter Plan',
    description: 'Perfect for small firms starting their journey.',
    creativeQuota: 20,
    price: 18000,
    features: ['Up to 20 creatives', 'Email support', 'Basic analytics'],
  },
  [ProjectPackage.PACKAGE_50]: {
    name: 'Growth Plan',
    description: 'Ideal for growing teams with consistent projects.',
    creativeQuota: 50,
    price: 40000,
    features: ['Up to 50 creatives', 'Priority email support', 'Advanced analytics', 'Team collaboration'],
  },
  [ProjectPackage.PACKAGE_100]: {
    name: 'Business Plan',
    description: 'Designed for high-volume firms and agencies.',
    creativeQuota: 100,
    price: 70000,
    features: ['Up to 100 creatives', '24/7 Priority support', 'Full analytics suite', 'Multi-firm management'],
  },
  [ProjectPackage.IMPACT]: {
    name: 'Impact Plan',
    description: 'Tailored solutions for enterprise-level operations.',
    creativeQuota: 200,
    price: 120000,
    features: ['Up to 200 creatives', 'Dedicated account manager', 'Custom integrations', 'Enterprise-grade security'],
  },
};

const normalizePackageType = (type?: string): ProjectPackage | undefined => {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('starter') || normalized.includes('package 1') || normalized.includes('20')) return ProjectPackage.PACKAGE_20;
  if (normalized.includes('growth') || normalized.includes('package 2') || normalized.includes('50')) return ProjectPackage.PACKAGE_50;
  if (normalized.includes('business') || normalized.includes('package 3') || normalized.includes('100')) return ProjectPackage.PACKAGE_100;
  if (normalized.includes('impact') || normalized.includes('package 4') || normalized.includes('200')) return ProjectPackage.IMPACT;
  return undefined;
};

const normalizePackageRecord = (pkg: Partial<Package> & { type?: string; id: string }): Package => {
  const packageType = normalizePackageType(pkg.type) || ProjectPackage.PACKAGE_20;
  const fixture = PACKAGE_FIXTURES[packageType];

  return {
    id: pkg.id,
    tenantId: pkg.tenantId,
    type: packageType,
    name: fixture.name,
    description: fixture.description,
    creativeQuota: fixture.creativeQuota,
    price: fixture.price,
    features: fixture.features,
  };
};

export const getPackages = async (tenantId?: string): Promise<Package[]> => {
  try {
    let q = query(collection(db, PACKAGES_COLLECTION));
    const packagesSnapshot = await getDocs(q);
    const allPackages = packagesSnapshot.docs.map(doc => 
      normalizePackageRecord({ ...(doc.data() as Partial<Package>), id: doc.id })
    );

    // De-duplicate by package type
    const uniquePackages: Package[] = [];
    const seenTypes = new Set<string>();
    for (const pkg of allPackages) {
      if (!seenTypes.has(pkg.type)) {
        seenTypes.add(pkg.type);
        uniquePackages.push(pkg);
      }
    }

    return uniquePackages.sort((a, b) => Object.values(ProjectPackage).indexOf(a.type) - Object.values(ProjectPackage).indexOf(b.type));
  } catch (error) {
    console.error('Error fetching packages:', error);
    return [];
  }
};

export const initializeDefaultPackages = async (tenantId: string) => {
  const defaultPackages: Package[] = Object.entries(PACKAGE_FIXTURES).map(([type, fixture]) => ({
    id: type === ProjectPackage.IMPACT ? 'pkg-impact' : `pkg-${fixture.creativeQuota}`,
    type: type as ProjectPackage,
    ...fixture,
  }));

  try {
    for (const pkg of defaultPackages) {
      const packageWithTenant = { ...pkg, tenantId };
      // Create a unique ID for the package per tenant
      const uniqueId = `${tenantId}_${pkg.id}`;
      await setDoc(doc(db, PACKAGES_COLLECTION, uniqueId), packageWithTenant);
    }
    console.log('Default packages initialized successfully for tenant:', tenantId);
  } catch (error) {
    console.error('Error initializing default packages:', error);
  }
};
