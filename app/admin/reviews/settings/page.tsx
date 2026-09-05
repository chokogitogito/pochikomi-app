import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserStores } from "@/lib/db";
import { ReviewSettingsClient } from "@/components/admin/ReviewSettingsClient";
import { ReviewReplySettingsData } from "@/lib/repositories/review-repository";

export const dynamic = "force-dynamic";

export default async function ReviewSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const stores = await getUserStores(user.id);
  if (stores.length === 0) {
    return (
      <div className="p-8 text-center text-text-tertiary">
        管理可能な店舗が存在しません。
      </div>
    );
  }

  const params = await searchParams;
  const initialStoreId =
    params.storeId && stores.some((s) => s.id === params.storeId)
      ? params.storeId
      : stores[0].id;

  let initialSettings: ReviewReplySettingsData = {
    storeCallName: "",
    signature: "",
    toneDefault: "polite",
    ngWords: [],
    policyNote: "",
    reviewSource: "manual",
  };

  try {
    const { getReviewReplySettings } = await import("@/lib/repositories/review-repository");
    const { createAdminClient } = await import("@/lib/supabase/admin");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    const { data: loc } = await admin
      .from("locations")
      .select("id, organization_id")
      .eq("public_slug", initialStoreId)
      .maybeSingle();

    if (loc?.id) {
      initialSettings = await getReviewReplySettings(loc.organization_id, loc.id);
    }
  } catch (err) {
    console.error("[ReviewSettingsPage] 初期設定取得エラー:", err);
  }

  return (
    <ReviewSettingsClient
      stores={stores}
      initialStoreId={initialStoreId}
      initialSettings={initialSettings}
    />
  );
}
