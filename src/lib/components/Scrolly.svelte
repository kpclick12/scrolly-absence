<script>
  import { onMount } from "svelte";

  let { visual, children, onStepChange } = $props();
  let container;

  // Alltid den kortaste vägen till ett svar: vilket steg har sin mittpunkt
  // närmast viewportens mitt just nu. Undviker "dödzoner" mellan stegen som
  // en tunn IntersectionObserver-slit annars kan ge när avstånden mellan
  // korten är stora.
  onMount(() => {
    const stepEls = [...container.querySelectorAll(".scrolly-step")];
    let ticking = false;

    function updateActiveStep() {
      ticking = false;
      const viewportCenter = window.innerHeight / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;
      stepEls.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const elCenter = rect.top + rect.height / 2;
        const distance = Math.abs(elCenter - viewportCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = i;
        }
      });
      stepEls.forEach((el, i) => el.classList.toggle("is-active", i === closestIndex));
      onStepChange?.(closestIndex);
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActiveStep);
      }
    }

    updateActiveStep();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  });
</script>

<div class="scrolly" bind:this={container}>
  <div class="scrolly-sticky">
    {@render visual()}
  </div>
  <div class="scrolly-steps">
    {@render children()}
  </div>
</div>

<style>
  .scrolly {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;
  }
  .scrolly-sticky {
    position: sticky;
    top: 0;
    height: 100svh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: var(--page-plane);
  }
  .scrolly-steps {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 60svh;
    padding-top: 30svh;
    padding-bottom: 60svh;
  }
  @media (max-width: 860px) {
    .scrolly {
      grid-template-columns: 1fr;
    }
    .scrolly-sticky {
      height: 46svh;
      top: 0;
    }
    .scrolly-steps {
      padding-top: 8svh;
    }
  }
</style>
