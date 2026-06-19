import { collection, getDocs, doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createDemoUsers } from './demoUsersService';
import { createDemoProjects } from './demoProjectService';
import { initializeDefaultPackages } from './packageService';

const TEMPLATES_COLLECTION = 'demoTemplates';

/**
 * Migrates all hardcoded demo data to Firestore as templates.
 * This makes the demo system fully database-driven.
 */
export const migrateAllDemoData = async (tenantId: string = 'template-tenant') => {
  try {
    console.log(`🚀 Starting full demo data migration to database for tenant: ${tenantId}...`);
    
    // 1. Initialize Packages first
    await initializeDefaultPackages(tenantId);

    const users = createDemoUsers(tenantId);
    const projects = createDemoProjects();

    // Use batches for efficiency
    const batch = writeBatch(db);

    // 2. Store users templates
    users.forEach(user => {
      const userRef = doc(db, TEMPLATES_COLLECTION, 'users', 'list', user.id);
      batch.set(userRef, { ...user, isTemplate: true });
    });

    // 3. Store projects templates
    projects.forEach((proj, i) => {
      const projRef = doc(db, TEMPLATES_COLLECTION, 'projects', 'list', `template-proj-${i}`);
      batch.set(projRef, { ...proj, isTemplate: true });
    });

    await batch.commit();
    console.log('✅ All demo data migrated to database successfully.');
    return { success: true };
  } catch (error) {
    console.error('❌ Error during demo data migration:', error);
    return { success: false, error };
  }
};

export const getTemplatesFromDB = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, TEMPLATES_COLLECTION, 'users', 'list'));
    const projectsSnapshot = await getDocs(collection(db, TEMPLATES_COLLECTION, 'projects', 'list'));

    return {
      users: usersSnapshot.docs.map(d => d.data()),
      projects: projectsSnapshot.docs.map(d => d.data())
    };
  } catch (error) {
    console.error('Error fetching templates from DB:', error);
    return { users: [], projects: [] };
  }
};
