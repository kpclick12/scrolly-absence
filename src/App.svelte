<script>
  import { onMount } from "svelte";
  import { loadData } from "./lib/data/load.js";
  import Story from "./lib/story/Story.svelte";
  import ExploreView from "./lib/components/ExploreView.svelte";

  let data = $state(null);
  let error = $state(null);

  onMount(async () => {
    try {
      data = await loadData();
    } catch (e) {
      error = e.message;
    }
  });
</script>

{#if error}
  <p class="status">Kunde inte ladda data: {error}</p>
{:else if !data}
  <p class="status">Laddar data…</p>
{:else}
  <header class="hero">
    <div class="hero-inner">
      <p class="eyebrow">Göteborgs Stad · Grundskoleförvaltningen</p>
      <h1>
        <span class="hero-line1">Tomma</span>
        <span class="hero-line2">stolar</span>
      </h1>
      <p class="subtitle">
        Varje dag är tusentals av grundskolans
        {data.overview.totalElever.toLocaleString("sv-SE")} elever inte i
        klassrummet. Vad frånvaron döljer — och varför den inte drabbar alla
        lika. En berättelse i data om läsåret {data.overview.senasteLasar}.
      </p>
      <p class="data-note">Data: syntetisk testdata (ej verkliga elevuppgifter).</p>
      <p class="scroll-hint">Scrolla<span class="scroll-tick">|</span></p>
    </div>
  </header>

  <main>
    <Story {data} />
    <ExploreView {data} />
  </main>

  <footer>
    <p>
      Datan på den här sidan är syntetisk testdata, genererad för att illustrera
      koncept och layout — inte verkliga elevuppgifter.
    </p>
  </footer>
{/if}

<style>
  main {
    max-width: 1100px;
    margin: 0 auto;
  }
  .status {
    padding: 40px;
    text-align: center;
    color: var(--text-muted);
  }
  .hero {
    min-height: 100svh;
    display: flex;
    align-items: center;
    background:
      radial-gradient(120% 90% at 80% 10%, var(--hero-navy) 0%, var(--hero-navy-deep) 100%);
    color: #ffffff;
  }
  .hero-inner {
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
</style>
