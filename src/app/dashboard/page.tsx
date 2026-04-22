import { Metadata } from 'next';
import { DashboardPage } from '@/components/dashboard/DashboardPage';

export const metadata: Metadata = {
  title: 'Dashboard - RepurposeAI',
  description: 'Your video repurposing dashboard',
};

export default function Dashboard() {
  return <DashboardPage />;
}
