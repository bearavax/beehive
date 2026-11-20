"use client";

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
          en="A council adapter carries the statutory badge only when Beehive core ships it. Every other manifest is badged as a community plug-in, including this starter. Plug-ins may read. They may not write, and they may not show a decision they cannot cite."
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
                  · <a href={plugin.manifest.maintainer.url}>{plugin.manifest.maintainer.url}</a>
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
        <a href="/api/v1">/api/v1</a>
      </p>
    </article>
  );
}
