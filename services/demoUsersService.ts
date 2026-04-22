import { User, Role } from '../types';

/**
 * Demo Users - Sample team members for testing
 */
export const createDemoUsers = (tenantId: string): User[] => {
  return [
    {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@demo.com',
      role: Role.ADMIN,
      phone: '+919876543210',
      tenantId: tenantId,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'client-1',
      name: 'Emma Johnson',
      email: 'emma@techstartup.com',
      role: Role.CLIENT,
      phone: '+919123456789',
      company: 'TechStartup Inc.',
      tenantId: tenantId,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'designer-1',
      name: 'Sarah Designer',
      email: 'sarah@designstudio.com',
      role: Role.DESIGNER,
      phone: '+918765432109',
      specialty: 'Brand Identity & UI/UX',
      tenantId: tenantId,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer1',
      skills: ['Brand Strategy', 'Logo Design', 'UI Design', 'Color Theory'],
      certifications: ['Adobe Certified Associate', 'UX Design Professional'],
      portfolioUrl: 'https://dribbble.com/sarah-design',
      yearsOfExperience: 8,
      hourlyRate: 1500,
      maxCapacity: 80,
      availability: {
        isAvailable: true,
        workingHours: { start: '09:00', end: '18:00' }
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'designer-2',
      name: 'Michael Chen',
      email: 'michael@designstudio.com',
      role: Role.DESIGNER,
      phone: '+918654321098',
      specialty: 'Print Design & Motion Graphics',
      tenantId: tenantId,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=designer2',
      skills: ['Print Design', 'Motion Graphics', 'Animation', 'Typography'],
      certifications: ['Adobe Certified Expert', 'Motion Design Specialist'],
      portfolioUrl: 'https://behance.net/michaelchen',
      yearsOfExperience: 6,
      hourlyRate: 1200,
      maxCapacity: 60,
      availability: {
        isAvailable: true,
        workingHours: { start: '10:00', end: '19:00' }
      },
      createdAt: new Date().toISOString(),
    },
    {
      id: 'client-2',
      name: 'Robert Williams',
      email: 'robert@ecommerce.com',
      role: Role.CLIENT,
      phone: '+919999888877',
      company: 'E-Commerce Solutions Ltd.',
      tenantId: tenantId,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=client2',
      createdAt: new Date().toISOString(),
    },
  ];
};
