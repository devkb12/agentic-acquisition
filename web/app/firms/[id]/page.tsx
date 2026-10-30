import type { Metadata } from "next";
import { FirmPage } from "@/components/firm/firm-page";

export const metadata: Metadata = { title: "Firm file" };

export default async function FirmRoute({ params }: PageProps<"/firms/[id]">) {
  const { id } = await params;
  return <FirmPage id={decodeURIComponent(id)} />;
}
