import { redirect } from "next/navigation";

export default function PartnerPage() {
  redirect("/line/connect?channel=fleet&next=/fleet/jobs");
}
