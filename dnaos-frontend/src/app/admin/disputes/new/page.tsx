import { DisputeForm } from "@/features/logistics/dispute-form";

export default function NewDisputePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">เปิด Dispute ใหม่</h1>
        <p className="text-sm text-muted-foreground">บันทึกปัญหาหรือข้อพิพาทที่เกิดขึ้น</p>
      </div>
      <DisputeForm />
    </div>
  );
}
