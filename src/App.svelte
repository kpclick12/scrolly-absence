<script>
  import { appData as data } from "./lib/data/load.js";
  import Story from "./lib/story/Story.svelte";
  import ExploreView from "./lib/components/ExploreView.svelte";

  // Bakgrundsmotiv i heron: ett svagt rutnät av stolar där en handfull
  // lyser guld — frånvaron, synlig redan innan berättelsen börjat.
  const MOTIF_COLS = 12;
  const MOTIF_ROWS = 7;
  const motifChairs = (() => {
    let seed = 4711;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const n = MOTIF_COLS * MOTIF_ROWS;
    const idx = [...Array(n).keys()];
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    const golds = new Set(idx.slice(0, 6)); // ~7% av stolarna, som frånvaron
    return Array.from({ length: n }, (_, i) => golds.has(i));
  })();
</script>

<header class="hero">
    <svg
      class="hero-motif"
      viewBox="0 0 {MOTIF_COLS * 46} {MOTIF_ROWS * 58}"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {#each motifChairs as gold, i}
        {@const col = i % MOTIF_COLS}
        {@const row = Math.floor(i / MOTIF_COLS)}
        <g
          class="motif-chair"
          class:gold
          transform="translate({col * 46 + 23},{row * 58 + 29})"
        >
          <rect x="-9" y="-15" width="18" height="17" rx="3" />
          <rect x="-11" y="4" width="22" height="5" rx="2" />
          <rect x="-9" y="9" width="2.5" height="7" rx="1" />
          <rect x="6.5" y="9" width="2.5" height="7" rx="1" />
        </g>
      {/each}
    </svg>
    <div class="hero-inner">
      <p class="eyebrow">Göteborgs Stad · Grundskoleförvaltningen</p>
      <h1>
        <span class="hero-line1">Tomma</span>
        <span class="hero-line2">stolar</span>
      </h1>
      <p class="subtitle">
        Var tionde av grundskolans
        {data.overview.totalElever.toLocaleString("sv-SE")} elever är inte i
        klassrummet en vanlig skoldag — och i högstadiet är det var femte.
        Varför frånvaron växer, vem den drabbar och vad som döljer sig bakom
        snittet. En berättelse i data, {data.overview.senasteLasar}.
      </p>
      <p class="data-note">Data: syntetisk testdata (ej verkliga elevuppgifter).</p>
      <p class="scroll-hint">Scrolla<span class="scroll-tick">|</span></p>
    </div>
  </header>

  <main>
    <Story {data} />
    <ExploreView {data} />
  </main>

  <section class="epilog">
    <div class="epilog-inner">
      <p class="epilog-kicker">Imorgon igen</p>
      <h2>
        {data.overview.elevFranvarandeEnGenomsnittsdag.toLocaleString("sv-SE")}
        stolar står tomma imorgon också.
      </h2>
      <p class="epilog-text">
        Bakom varje siffra i statistiken finns ett barn. Frånvaron är den
        tidigaste varningssignal skolan har — den stiger efter loven, den
        biter sig fast över åren och den slutar i stängda dörrar. Men den går
        att vända. Och varje vecka räknas.
      </p>
    </div>
  </section>

  <section class="sources" aria-label="Om datat och källorna">
    <div class="sources-inner">
      <h2>Om datat och källorna</h2>
      <ul>
        <li>
          Alla siffror på den här sidan är <strong>syntetiskt testdata</strong>
          (cirka 50 000 elever), framtaget för att utveckla berättelsen —
          inte verklig frånvarostatistik.
        </li>
        <li>
          Frånvaro anges som andel av planerad undervisningstid. Ämnessteget
          använder lektionsfrånvaro; övriga steg frånvaro på dagnivå.
        </li>
        <li>
          Gränsen 15 % motsvarar ungefär en missad skoldag i veckan — en nivå
          som ofta används som riktmärke för problematisk frånvaro.
        </li>
        <li>
          Sambanden på sidan (behörighet, socioekonomi) är korrelationer och
          säger inte vad som orsakar vad.
        </li>
        <li>
          Om etablering efter skolan:
          <a
            href="https://www.scb.se/contentassets/6ff64321080743098e42407073d31d14/uf0549_2018a01_br_a40br1803.pdf"
            target="_blank"
            rel="noopener noreferrer"
            >SCB:s temarapport om inträdet på arbetsmarknaden efter
            gymnasieskolan (2018)</a
          >.
        </li>
      </ul>
    </div>
  </section>

  <footer>
    <p>
      Datan på den här sidan är syntetisk testdata, genererad för att illustrera
      koncept och layout — inte verkliga elevuppgifter.
    </p>
  </footer>

<style>
  main {
    max-width: 1100px;
    margin: 0 auto;
  }
  .hero {
    position: relative;
    min-height: 100svh;
    display: flex;
    align-items: center;
    background:
      radial-gradient(120% 90% at 80% 10%, var(--hero-navy) 0%, var(--hero-navy-deep) 100%);
    color: #ffffff;
    overflow: hidden;
  }
  .hero-motif {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    /* håll motivet ur vägen för rubriken — synligt mest i kanterna */
    -webkit-mask-image: radial-gradient(ellipse 75% 65% at 44% 46%, transparent 0%, transparent 38%, #000 78%);
    mask-image: radial-gradient(ellipse 75% 65% at 44% 46%, transparent 0%, transparent 38%, #000 78%);
  }
  .motif-chair rect {
    fill: rgba(255, 255, 255, 0.045);
  }
  .motif-chair.gold rect {
    fill: rgba(255, 205, 55, 0.38);
  }
  .hero-inner {
    position: relative;
    max-width: 700px;
    margin: 0 auto;
    padding: 48px 32px;
    width: 100%;
  }
  .eyebrow {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--hero-gold);
    font-weight: 600;
    margin: 0 0 28px;
  }
  h1 {
    font-family: var(--serif);
    font-weight: 700;
    font-size: clamp(56px, 11vw, 110px);
    line-height: 1.02;
    margin: 0 0 32px;
    letter-spacing: -0.01em;
    color: #ffffff;
  }
  .hero-line1 {
    display: block;
  }
  .hero-line2 {
    display: block;
    font-style: italic;
    color: var(--hero-lightblue);
  }
  .subtitle {
    font-size: 19px;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.92);
    max-width: 560px;
    margin: 0 0 20px;
  }
  .data-note {
    font-size: 14px;
    color: var(--hero-gold);
    margin: 0 0 64px;
  }
  .scroll-hint {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    color: rgba(255, 255, 255, 0.55);
    text-align: center;
    margin: 0;
  }
  .scroll-tick {
    display: block;
    margin-top: 6px;
    animation: bob 2s ease-in-out infinite;
  }
  @keyframes bob {
    0%, 100% { transform: translateY(0); opacity: 0.4; }
    50% { transform: translateY(6px); opacity: 1; }
  }
  footer {
    padding: 40px 24px 80px;
    text-align: center;
    color: var(--text-muted);
    font-size: 13px;
    border-top: 1px solid var(--border);
    margin-top: 40px;
  }
  .epilog {
    background: radial-gradient(120% 90% at 20% 10%, var(--hero-navy) 0%, var(--hero-navy-deep) 100%);
    color: #ffffff;
    padding: 110px 32px;
    text-align: center;
  }
  .epilog-inner {
    max-width: 640px;
    margin: 0 auto;
  }
  .epilog-kicker {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--hero-gold);
    font-weight: 600;
    margin: 0 0 20px;
  }
  .epilog h2 {
    font-family: var(--serif);
    font-size: clamp(30px, 5vw, 46px);
    line-height: 1.15;
    color: #ffffff;
    margin: 0 0 24px;
  }
  .epilog-text {
    font-size: 16px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.85);
    margin: 0;
  }
  /* Källförteckning — samma ljusa yta som footer, men med lite mer luft */
  .sources {
    background: var(--surface-1);
    border-top: 1px solid var(--border);
  }
  .sources-inner {
    max-width: 640px;
    margin: 0 auto;
    padding: 48px 24px;
  }
  .sources h2 {
    font-family: var(--serif);
    font-size: 18px;
    margin: 0 0 16px;
    color: var(--text-primary);
  }
  .sources ul {
    margin: 0;
    padding-left: 20px;
  }
  .sources li {
    font-size: 13.5px;
    line-height: 1.6;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .sources li:last-child {
    margin-bottom: 0;
  }
  .sources a {
    color: var(--series-blue);
  }
</style>
