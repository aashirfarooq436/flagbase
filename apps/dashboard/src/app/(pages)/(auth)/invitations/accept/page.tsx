import { AcceptInvitation } from "@/components/invitation/accept-invitation";

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <AcceptInvitation token={token ?? ""} />
    </div>
  );
}
