const DPR_CAPS = {
    high: [1, 2],
    medium: [1, 1.5],
    low: [1, 1.25],
};
const PARTICLE_COUNTS = {
    high: 2500,
    medium: 600,
    low: 0,
};
function detectMobile() {
    if (typeof navigator === "undefined")
        return false;
    const uaMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    const narrowViewport = typeof window !== "undefined" && window.innerWidth < 768;
    return uaMobile || narrowViewport;
}
function detectWebglSupport() {
    if (typeof document === "undefined")
        return false;
    try {
        const canvas = document.createElement("canvas");
        return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    }
    catch {
        return false;
    }
}
function detectReducedMotion() {
    if (typeof window === "undefined" || !window.matchMedia)
        return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
/**
 * Conservative, cheap classification — not a synthetic benchmark.
 * Combines viewport, mobile UA sniffing, WebGL availability and core count.
 */
export function detectPerformanceProfile() {
    const webglSupported = detectWebglSupport();
    const isMobile = detectMobile();
    const prefersReducedMotion = detectReducedMotion();
    const cores = typeof navigator !== "undefined" ? navigator.hardwareConcurrency ?? 4 : 4;
    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1440;
    let tier;
    if (!webglSupported) {
        tier = "low";
    }
    else if (isMobile) {
        tier = viewportWidth >= 768 && cores >= 6 ? "medium" : "low";
    }
    else {
        tier = cores >= 8 ? "high" : cores >= 4 ? "medium" : "low";
    }
    return {
        tier,
        dpr: DPR_CAPS[tier],
        particleCount: PARTICLE_COUNTS[tier],
        postprocessingAllowed: tier === "high" && !prefersReducedMotion,
        isMobile,
        webglSupported,
        prefersReducedMotion,
    };
}
