import { Project } from '@/types/timesheet';
import { TimesheetService } from './timesheet-service';

export const sampleProjects: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Website Redesign',
    description: 'Complete redesign of company website with modern UI/UX',
    isActive: true
  },
  {
    name: 'Mobile App Development',
    description: 'Development of iOS and Android mobile applications',
    isActive: true
  },
  {
    name: 'Database Migration',
    description: 'Migration from legacy database to cloud-based solution',
    isActive: true
  },
  {
    name: 'API Development',
    description: 'RESTful API development for third-party integrations',
    isActive: true
  },
  {
    name: 'Security Audit',
    description: 'Comprehensive security audit and vulnerability assessment',
    isActive: true
  },
  {
    name: 'Training & Documentation',
    description: 'Employee training and technical documentation',
    isActive: true
  },
  {
    name: 'Maintenance & Support',
    description: 'Ongoing system maintenance and technical support',
    isActive: true
  }
];

export const initializeSampleData = async () => {
  try {
    // Check if projects already exist
    const existingProjects = await TimesheetService.getProjects();
    
    if (existingProjects.length === 0) {
      console.log('Creating sample projects...');
      
      // Create sample projects
      for (const project of sampleProjects) {
        await TimesheetService.createProject(project);
      }
      
      console.log('Sample projects created successfully');
    } else {
      console.log('Projects already exist, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};
