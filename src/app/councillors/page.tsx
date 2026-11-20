import type { Metadata } from "next";
import { Directory } from "@/components/directory";

export const metadata: Metadata = {
  title: "Ngā kaikaunihera me ngā Pouiwi",
  description: "Mayor, ward councillors, and Tākai Here Pouiwi for the 2025–2028 triennium.",
};

export default function CouncillorsPage() {
  return <Directory />;
}
