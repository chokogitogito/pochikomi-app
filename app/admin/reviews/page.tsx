import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserStores } from "@/lib/db";
import ReviewInboxClient from "@/components/admin/ReviewInboxClient";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage({
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

  let initialReviews: import("@/lib/repositories/review-repository").ReviewInboxItem[] = [];
  let initialUnrepliedCount = 0;

  try {
    const { getReviewInbox, getUnrepliedReviewCount } = await import("@/lib/repositories/review-repository");
    const { createAdminClient } = await import("@/lib/supabase/admin");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    const { data: loc } = await admin
      .from("locations")
      .select("id")
      .eq("public_slug", initialStoreId)
      .maybeSingle();

    if (loc?.id) {
      initialReviews = await getReviewInbox(loc.id);
      initialUnrepliedCount = await getUnrepliedReviewCount(loc.id);
    }
  } catch (err) {
    console.error("[AdminReviewsPage] 初期データ取得エラー:", err);
  }

  return (
    <ReviewInboxClient
      stores={stores}
      initialStoreId={initialStoreId}
      initialReviews={initialReviews}
      initialUnrepliedCount={initialUnrepliedCount}
    />
  );
}
