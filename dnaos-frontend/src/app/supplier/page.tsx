import { redirect } from "next/navigation";

export default function SupplierPage() {
  redirect("/line/connect?channel=supplier&next=/supplier/orders");
}
