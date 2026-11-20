import type { MinuteVoteState } from "@/lib/minutes/record";

export type Phrase = { en: string; mi: string; review: boolean };

/** New te reo on the minutes record. `review` means a person still needs to check the Māori. */
export const voteState: Record<MinuteVoteState, Phrase> = {
  for: { en: "For", mi: "Āe", review: false },
  against: { en: "Against", mi: "Whakahē", review: false },
  abstained: { en: "Abstained", mi: "I waiho", review: true },
  absent: { en: "Absent", mi: "Tāwāhi", review: false },
  "not-voting": { en: "Not voting", mi: "Kāore i pōti", review: false },
  "not-recorded": { en: "Not recorded", mi: "Kāore i tuhia", review: false },
  "not-read": { en: "Not read", mi: "Kāore i pānuitia", review: true },
  "no-division": { en: "No division recorded", mi: "Kāore he wehenga i tuhia", review: true },
};

export const howNav: Phrase = { en: "How this works", mi: "Pēhea tēnei mahi", review: true };

export const minutesPhrases: Phrase[] = [
  { en: "Votes in the official minutes", mi: "Ngā pōti i ngā meneti whaimana", review: true },
  { en: "Clause", mi: "Wāhanga", review: false },
  { en: "Result", mi: "Hua", review: false },
  { en: "Vote", mi: "Pōti", review: false },
  { en: "Words in the minutes", mi: "Ngā kupu i ngā meneti", review: true },
  { en: "Clause heading not in the block", mi: "Kāore he upoko wāhanga i te poraka", review: true },
  { en: "Result not in the block", mi: "Kāore he hua i te poraka", review: true },
  { en: "Sync time", mi: "Wā tukutahi", review: true },
  {
    en: "The closed session in these minutes was not copied.",
    mi: "Kāore i tāruatia te wāhanga i katia ai te hui.",
    review: true,
  },
  {
    en: "No closed-session text was in the extract.",
    mi: "Kāore he kupu o te wāhanga kati i te tangohanga.",
    review: true,
  },
  {
    en: "For, against, abstained, absent, and not voting are copied only when the minutes use that list. Not recorded means this person was not named. Not read means the block could not be checked. No division recorded means the text had no standing-order division. Nothing is filled in from a missing name.",
    mi: "Ka tāruatia te āe, te whakahē, te waiho, te tāwāhi, me te kore pōti anake mēnā kei ngā meneti tēnā rārangi. Ko te ‘kāore i tuhia’ te tangata kāore i whakaingoatia. Ko te ‘kāore i pānuitia’ te poraka kāore i taea te tiro. Ko te ‘kāore he wehenga i tuhia’ te kupu kāore he wehenga ā-tūtohu-tū. Kāore e whakakīa mai i te ingoa ngaro.",
    review: true,
  },
];

export const howParagraphs: { heading: string | null; headingMi: string; body: Phrase }[] = [
  {
    heading: "What is collected",
    headingMi: "He aha ka kohia",
    body: {
      en: "The sync reads public Mātai Manapori files: the committee clause export, the decision register, and the meetings calendar. It also reads the public minutes PDFs linked from that calendar. There is no council login. Officer email addresses are dropped. Text between “the hui went into public-excluded session” and the return from that session is not copied. Names of people who are not members are not stored.",
      mi: "Ka pānui te tukutahi i ngā kōnae tūmatanui a Mātai Manapori: te kaweake wāhanga komiti, te rēhita whakataunga, me te maramataka hui. Ka pānui hoki i ngā PDF meneti tūmatanui e honoa ana i taua maramataka. Kāore he takiuru kaunihera. Ka makaa ngā īmēra āpiha. Kāore e tāruatia te kupu i waenga i te ‘kua kuhu te hui ki te wāhanga aukati’ me te hokinga mai. Kāore e rongoā ngā ingoa o te hunga ehara i te mema.",
      review: true,
    },
  },
  {
    heading: "What is automated",
    headingMi: "He aha ka mahia e te papatono",
    body: {
      en: "A program copies a division only when the minutes say “A division was called for” or “A division was required”, and the For and Against names add up to the majority count printed in that block. Absent, abstained, and not voting each keep their own list. If the count does not match, or the same person is named twice, the block is marked not read and no side is shown. No score, ranking, colour, or prediction is calculated.",
      mi: "Ka tāruatia e te papatono tētahi wehenga anake mēnā e kī ana ngā meneti ‘i karangatia he wehenga’ rānei ‘i hiahiatia he wehenga’, ā, e ōrite ana ngā ingoa āe me ngā ingoa whakahē ki te tatau nuinga i tāia ki taua poraka. Kei a ia anō te rārangi mō te tāwāhi, te waiho, me te kore pōti. Ki te kore e ōrite te tatau, ki te rua rānei te ingoa o te tangata kotahi, ka tohua te poraka kāore i pānuitia, kāore e whakaaturia he taha. Kāore e tātaihia he kaute, he raupapa, he tae, he matapae rānei.",
      review: true,
    },
  },
  {
    heading: "What is not filled in",
    headingMi: "He aha kāore e whakakīa",
    body: {
      en: "A person who is not named is not recorded. That is not absence and it is not an abstention. The Mātai Manapori name lists are not copied onto the councillor page. In this set of minutes, no division block used an abstain list, so abstained is not shown for these meetings. Plain-language lines on a decision are a reading of the published clause. Where no Māori sentence has been written, the page says so.",
      mi: "Ko te tangata kāore i whakaingoatia, kāore i tuhia. Ehara i te tāwāhi, ehara hoki i te waiho. Kāore e tāruatia ngā rārangi ingoa a Mātai Manapori ki te whārangi kaikaunihera. I tēnei huinga meneti, kāore he poraka wehenga i whakamahi rārangi waiho, nō reira kāore e whakaaturia te waiho mō ēnei hui. He pānui o te wāhanga kua whakaputaina ngā rārangi reo māhorahora. Ki te kore anō kia tuhia he kupu Māori, ka kī te whārangi.",
      review: true,
    },
  },
  {
    heading: "Report an error",
    headingMi: "Tono mai mēnā he hē",
    body: {
      en: "If Beehive has misread a public minute, open an issue on the public code repository. That site is separate and may ask for its own account. Beehive does not take an account and does not record who visited. If the minutes themselves are wrong, write to Wellington City Council through its contact page. The minutes remain the statutory record.",
      mi: "Mēnā kua hē te pānui a Beehive i tētahi meneti tūmatanui, whakatūria he take ki te pūtaha waehere tūmatanui. He pae kē tērā, ā, tērā pea ka tono tāna ake pūkete. Kāore a Beehive e tango pūkete, kāore hoki e tuhi ko wai i toro mai. Mēnā he hē ngā meneti, tuhia ki Te Kaunihera o Pōneke mā tana whārangi whakapā. Ko ngā meneti tonu te pūkete ā-ture.",
      review: true,
    },
  },
];

export const plugsPhrase: Phrase = { en: "Plug-ins", mi: "", review: true };

export const aboutNoScore: Phrase = {
  en: "It is not a poll, a whip count, a ranking, or a prediction. A councillor page does not score how often someone voted with the majority. The old Express API is archived under archive/legacy-express and is not part of this website.",
  mi: "Ehara i te pōti whakaaro, i te tatau porotēhi, i te raupapa, i te matapae rānei. Kāore te whārangi kaikaunihera e kaute i te maha o ngā wā i pōti tahi ai tētahi ki te nuinga. Kei archive/legacy-express te API Express tawhito, ā, ehara i te wāhanga o tēnei paetukutuku.",
  review: true,
};

export const minutesNotMatai: Phrase = {
  en: "The names in the tables below are the Mātai Manapori export. They are not the minutes. That export does not split abstain, absent, and not voting, so those rows stay unfilled. The councillor page reads the minutes and keeps those states separate.",
  mi: "Ko ngā ingoa i ngā ripanga i raro nei te kaweake a Mātai Manapori. Ehara i ngā meneti. Kāore taua kaweake e wehe i te waiho, te tāwāhi, me te kore pōti, nō reira ka waiho wātea aua rārangi. Ka pānui te whārangi kaikaunihera i ngā meneti, ā, ka noho wehe aua tūnga.",
  review: true,
};

export const howIntro: Phrase[] = [
  {
    en: "Beehive is not a government agency and has not signed the Algorithm Charter. This note follows the charter’s ask to say what is collected, what the program does, and how to report an error.",
    mi: "Ehara a Beehive i te tari kāwanatanga, ā, kāore anō kia haina i te Tūtohu Algorithm. E whai ana tēnei tuhipoka i te tono o te tūtohu kia kīia he aha ka kohia, he aha tā te papatono, me te āhua o te tono hē.",
    review: true,
  },
  {
    en: "Report a Beehive error",
    mi: "Tono mai he hē a Beehive",
    review: true,
  },
  {
    en: "Contact Wellington City Council",
    mi: "Whakapā atu ki Te Kaunihera o Pōneke",
    review: true,
  },
  {
    en: "Te reo awaiting review",
    mi: "Te reo e tatari ana ki te arotake",
    review: true,
  },
  {
    en: "The Māori sentences written for this page and for the new vote labels are a draft. They need a person to review them. They are not a Council translation. Plug-ins has no Māori string yet, so the navigation shows the English word.",
    mi: "He hukihuki ngā rerenga Māori i tuhia mō tēnei whārangi me ngā tapanga pōti hou. Me arotake e tētahi tangata. Ehara i te whakamāoritanga a te Kaunihera. Kāore anō he kupu Māori mō te ‘Plug-ins’, nō reira ka whakaatu te urungi i te kupu Ingarihi.",
    review: true,
  },
  {
    en: "No Māori string written.",
    mi: "Kāore he kupu Māori i tuhia.",
    review: true,
  },
  {
    en: "Algorithm Charter for Aotearoa New Zealand",
    mi: "Te Tūtohu Algorithm mō Aotearoa",
    review: true,
  },
];

export function draftsForReview(): Phrase[] {
  return [
    howNav,
    plugsPhrase,
    aboutNoScore,
    minutesNotMatai,
    ...howIntro,
    ...minutesPhrases,
    ...howParagraphs.flatMap((part) => [part.body, { en: part.heading ?? "", mi: part.headingMi, review: true }]),
  ].filter((phrase) => phrase.review);
}
