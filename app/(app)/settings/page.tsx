import { requireUser } from "@/lib/auth";
import { getSettingsData } from "@/lib/data";
import { SettingsPageContent } from "@/components/features/settings/settings-page-content";

export default async function SettingsPage() {
  const { user } = await requireUser();
  const settings = await getSettingsData(user.id);

  return <SettingsPageContent settings={settings} />;
}