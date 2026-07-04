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

<main>
  {#if error}
    <p class="status">Kunde inte ladda data: {error}</p>
  {:else if !data}
    <p class="status">Laddar data…</p>
  {:else}
    <header class="hero">
      <p class="eyebrow">Grundskoleförvaltningen · Testdata</p>
      <h1>Tomma stolar</h1>
      <p class="subtitle">
        En scrollytelling om frånvaro i grundskolan — {data.overview.totalElever.toLocaleString("sv-SE")}
        elever, {data.overview.senasteLasar}.
      </p>
      <p class="scroll-hint">Scrolla för att börja ↓</p>
    </header>

    <Story {data} />
    <ExploreView {data} />

    <footer>
      <p>
        Datan på den här sidan är syntetisk testdata, genererad för att illustrera
        koncept och layout — inte verkliga elevuppgifter.
      </p>
    </footer>
  {/if}
</main>

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
    min-height: 90svh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    gap: 12px;
  }
  .eyebrow {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--series-blue);
    font-weight: 600;
    margin: 0;
  }
  h1 {
    font-size: clamp(40px, 8vw, 72px);
    margin: 0;
    letter-spacing: -0.02em;
  }
  .subtitle {
    max-width: 480px;
    font-size: 18px;
  }
  .scroll-hint {
    margin-top: 24px;
    font-size: 14px;
    color: var(--text-muted);
    animation: bob 2s ease-in-out infinite;
  }
  @keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
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
