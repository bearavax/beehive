import type { Metadata } from "next";
import { PluginsView } from "@/components/plugins-view";
import { plugins } from "@/plugins/registry";

export const metadata: Metadata = {
  title: "Plug-ins",
  description: "Statutory council adapters and community plug-ins for Beehive.",
};

export default function PluginsPage() {
  return <PluginsView plugins={plugins} />;
}
