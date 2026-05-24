import Link from "next/link";
import { ArrowLeft, MessageCircle, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

const LINE_OA_URL = process.env.NEXT_PUBLIC_LINE_PARTNER_URL ?? "https://lin.ee/XXXXXXX";

export default function PartnerPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-50">
            <Truck className="size-8 text-amber-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">พาร์ทเนอร์รถร่วม</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            สนใจร่วมงานกับ DNA OS?<br />
            ติดต่อทีมงานผ่าน LINE เพื่อสมัครเป็นพาร์ทเนอร์รถร่วม
          </p>
        </div>

        <a href={LINE_OA_URL} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full gap-2 bg-[#06C755] hover:bg-[#05b34c] text-white">
            <MessageCircle className="size-4" />
            ติดต่อสมัครผ่าน LINE
          </Button>
        </a>

        <Link href="/" className="flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
