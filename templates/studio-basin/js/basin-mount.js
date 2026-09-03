/* BASIN mount — vanilla port of the Next BasinHero.tsx behaviour.
   Fresh canvas per renderer ATTEMPT (a disposed WebGL context is gone
   forever), WebGPU-first with one WebGL2 retry, IO-paused off-screen,
   svh-stable sizing so mobile browser-chrome collapse never re-frames
   the scene mid-scroll. */
import { detectPerformanceProfile } from "./tier.js";

export function mountBasin(mount) {
  if (!mount) return;
  const profile = detectPerformanceProfile();
  const statusEl = mount.closest(".basin");
  const setStatus = (s) => statusEl && (statusEl.dataset.status = s);

  if (!profile.webglSupported) {
    setStatus("fallback");
    return;
  }

  let disposed = false;
  let handle = null;
  let heroIo = null;
  const canvases = [];

  const makeCanvas = () => {
    const canvas = document.createElement("canvas");
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.setAttribute("aria-hidden", "true");
    mount.appendChild(canvas);
    canvases.push(canvas);
    return canvas;
  };

  const params = new URLSearchParams(window.location.search);
  const forceWebGL = params.has("forcegl");
  const goLive = (h) => {
    if (disposed) {
      h.dispose();
      canvases.forEach((c) => c.remove());
      return;
    }
    handle = h;
    setStatus("live");
    const section = mount.closest("section");
    if (section && typeof IntersectionObserver !== "undefined") {
      heroIo = new IntersectionObserver(
        (entries) => entries.forEach((e) => h.setRunning(e.isIntersecting)),
        { rootMargin: "80px 0px 80px 0px" },
      );
      heroIo.observe(section);
    }
  };

  import("./basin-scene.js")
    .then((mod) => {
      if (disposed) return;
      return mod.createBasin(makeCanvas(), profile, { forceWebGL }).then(
        (h) => goLive(h),
        (err) => {
          console.error("[basin] renderer init failed:", err);
          if (disposed || forceWebGL) throw err;
          canvases.pop()?.remove();
          return mod.createBasin(makeCanvas(), profile, { forceWebGL: true }).then(goLive);
        },
      );
    })
    .catch((err) => {
      console.error("[basin] renderer failed to initialise:", err);
      setStatus("fallback");
    });

  window.addEventListener("beforeunload", () => {
    disposed = true;
    heroIo?.disconnect();
    handle?.dispose();
  });
}

