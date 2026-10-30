import type { Metadata } from "next";
import { DataExplorer } from "@/components/data/data-explorer";

export const metadata: Metadata = { title: "Data explorer" };

export default function DataPage() {
  return <DataExplorer />;
}
