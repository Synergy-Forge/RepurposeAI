import { Metadata } from 'next';
import { ProjectsPage } from '@/components/dashboard/ProjectsPage';

export const metadata: Metadata = {
  title: 'Projects - RepurposeAI',
  description: 'Manage your video projects and campaigns',
};

export default function Projects() {
  return <ProjectsPage />;
}
