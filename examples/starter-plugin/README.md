# Example community plug-in

This is a starter for the May 2027 Beehive hackathon. It is a **community plug-in**. It is not the Wellington City Council record.

The manifest is `beehive-plugin.json`. `src/adapter.ts` implements `CouncilAdapter` and returns no meetings, no decisions, and no votes. That is deliberate. Add a record only when you can point at a public source. Leave unknown fields null.

## Contract, in plain language

1. Copy this folder.
2. Change `id`, `name`, `summary`, and `maintainer` in `beehive-plugin.json`.
3. Keep `kind` as `community` and `council` as `null`.
4. Keep `citationLock` true. If you show a decision, link the clause it came from.
5. Ask only for read scopes. The validator rejects anything that writes.
6. Put te reo Māori in `name.mi` when you have a sourced translation. Use `null` until then. Do not invent a name.
7. Run `npm run plugins:check` from the Beehive repo.

Beehive will badge this plug-in **Community plug-in**. The statutory badge is reserved for the council adapter shipped in core. Today that is Te Kaunihera o Pōneke, reading Mātai Manapori.

Honour Te Tiriti o Waitangi in what you build. If your plug-in speaks about mana whenua or Pouiwi, use the Council’s own names and do not grant a vote the standing orders do not give. The public API at `/api/v1/members` already lists the Tākai Here Pouiwi beside the elected members.

The longer contract is `docs/plugin-sdk.md`.
