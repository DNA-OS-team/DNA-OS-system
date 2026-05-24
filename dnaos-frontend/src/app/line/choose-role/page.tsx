"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Membership = {
  companyId: string;
  companyName: string;
  companyType: string;
  role: string;
};

const ROLE_CONFIG: Record<string, { label: string; desc: string; emoji: string; bg: string }> = {
  CUSTOMER:   { label: "ลูกค้า",              desc: "สั่งซื้อวัสดุก่อสร้าง",        emoji: "🏗️", bg: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
  SUPPLIER:   { label: "ซัพพลายเออร์",       desc: "จัดการสินค้าและคำสั่งซื้อ",   emoji: "📦", bg: "bg-green-50 border-green-200 hover:bg-green-100" },
  FLEET_OWNER: { label: "พาร์ทเนอร์รถร่วม", desc: "รับงานขนส่งวัสดุ",            emoji: "🚛", bg: "bg-orange-50 border-orange-200 hover:bg-orange-100" },
};

export default function ChooseRolePage() {
  const router = useRouter();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/backend/auth/line/pending-roles")
      .then((r) => r.json())
      .then((data: { memberships?: Membership[]; error?: string }) => {
        if (data.memberships) {
          setMemberships(data.memberships);
        } else {
          setError(data.error ?? "ไม่พบข้อมูลการเข้าสู่ระบบ");
        }
      })
      .catch(() => setError("ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false));
  }, []);

  async function selectRole(companyId: string) {
    setSelecting(companyId);
    setError(null);
    try {
      const res = await fetch("/api/backend/auth/line/select-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId }),
      });
      const data = (await res.json()) as { redirectPath?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "เกิดข้อผิดพลาด");
      router.push(data.redirectPath ?? "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setSelecting(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f0f4f8] p-4">
      <div className="w-full max-w-sm space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-[#06C755] shadow-lg">
            <svg viewBox="0 0 24 24" className="size-8 fill-white">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">เลือกบัญชีที่ต้องการใช้</h1>
          <p className="mt-1 text-sm text-gray-500">LINE ของคุณเชื่อมต่อกับหลายบทบาท<br />กรุณาเลือกบทบาทที่ต้องการเข้าใช้งาน</p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="size-8 animate-spin rounded-full border-2 border-[#06C755] border-t-transparent" />
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Role list */}
        {!loading && memberships.length > 0 && (
          <div className="space-y-3">
            {memberships.map((m) => {
              const cfg = ROLE_CONFIG[m.role] ?? { label: m.role, desc: m.companyName, emoji: "👤", bg: "bg-gray-50 border-gray-200 hover:bg-gray-100" };
              const isSelecting = selecting === m.companyId;
              return (
                <button
                  key={m.companyId}
                  onClick={() => selectRole(m.companyId)}
                  disabled={selecting !== null}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition-all disabled:opacity-60 ${cfg.bg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cfg.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900">{cfg.label}</div>
                      <div className="text-xs text-gray-500 truncate">{m.companyName}</div>
                      <div className="text-xs text-gray-400">{cfg.desc}</div>
                    </div>
                    {isSelecting && (
                      <div className="size-5 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400">DNA OS · ระบบบริหารจัดการก่อสร้าง</p>
      </div>
    </div>
  );
}
