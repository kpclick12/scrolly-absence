<script>
  let {
    total = 24,
    absent = 0,
    segments = null, // optional: [{ label, color, value }] summing to `absent`
    caption = "",
    cols: colsOverride = null, // valfri fast kolumnbredd (t.ex. 5 för ett jämnt 5×5)
  } = $props();

  // Fast, stable "random" order so seats empty in a scattered, natural-looking
  // pattern instead of filling block-by-block — but the same order every time,
  // so the same physical seat keeps its identity as the story scrolls.
  function seededOrder(n) {
    const arr = [...Array(n).keys()];
    let seed = 1337;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    const rank = new Array(n);
    arr.forEach((seatIndex, order) => (rank[seatIndex] = order));
    return rank;
  }

  let seatRank = $derived(seededOrder(total));

  const cols = $derived(colsOverride ?? Math.max(4, Math.ceil(Math.sqrt(total * 1.4))));
  const rows = $derived(Math.ceil(total / cols));

  const UNIT_W = 46;
  const UNIT_H = 58;
  const TOP = 26; // plats för tavlan

  function isEmpty(seatIndex) {
    return seatRank[seatIndex] < Math.round(absent);
  }

  function emptyColor(seatIndex) {
    if (!segments) return "var(--seat-empty)";
    const orderInEmpty = seatRank[seatIndex];
    let acc = 0;
    for (const seg of segments) {
      acc += seg.value;
      if (orderInEmpty < acc) return seg.color;
    }
    return "var(--seat-empty)";
  }
</script>

<figure class="classroom">
  <svg
    viewBox="0 0 {cols * UNIT_W} {rows * UNIT_H + TOP}"
    role="img"
    aria-label={caption}
  >
    <!-- tavlan längst fram -->
    <rect
      class="board"
      x={cols * UNIT_W * 0.18}
      y="4"
      width={cols * UNIT_W * 0.64}
      height="6"
      rx="3"
    />
    {#each Array(total) as _, i}
      {@const col = i % cols}
      {@const row = Math.floor(i / cols)}
      {@const empty = isEmpty(i)}
      <g
        class="seat-unit"
        class:empty
        style="--empty-color: {emptyColor(i)}; transition-delay: {(seatRank[i] % 12) * 30}ms"
        transform="translate({col * UNIT_W + UNIT_W / 2},{row * UNIT_H + TOP + UNIT_H / 2})"
      >
        <!-- stol: ryggstöd, sits, ben -->
        <g class="chair">
          <rect x="-10" y="-17" width="20" height="20" rx="3" class="backrest" />
          <rect x="-12" y="5" width="24" height="6" rx="2" class="seat" />
          <rect x="-10" y="11" width="3" height="8" rx="1.2" class="leg" />
          <rect x="7" y="11" width="3" height="8" rx="1.2" class="leg" />
        </g>
        <!-- eleven: huvud + axlar -->
        <g class="person">
          <circle cx="0" cy="-13" r="6.5" />
          <path d="M -9.5 7 Q -9.5 -5 0 -5 Q 9.5 -5 9.5 7 Z" />
        </g>
        <!-- kontur av eleven som saknas -->
        <g class="ghost">
          <circle cx="0" cy="-13" r="6.5" />
          <path d="M -9.5 7 Q -9.5 -5 0 -5 Q 9.5 -5 9.5 7 Z" />
        </g>
      </g>
    {/each}
  </svg>
  {#if caption}
    <figcaption>{caption}</figcaption>
  {/if}
</figure>

<style>
  .classroom {
    margin: 0;
    width: 100%;
    max-width: 460px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .board {
    fill: var(--baseline);
    opacity: 0.8;
  }
  .backrest,
  .seat,
  .leg {
    fill: var(--seat-occupied);
    transition: fill 0.45s ease;
    transition-delay: inherit;
  }
  .person {
    fill: var(--person, #56708a);
    opacity: 1;
    transform-origin: 0 0;
    transition: opacity 0.45s ease, transform 0.45s ease;
    transition-delay: inherit;
  }
  .ghost {
    /* konturen av eleven som saknas, urkarvad ur den röda stolen */
    fill: none;
    stroke: var(--surface-1);
    stroke-width: 1.6;
    stroke-dasharray: 3.5 3;
    opacity: 0;
    transition: opacity 0.45s ease;
    transition-delay: inherit;
  }
  .seat-unit.empty .backrest,
  .seat-unit.empty .seat,
  .seat-unit.empty .leg {
    fill: var(--empty-color, var(--seat-empty));
  }
  .seat-unit.empty .person {
    opacity: 0;
    transform: translateY(-4px) scale(0.92);
  }
  .seat-unit.empty .ghost {
    opacity: 0.45;
  }
  figcaption {
    margin-top: 10px;
    font-size: 14px;
    color: var(--text-muted);
    text-align: center;
  }
</style>
