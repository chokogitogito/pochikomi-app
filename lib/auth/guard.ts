import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { validateAndNormalizeSlug } from "@/lib/repositories/supabase-repository";

export interface AuthGuardResult {
  authorized: boolean;
  userId?: string;
  organizationId?: string;
  locationId?: string;
  role?: string;
  error?: string;
  status?: number;
}

interface ProfileRow {
  is_platform_admin: boolean;
}

interface MemberRow {
  organization_id: string;
  role: string;
  status: string;
}

interface LocationRow {
  id: string;
  organization_id: string;
}

/**
 * 管理者セッションおよび組織権限の検証
 * @param targetStoreId 検証対象の店舗slugまたはID（省略時は所属組織の有無のみチェック）
 */
export async function verifyAdminAuth(targetStoreId?: string): Promise<AuthGuardResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: "認証されていません。ログインしてください。",
      status: 401,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminClient = createAdminClient() as any;

  // プラットフォーム管理者の判定
  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_platform_admin")
    .eq("user_id", user.id)
    .maybeSingle();

  if ((profile as ProfileRow | null)?.is_platform_admin) {
    if (targetStoreId) {
      const safeSlug = validateAndNormalizeSlug(targetStoreId);
      let locData: { id: string; organization_id: string } | null = null;
      if (safeSlug) {
        const primary = await adminClient
          .from("locations")
          .select("id, organization_id")
          .eq("public_slug", safeSlug)
          .maybeSingle();
        locData = primary.data;
        if (!locData) {
          const legacy = await adminClient
            .from("locations")
            .select("id, organization_id")
            .contains("legacy_slugs", [safeSlug])
            .maybeSingle();
          locData = legacy.data;
        }
      }
      return {
        authorized: true,
        userId: user.id,
        role: "platform_admin",
        organizationId: locData?.organization_id,
        locationId: locData?.id,
      };
    }
    return {
      authorized: true,
      userId: user.id,
      role: "platform_admin",
    };
  }

  // ユーザーのアクティブな組織メンバーシップを取得
  const { data: members, error: memberErr } = await adminClient
    .from("organization_members")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  const memberList = (members || []) as MemberRow[];

  if (memberErr || memberList.length === 0) {
    return {
      authorized: false,
      error: "組織メンバーシップが見つかりません。",
      status: 403,
    };
  }

  // 特定店舗に対する権限検証
  if (targetStoreId) {
    const safeSlug = validateAndNormalizeSlug(targetStoreId);
    if (!safeSlug) {
      return {
        authorized: false,
        error: "無効な店舗IDです。",
        status: 400,
      };
    }

    // 店舗の organization_id を取得
    let { data: locData } = await adminClient
      .from("locations")
      .select("id, organization_id")
      .eq("public_slug", safeSlug)
      .maybeSingle();

    if (!locData) {
      const legacyQuery = await adminClient
        .from("locations")
        .select("id, organization_id")
        .contains("legacy_slugs", [safeSlug])
        .maybeSingle();
      locData = legacyQuery.data;
    }

    if (!locData) {
      return {
        authorized: false,
        error: "店舗が存在しません。",
        status: 404,
      };
    }

    const loc = locData as LocationRow;
    const targetMember = memberList.find((m) => m.organization_id === loc.organization_id);

    if (!targetMember || !["owner", "admin", "manager"].includes(targetMember.role)) {
      return {
        authorized: false,
        error: "この店舗を管理する権限がありません。",
        status: 403,
      };
    }

    return {
      authorized: true,
      userId: user.id,
      organizationId: loc.organization_id,
      locationId: loc.id,
      role: targetMember.role,
    };
  }

  // 店舗指定なし（いずれかの組織でowner/admin/managerであればOK）
  const validMember = memberList.find((m) => ["owner", "admin", "manager"].includes(m.role));
  if (!validMember) {
    return {
      authorized: false,
      error: "管理権限がありません。",
      status: 403,
    };
  }

  return {
    authorized: true,
    userId: user.id,
    organizationId: validMember.organization_id,
    role: validMember.role,
  };
}
