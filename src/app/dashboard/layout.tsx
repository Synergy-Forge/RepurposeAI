import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import '@/styles/dashboard.css';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
