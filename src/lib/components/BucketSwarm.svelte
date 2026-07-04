<script>
  import gsap from "gsap";

  let { dots = [], buckets = [], spread = false, caption = "" } = $props();

  // sekventiell blå-ramp, ljus->mörk — samma "mer blått = mer frånvaro"-grammatik som heatmapen
  const BLUE_STEPS = ["#9ec5f4", "#5598e7", "#184f95", "#0d366b"];

  const W = 640;
  const H = 340;
  const plotCenterY = 130;

  // Fermats spiral ger en jämn, deterministisk cirkelpackning utan fysiksimulering
  const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
  function phyllotaxis(i, n, maxR) {
    const r = maxR * Math.sqrt((i + 0.5) / Math.max(n, 1));
    const theta = i * GOLDEN_ANGLE;
    return { x: r * Math.cos(theta), y: r * Math.sin(theta) };
  }

  const clusterCenter = { x: W / 2, y: plotCenterY };
  const clusterR = 95;

  const zoneCenters = $derived(
    buckets.map((b, i) => ({
      x: (W / buckets.length) * (i + 0.5),
      y: plotCenterY,
    }))
  );
  const maxCount = $derived(Math.max(1, ...buckets.map((b) => b.dots)));

  const dotsByBucket = $derived(
    buckets.map((b) => dots.filter((d) => d.bucket === b.id))
  );

  function targetFor(dot, spreadState) {
    if (!spreadState) {
      const p = phyllotaxis(dot.id, dots.length, clusterR);
      return {
        x: clusterCenter.x + p.x,
        y: clusterCenter.y + p.y,
        color: "var(--text-muted)",
      };
    }
    const bucketDots = dotsByBucket[dot.bucket];
    const indexInBucket = bucketDots.indexOf(dot);
    const bucket = buckets[dot.bucket];
    const zoneR = 16 + 42 * Math.sqrt(bucket.dots / maxCount);
    const p = phyllotaxis(indexInBucket, bucketDots.length, zoneR);
    const zone = zoneCenters[dot.bucket];
    return { x: zone.x + p.x, y: zone.y + p.y, color: BLUE_STEPS[dot.bucket] };
  }

  // Engångs-ögonblicksbild av startläget (alltid klumpad, komponenten monteras
  // innan spread någonsin blir true). Måste vara icke-reaktiv — annars snappar
  // Svelte själv attributen till slutläget vid varje spread-ändring, och GSAP
  // får inget avstånd kvar att animera.
  const initialPositions = dots.map((dot) => targetFor(dot, false));

  let dotEls = $state([]);

  $effect(() => {
    dots.forEach((dot, i) => {
      const el = dotEls[i];
      if (!el) return;
      const t = targetFor(dot, spread);
      gsap.to(el, {
        attr: { cx: t.x, cy: t.y },
        fill: t.color,
        duration: 0.9,
        ease: "power3.inOut",
        delay: (i % 40) * 0.004,
      });
    });
  });
</script>

<figure class="swarm">
  <svg viewBox="0 0 {W} {H}" role="img" aria-label={caption}>
    {#each dots as dot, i}
      <circle
        bind:this={dotEls[i]}
        cx={initialPositions[i].x}
        cy={initialPositions[i].y}
        r="3.2"
        fill={initialPositions[i].color}
      />
    {/each}
    {#if !spread}
      <text x={clusterCenter.x} y={clusterCenter.y - 6} text-anchor="middle" class="center-label">
        {dots.length > 0 ? buckets.reduce((s, b) => s + b.antalElever, 0).toLocaleString("sv-SE") : ""}
      </text>
      <text x={clusterCenter.x} y={clusterCenter.y + 14} text-anchor="middle" class="center-sublabel">
        elever
      </text>
    {/if}
    {#if spread}
      {#each buckets as b, i}
        <text x={zoneCenters[i].x} y={H - 44} text-anchor="middle" class="bucket-label">
          {b.label}
        </text>
        <text x={zoneCenters[i].x} y={H - 26} text-anchor="middle" class="bucket-value">
          {b.andelElever}%
        </text>
        <text x={zoneCenters[i].x} y={H - 10} text-anchor="middle" class="bucket-count">
          {b.antalElever.toLocaleString("sv-SE")} elever
        </text>
      {/each}
    {/if}
  </svg>
  {#if caption}
    <figcaption>{caption}</figcaption>
  {/if}
</figure>

<style>
  .swarm {
    margin: 0;
    width: 100%;
    max-width: 640px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .center-label {
    font-size: 28px;
    font-weight: 600;
    fill: var(--text-primary);
  }
  .center-sublabel {
    font-size: 13px;
    fill: var(--text-muted);
  }
  .bucket-label {
    font-size: 13px;
    font-weight: 600;
    fill: var(--text-secondary);
  }
  .bucket-value {
    font-size: 18px;
    font-weight: 600;
    fill: var(--text-primary);
  }
  .bucket-count {
    font-size: 11px;
    fill: var(--text-muted);
  }
  figcaption {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-muted);
    text-align: center;
  }
</style>
