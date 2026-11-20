"use client";

import Link from "next/link";
import { T } from "@/lib/i18n";

export function AboutView({ syncedAt }: { syncedAt: string }) {
  return (
    <article className="prose">
      <p className="eyebrow">
        <T en="Methodology and Te Tiriti" mi="Te tikanga me Te Tiriti" />
      </p>
      <h1 className="lede">
        <T
          en="A public reading of decisions the city has already published."
          mi="He pānui tūmatanui o ngā whakataunga kua whakaputaina kētia e te tāone."
        />
      </h1>

      <section>
        <h2>
          <T en="Where the words come from" mi="Nō hea ngā kupu" />
        </h2>
        <p>
          <T
            en="Beehive syncs published reports from Mātai Manapori at meetings.wellington.govt.nz. The script requests the report and its clause record, drops officer email addresses, and writes only what the API returned. If the service cannot be reached, the script stops and does not invent a substitute."
            mi="Ka tukutahi a Beehive i ngā pūrongo kua whakaputaina mai i Mātai Manapori i meetings.wellington.govt.nz. Ka tonoa e te hōtuhi te pūrongo me tana rēkoata wāhanga, ka makaa ngā īmēra āpiha, ā, ka tuhia anake ngā mea i whakahoki mai e te API. Ki te kore e taea te toro atu, ka mutu te hōtuhi, kāore e tito i tētahi whakakapi."
          />
        </p>
        <p>
          <T
            en={`This copy of the site was synced at ${syncedAt}. The set is a curated public slice of the 2025–2028 triennium, not every clause the Council has ever passed. Running npm run sync:wcc refreshes it from the live service.`}
            mi={`I tukutahitia tēnei kape o te pae i te ${syncedAt}. He topenga tūmatanui kua kōwhiria o te tau toru 2025–2028, ehara i te katoa o ngā wāhanga kua pahure i te Kaunihera. Mā te whakahaere i a npm run sync:wcc e tāmata anō i te ratonga ora.`}
          />
        </p>
        <p>
          <T
            en="Plain-language layers are readings of those clauses. A figure appears in a summary only when the clause states it: 5.9 percent, $42.4 million, $1.5 billion, $400,000, $4.1 million, 51 percent NZTA funding. If Mātai Manapori left a clause blank, the page says the text was blank."
            mi="He pānui o aua wāhanga ngā paparanga reo māhorahora. Ka puta tētahi tau ki te whakarāpopoto anake mēnā kua kī te wāhanga: 5.9 ōrau, $42.4 miriona, $1.5 piriona, $400,000, $4.1 miriona, 51 ōrau te pūtea a Waka Kotahi. Mēnā i waiho wātea tētahi wāhanga e Mātai Manapori, ka kī te whārangi i wātea te kupu."
          />
        </p>
      </section>

      <section>
        <h2>
          <T en="Votes are not filled in" mi="Kāore ngā pōti e whakakīa" />
        </h2>
        <p>
          <T
            en="Standing Order 27.6(d) requires every vote at a Council meeting to be a division. Standing Order 27.7 enters the names for and against in the minutes. Council’s own LGOIMA letter IRC-8897 (August 2025) says that under Standing Orders 27.6 and 27.27, committees record a division when a member requests it, while Council records them all. The published standing orders file numbers the division rule as 27.6(d) and 27.7. Both descriptions are cited on each decision."
            mi="E ai ki te Tūtohu Tū 27.6(d), me wehenga ngā pōti katoa i te hui Kaunihera. Mā te Tūtohu Tū 27.7 e tā ngā ingoa āe, whakahē hoki ki ngā meneti. E ai ki te reta LGOIMA a te Kaunihera, IRC-8897 (Ākuhata 2025), i raro i ngā Tūtohu Tū 27.6 me 27.27, ka tuhia e ngā komiti tētahi wehenga ina tono tētahi mema, ā, ka tuhia katoatia e te Kaunihera. Ko te nama i te kōnae tūtohu tū kua whakaputaina ko 27.6(d) me 27.7. Ka tuhi i ngā whakamārama e rua ki ia whakataunga."
          />
        </p>
        <p>
          <T
            en="Schedule 7, clause 28 of the Local Government Act 2002 makes authenticated minutes prima facie evidence of the proceedings. A YouTube stream and a Mātai Manapori row are aids. They do not outrank the minute. Abstain, absent, and conflict of interest are shown as their own rows and left unfilled when the source does not separate them."
            mi="Mā te Āpitihanga 7, te wāhanga 28 o te Local Government Act 2002 e kī he taunakitanga tuatahi ngā meneti kua whakamanaia. He āwhina te ataata YouTube me te rārangi Mātai Manapori. Kāore e eke ake i te meneti. Ka whakaaturia te waiho, te tāwāhi, me te pānga whaiaro hei rārangi motuhake, ā, ka waiho wātea mēnā kāore te puna e wehe i aua āhuatanga."
          />
        </p>
      </section>

      <section>
        <h2>
          <T en="Te Tiriti o Waitangi" mi="Te Tiriti o Waitangi" />
        </h2>
        <p>
          <T
            en="The Council’s terms of reference record statutory obligations to iwi and Māori under Te Tiriti o Waitangi, including through the Local Government Act 2002 and the Resource Management Act 1991. In April 2022 the Council formalised Tākai Here with Taranaki Whānui ki Te Upoko o Te Ika, Te Rūnanganui o Te Āti Awa, and Te Rūnanga o Toa Rangatira."
            mi="E tuhia ana e ngā tikanga tohutoro a te Kaunihera ngā here ā-ture ki ngā iwi me ngāi Māori i raro i Te Tiriti o Waitangi, tae atu ki te Local Government Act 2002 me te Resource Management Act 1991. I te Āperira 2022 i whakaūngia e te Kaunihera a Tākai Here me Taranaki Whānui ki Te Upoko o Te Ika, Te Rūnanganui o Te Āti Awa, me Te Rūnanga o Toa Rangatira."
          />
        </p>
        <p>
          <T
            en="Pouiwi is the title of the mana whenua representatives appointed to committees. The terms of reference say they are full members of those bodies, with the right to debate and vote. They are not a footnote on this site. Holden Hohaia and Liz Kelly sit in the directory beside the Mayor and the ward councillors. The terms also say Tākai Here representatives may attend and speak at full Council, and do not vote there. Beehive repeats that limit rather than granting a vote the standing orders do not."
            mi="Ko Pouiwi te taitara o ngā māngai mana whenua kua kopoua ki ngā komiti. E ai ki ngā tikanga tohutoro, he mema tūturu rātou o aua rōpū, me te mana ki te tautohetohe, ki te pōti. Ehara rātou i te kōwae waewae i tēnei pae. E noho ana a Holden Hohaia rāua ko Liz Kelly ki te rārangi i te taha o te Koromatua me ngā kaikaunihera takiwā. E kī ana hoki ngā tikanga ka taea e ngā māngai o Tākai Here te tae atu, te kōrero ki te Kaunihera katoa, kāore e pōti i reira. Ka tukurua a Beehive i tērā tepe, kāore e hoatu i tētahi pōti kāore i ngā tūtohu tū."
          />
        </p>
        <p>
          <T
            en="Te Whanganui-a-Tara Māori Ward elects one councillor, currently Matthew Reweti. Te reo Māori on this site is a working language of the interface, not a decoration. Statutory clause text stays in the language the Council published, which is English, and the plain-language reading sits beside it."
            mi="Ka pōti te Takiwā Māori o Te Whanganui-a-Tara i tētahi kaikaunihera kotahi, ko Matthew Reweti ināianei. He reo mahi te reo Māori o tēnei pae, ehara i te whakarei. Ka noho te kupu wāhanga ā-ture ki te reo i whakaputa ai te Kaunihera, arā te reo Pākehā, ā, ka noho te pānui reo māhorahora i tōna taha."
          />
        </p>
      </section>

      <section>
        <h2>
          <T en="What this version is not" mi="Ehara tēnei putanga i te aha" />
        </h2>
        <p>
          <T
            en="It is not a poll, a whip count, or a prediction. Alignment on a profile is the share of named divisions in this set where the member’s vote matched the recorded result. It will move when more reports are synced. The legacy Express API under backend/ is an earlier, unused project and is not part of this website."
            mi="Ehara i te pōti whakaaro, i te tatau porotēhi, i te matapae rānei. Ko te hāngai i te kōtaha te wāhi o ngā wehenga kua whakaingoatia i tēnei huinga i ōrite ai te pōti a te mema ki te hua i tuhia. Ka neke ina tukutahitia ētahi atu pūrongo. He kaupapa tawhito kāore i te whakamahia te API Express i raro i a backend/, ā, ehara i te wāhanga o tēnei paetukutuku."
          />
        </p>
      </section>

      <section>
        <h2>
          <T en="Plug-ins" mi="" />
        </h2>
        <p>
          <T
            en="Other councils connect through a CouncilAdapter. Community hackathon plug-ins are badged separately from the statutory Wellington record. The public read API is /api/v1."
            mi=""
          />
        </p>
        <p>
          <Link href="/plugins">
            <T en="See the plug-in register" mi="" />
          </Link>
        </p>
      </section>

      <section>
        <h2>
          <T en="Sources" mi="Ngā puna" />
        </h2>
        <ul>
          <li>
            <a href="https://meetings.wellington.govt.nz">Mātai Manapori</a>
          </li>
          <li>
            <a href="https://wellington.govt.nz/your-council/about-the-council/mayor-and-councillors/councillors">
              <T en="Councillor directory" mi="Rārangi kaikaunihera" />
            </a>
          </li>
          <li>
            <a href="https://wellington.govt.nz/-/media/your-council/elections/2025/wellington-city-council-2025-triennial-elections---final-result.pdf">
              <T en="2025 election declaration" mi="Whakapuakanga pōtitanga 2025" />
            </a>
          </li>
          <li>
            <a href="https://wellington.govt.nz/news-and-events/news-and-information/our-wellington/2026/10/northern-ward-by-election">
              <T en="2026 Takapū/Northern by-election" mi="Pōtitanga 2026 o Takapū/te Raki" />
            </a>
          </li>
          <li>
            <a href="https://wellington.govt.nz/-/media/your-council/meetings/tor-2025-2028/2025-11-24-terms-of-reference-and-delegations-2025.pdf">
              <T en="Terms of reference, 2025–2028" mi="Ngā tikanga tohutoro, 2025–2028" />
            </a>
          </li>
          <li>
            <a href="https://wellington.govt.nz/-/media/your-council/meetings/files/standing-orders.pdf">
              <T en="Standing orders" mi="Ngā tūtohu tū" />
            </a>
          </li>
          <li>
            <a href="https://wellington.govt.nz/-/media/your-council/about-the-council/information-requests/2025/irc-8897-voting-records.pdf">
              IRC-8897
            </a>
          </li>
          <li>
            <a href="https://www.legislation.govt.nz/act/public/2002/0084/latest/DLM170873.html">Local Government Act 2002</a>
          </li>
        </ul>
      </section>
    </article>
  );
}
