import type { Issue } from "@/lib/types";

export const issues: Issue[] = [
  {
    slug: "rates-planning",
    en: "Rates and planning",
    mi: "Ngā reiti me te whakamahere",
    summaryEn:
      "The triennium plan, the 2026/27 Annual Plan settings, rates relief after the April 2026 storms, and the question of who may sit as a non-elected member.",
    summaryMi:
      "Te mahere tau toru, ngā whakaritenga o te Mahere ā-Tau 2026/27, te whakahekenga reiti i muri i ngā tupuhi o Āperira 2026, me te pātai ko wai ka āhei te noho hei mema kāore i pōtitia.",
  },
  {
    slug: "tiaki-wai",
    en: "Tiaki Wai water",
    mi: "Te wai o Tiaki Wai",
    summaryEn:
      "How Wellington sets up and then watches Tiaki Wai MetroWater, including mana whenua on the partners’ committee.",
    summaryMi:
      "Te āhua o te whakatū, te tirotiro hoki a Pōneke i a Tiaki Wai MetroWater, tae atu ki ngā mana whenua i te komiti hoa.",
  },
  {
    slug: "transport-infrastructure",
    en: "Transport and infrastructure",
    mi: "Te waka me ngā hanganga",
    summaryEn:
      "The Golden Mile review and make-safe works, and the Brooklyn-to-city bike and bus traffic resolution.",
    summaryMi:
      "Te arotake Golden Mile me ngā mahi haumaru taupua, me te whakataunga waka pahikara, pahi hoki mai i te Rarapa ki te tāone.",
  },
  {
    slug: "housing-city",
    en: "Housing and city delivery",
    mi: "Ngā whare me te whakatinana tāone",
    summaryEn:
      "The Housing Action Plan for the rest of the triennium, and oversight of Te Toi Mahana community housing.",
    summaryMi:
      "Te Mahere Mahi Whare mō te toenga o te tau toru, me te tirotiro i ngā whare hapori o Te Toi Mahana.",
  },
];

export function issueBySlug(slug: string) {
  return issues.find((issue) => issue.slug === slug);
}
