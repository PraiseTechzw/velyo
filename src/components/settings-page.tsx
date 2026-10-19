import { useSuspenseQuery } from "@tanstack/react-query";
import { PageTitle } from "@/components/dashboard-pages";
import { SettingsBusinessProfile } from "@/components/settings-business-profile";
import { getBusiness } from "@/lib/business.functions";

const businessQuery = { queryKey: ["business"], queryFn: () => getBusiness() };

export function SettingsPage() {
  const { data } = useSuspenseQuery(businessQuery);
  if (!data.business) return null;
  return (
    <>
      <PageTitle
        title="Business Profile"
        detail="Update your business information and preferences."
        sample={false}
      />
      <SettingsBusinessProfile business={data.business} profile={data.profile} />
    </>
  );
}
