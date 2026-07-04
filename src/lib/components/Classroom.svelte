<script>
  import gsap from "gsap";

  let {
    total = 24,
    absent = 0,
    segments = null, // optional: [{ label, color, value }] summing to `absent`
    caption = "",
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

  // Rader av bänkar, uppdelade i två block med en mittgång — som en riktig
  // sittplan sedd uppifrån, med tavlan längst fram.
  const cols = $derived(Math.max(4, Math.ceil(Math.sqrt(total * 1.4))));
  const rows = $derived(Math.ceil(total / cols));
  const leftCols = $derived(Math.ceil(cols / 2));

  const UNIT_W = 42;
  const UNIT_H = 50;
  const AISLE = 22;
  const BOARD_MARGIN = 26;

  function colX(col) {
    return col < leftCols
      ? col * UNIT_W
      : leftCols * UNIT_W + AISLE + (col - leftCols) * UNIT_W;
  }

  const svgWidth = $derived(cols * UNIT_W + AISLE);
  const svgHeight = $derived(rows * UNIT_H + BOARD_MARGIN);

  function colorForSeat(seatIndex) {
    const emptyCount = Math.round(absent);
    if (seatRank[seatIndex] >= emptyCount) return null; // occupied
    if (!segments) return "var(--seat-empty)";
    // walk the scattered order and assign to segments in proportion
    const orderInEmpty = seatRank[seatIndex];
    let acc = 0;
    for (const seg of segments) {
      acc += seg.value;
      if (orderInEmpty < acc) return seg.color;
    }
    return "var(--seat-empty)";
  }

  let seatEls = $state([]);
  let prevColors = [];

  $effect(() => {
    const colors = Array.from({ length: total }, (_, i) => colorForSeat(i));
    seatEls.slice(0, total).forEach((el, i) => {
      if (!el) return;
      const isNewlyEmpty = !prevColors[i] && colors[i];
      gsap.to(el, {
        fill: colors[i] ?? "var(--seat-occupied)",
        duration: 0.5,
        ease: "power2.out",
      });
      if (isNewlyEmpty) {
        gsap.fromTo(
          el.closest("g"),
          { scale: 1.35, transformOrigin: "50% 50%" },
          { scale: 1, duration: 0.45, ease: "back.out(2.5)" }
        );
      }
    });
    prevColors = colors;
  });
</script>

<figure class="classroom">
  <svg viewBox="0 0 {svgWidth} {svgHeight}" role="img" aria-label={caption}>
    <rect
      class="board"
      x={svgWidth / 2 - Math.min(svgWidth * 0.4, 90)}
      y="4"
      width={Math.min(svgWidth * 0.8, 180)}
      height="7"
      rx="3"
    />
    {#each Array(total) as _, i}
      {@const col = i % cols}
      {@const row = Math.floor(i / cols)}
      {@const cx = colX(col) + UNIT_W / 2}
      {@const cy = row * UNIT_H + BOARD_MARGIN + UNIT_H / 2}
      <g transform="translate({cx},{cy})">
        <!-- bänk, sedd uppifrån, alltid neutral -->
        <rect class="desk" x="-15" y="-19" width="30" height="12" rx="2" />
        <!-- stol -->
        <g transform="translate(0,6)">
          <rect x="-8" y="6" width="16" height="4" rx="1.5" class="chair-back" />
          <rect
            bind:this={seatEls[i]}
            x="-9"
            y="-8"
            width="18"
            height="14"
            rx="4"
            class="seat"
            fill="var(--seat-occupied)"
          />
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
    max-width: 480px;
  }
  svg {
    width: 100%;
    height: auto;
    display: block;
  }
  .board {
    fill: var(--text-muted);
    opacity: 0.5;
  }
  .desk {
    fill: var(--gridline);
    stroke: var(--baseline);
    stroke-width: 1;
  }
  .chair-back {
    fill: var(--baseline);
    opacity: 0.7;
  }
  .seat {
    stroke: var(--surface-1);
    stroke-width: 1.5;
  }
  figcaption {
    margin-top: 8px;
    font-size: 14px;
    color: var(--text-muted);
    text-align: center;
  }
</style>
