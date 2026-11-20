"use client";

import Link from "next/link";
import { OutboundLink } from "@/components/outbound";
import { T } from "@/lib/i18n";
import type { RegisteredPlugin } from "@/plugins/registry";

export function PluginsView({ plugins }: { plugins: RegisteredPlugin[] }) {
  return (
    <article>
      <p className="eyebrow">May 2027</p>
      <h1 className="lede">
        <T
          en="Plug-ins sit beside the statutory record. They do not replace it."
          mi="Ka noho ngā āpitihanga ki te taha o te pūkete ā-ture. Kāore e whakakapi i taua pūkete."
        />
      </h1>
      <p style={{ maxWidth: "42rem", marginTop: "0.9rem" }}>
        <T
          en="Only the Wellington adapter is loaded in this process, and it is the statutory record. A community plug-in runs outside Beehive: it reads the public API and publishes JSON with citations. This site does not execute that code."
          mi=""
        />
      </p>
      <div className="feed" style={{ marginTop: "1.4rem" }}>
        {plugins.map((plugin) => (
          <article key={plugin.manifest.id} className="card" style={{ cursor: "default" }}>
            <p className="kicker">
              <span className="pill">{plugin.badge === "statutory-record" ? "Statutory record" : "Community plug-in"}</span>
              <span>{plugin.manifest.id}</span>
            </p>
            <h2>
              <T en={plugin.manifest.name.en} mi={plugin.manifest.name.mi ?? ""} />
            </h2>
            <p>
              <T en={plugin.manifest.summary.en} mi={plugin.manifest.summary.mi ?? ""} />
            </p>
            <p className="meta">
              <T en="Maintainer" mi="Kaitiaki" />: {plugin.manifest.maintainer.name}
              {plugin.manifest.maintainer.url ? (
                <>
                  {" "}
                  · <OutboundLink href={plugin.manifest.maintainer.url}>{plugin.manifest.maintainer.url}</OutboundLink>
                </>
              ) : null}
              {" · "}
              {plugin.manifest.license}
              {" · "}
              {plugin.manifest.scopes.join(", ")}
            </p>
          </article>
        ))}
      </div>
      <p style={{ marginTop: "1.2rem" }}>
        <Link href="/api/v1">/api/v1</Link>
      </p>
    </article>
  );
}
