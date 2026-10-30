import type { Metadata } from "next";
import { About } from "@/components/about/about";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return <About />;
}
