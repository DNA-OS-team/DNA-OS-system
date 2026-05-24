import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          ระบบปฏิบัติการพาณิชย์ก่อสร้าง
        </p>
        <div>
          <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            DNA OS Construction Platform
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            พร้อมสำหรับ storefront ลูกค้า พอร์ทัลพาร์ทเนอร์ พอร์ทัลรถร่วม และ admin backoffice
          </p>
        </div>

        <Card className="w-full max-w-md text-left">
          <CardHeader>
            <CardTitle>UI พื้นฐานพร้อมแล้ว</CardTitle>
            <CardDescription>
              Tailwind CSS และ shadcn/ui components ถูกกำหนดค่าสำหรับ app shell แล้ว
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-muted-foreground">
              การ์ดตัวอย่างนี้ใช้ theme tokens จาก globals.css และ shadcn/ui components
            </p>
          </CardContent>
          <CardFooter>
            <Button type="button">ดำเนินการหลัก</Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
