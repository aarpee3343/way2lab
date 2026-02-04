import AdminSettingsClient from '@/components/admin/AdminSettingsClient';
import { getAdminSettings } from '@/app/actions/adminSettingsActions';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const settings = await getAdminSettings();

  return <AdminSettingsClient initialSettings={settings} />;
}
