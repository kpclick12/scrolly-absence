<script>
  import { scaleLinear, scaleQuantize } from "d3-scale";

  // Divergerande blå-röd: blått = låg frånvaro, rött = hög. 5 steg med grå
  // mitt så små punkter inte försvinner mot bakgrunden.
  const BLUE_RAMP = ["#0068b2", "#649ecf", "#98948a", "#cc8370", "#a7391d"];

  let { data = [], title = "", unit = "%" } = $props();

  const W = 260;
  const H = 340;

  const x = $derived(
    scaleLinear()
      .domain([Math.min(...data.map((d) => d.lon)) - 0.5, Math.max(...data.map((d) => d.lon)) + 0.5])
      .range([20, W - 20])
  );
  // latitud ökar norrut men SVG y ökar nedåt -> invertera
  const y = $derived(
    scaleLinear()
      .domain([Math.min(...data.map((d) => d.lat)) - 0.5, Math.max(...data.map((d) => d.lat)) + 0.5])
      .range([H - 20, 20])
  );
  const values = $derived(data.map((d) => d.franvaroProcent));
  const color = $derived(
    scaleQuantize()
      .domain([Math.min(...values), Math.max(...values)])
      .range(BLUE_RAMP)
  );
</script>

<figure class="scattermap">
  {#if title}<figcaption class="title">{title}</figcaption>{/if}
  <svg viewBox="0 0 {W} {H}" role="img" aria-label="Karta över skolornas frånvaro">
    {#each data as d (d.skola)}
      <g transform="translate({x(d.lon)},{y(d.lat)})">
        <circle r="7" fill={color(d.franvaroProcent)} stroke="var(--surface-1)" stroke-width="2">
          <title>{d.skola} ({d.kommun}): {d.franvaroProcent}{unit}</title>
        </circle>
      </g>
    {/each}
  </svg>
  <p class="note">Förenklad, illustrativ karta (ej exakt kartprojektion).</p>
</figure>

<style>
  .scattermap {
    margin: 0;
    width: 100%;
    max-width: 260px;
  }
  .title {
    font-size: 14px;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .note {
    font-size: 11px;
    color: var(--text-muted);
    margin-top: 6px;
    text-align: center;
  }
</style>
