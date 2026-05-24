import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | DNA OS",
  description: "เข้าสู่ระบบ DNA OS ด้วยบัญชี LINE",
};

type LineConnectPageProps = {
  searchParams: Promise<{
    next?: string;
    token?: string;
    channel?: string;
  }>;
};

const CHANNEL_COPY: Record<string, { title: string; desc: string; badge: string }> = {
  fleet: {
    badge: "พาร์ทเนอร์รถร่วม",
    title: "เข้าสู่ระบบพาร์ทเนอร์",
    desc: "สำหรับผู้ประกอบการรถร่วมและพาร์ทเนอร์ขนส่ง",
  },
  supplier: {
    badge: "ซัพพลายเออร์",
    title: "เข้าสู่ระบบซัพพลายเออร์",
    desc: "สำหรับผู้จัดหาวัสดุก่อสร้างและซัพพลายเออร์",
  },
  customer: {
    badge: "ลูกค้า",
    title: "เข้าสู่ระบบลูกค้า",
    desc: "สำหรับลูกค้าที่ต้องการดูข้อมูลออร์เดอร์และการจัดส่ง",
  },
};

const DEFAULT_COPY = {
  badge: "DNA OS",
  title: "เข้าสู่ระบบ",
  desc: "เข้าใช้งานระบบจัดการก่อสร้างด้วยบัญชี LINE ของคุณ",
};

const CHANNEL_START: Record<string, string> = {
  fleet: "/api/backend/auth/line-fleet/start",
  supplier: "/api/backend/auth/line-supplier/start",
};

function buildLineStartUrl(input: { next?: string; token?: string; channel?: string }) {
  const startPath = CHANNEL_START[input.channel ?? ""] ?? "/api/backend/auth/line/start";
  const url = new URL(startPath, "http://x");
  if (input.next) url.searchParams.set("next", input.next);
  if (input.token) url.searchParams.set("token", input.token);
  return url.pathname + url.search;
}

export default async function LineConnectPage({ searchParams }: LineConnectPageProps) {
  const { next, token, channel } = await searchParams;
  const lineStartUrl = buildLineStartUrl({ next, token, channel });
  const copy = (channel ? CHANNEL_COPY[channel] : null) ?? DEFAULT_COPY;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f0faf4] flex items-center justify-center px-4">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 size-[500px] rounded-full bg-[#06C755]/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 size-[400px] rounded-full bg-[#06C755]/8 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#06C755] shadow-lg shadow-[#06C755]/30">
            <span className="text-xl font-black text-white">D</span>
          </div>
          <span className="text-sm font-semibold tracking-widest text-[#06C755]/80 uppercase">DNA OS</span>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-black/5 backdrop-blur-sm">
          {/* Channel badge */}
          <div className="px-6 pt-6 pb-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#06C755]/10 px-3 py-1 text-xs font-semibold text-[#06C755]">
              <span className="size-1.5 rounded-full bg-[#06C755]" />
              {copy.badge}
            </span>
          </div>

          {/* Heading */}
          <div className="px-6 pt-4 pb-2">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{copy.title}</h1>
            <p className="mt-1 text-sm text-gray-500">{copy.desc}</p>
          </div>

          {/* Steps */}
          <div className="mx-6 my-4 space-y-2.5 rounded-2xl bg-gray-50 p-4">
            {[
              { n: "1", label: "กดปุ่มด้านล่าง" },
              { n: "2", label: "เลือกบัญชี LINE แล้วกดอนุมัติ" },
              { n: "3", label: "ระบบพาคุณเข้าสู่หน้าหลักอัตโนมัติ" },
            ].map((step) => (
              <div key={step.n} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#06C755]/15 text-xs font-bold text-[#06C755]">
                  {step.n}
                </span>
                <span className="text-sm text-gray-600">{step.label}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <a
              href={lineStartUrl}
              className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#06C755] px-4 py-3.5 text-sm font-bold text-white shadow-md shadow-[#06C755]/30 transition-all hover:bg-[#05b34c] hover:shadow-lg hover:shadow-[#06C755]/40 active:scale-[0.98]"
            >
              {/* LINE icon */}
              <svg viewBox="0 0 24 24" className="size-5 fill-white" aria-hidden="true">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
              </svg>
              เข้าสู่ระบบด้วย LINE
            </a>
            <p className="mt-3 text-center text-xs text-gray-400">
              หากยังไม่มีบัญชี ระบบจะสร้างให้อัตโนมัติ
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} DNA OS Co., Ltd. · ข้อมูลของคุณปลอดภัย
        </p>
      </div>
    </main>
  );
}
