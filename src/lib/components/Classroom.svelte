<script>
  import { onMount } from "svelte";
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

  const cols = $derived(Math.max(4, Math.ceil(Math.sqrt(total * 1.4))));
  const rows = $derived(Math.ceil(total / cols));

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
  <svg viewBox="0 0 {cols * 40} {rows * 40}" role="img" aria-label={caption}>
    {#each Array(total) as _, i}
      {@const col = i % cols}
      {@const row = Math.floor(i / cols)}
      <g transform="translate({col * 40 + 20},{row * 40 + 20})">
        <!-- backrest -->
        <rect x="-9" y="-15" width="18" height="7" rx="2" class="backrest" />
        <!-- seat -->
        <rect
          bind:this={seatEls[i]}
          x="-11"
          y="-8"
          width="22"
          height="16"
          rx="3"
          class="seat"
          fill="var(--seat-occupied)"
        />
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
  .backrest {
    fill: var(--baseline);
    opacity: 0.6;
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
