/* =====================================================================
   BASIN — Thornbury flagship hero system, Phase 1 (redo)
   A strange attractor, held. No object, no silhouette — pure behaviour.

   The rules this file obeys (full argument in DESIGN.md):
   - NOTHING here represents a real-world thing. The form is the Thomas
     cyclically-symmetric attractor: thousands of paths that look wild
     and all obey one equation. That is the studio thesis as math.
   - The chaos dial is literal: the attractor's damping parameter B and
     the trail persistence are tuned to sit at the edge of chaos —
     coherent braid, never noise, never a frozen loop.
   - Saturated colour is rationed dynamically: only DISTURBED matter
     burns vermilion, and only until the attractor pulls it home. An
     idle frame is almost entirely cool; the visitor paints the red.
   - One code path for both backends: the sim is integrated on the CPU
     (a few thousand points — PARALLAX precedent) into a ring-buffer
     history texture; the GPU renders stateless from it. No compute
     shaders, so WebGPU and WebGL2 render identically.
   - Additive light, no materials pretending to be matter, no
     postprocessing, zero assets.
   ===================================================================== */
import * as THREE from "three/webgpu";
import { uniform, instancedBufferAttribute, texture, varying, uv, float, vec2, vec3, mix, sin, cos, pow, max, clamp, smoothstep, normalize, cross, length, exp, floor, fract, oneMinus, positionLocal, cameraPosition, } from "three/tsl";
/* ---------------------------------------------------------------
   PALETTE — cold water, one ember
   The dye-house indigo survives from the killed round; the warmth
   that undercut it does not. Everything is cool except disturbance.
   --------------------------------------------------------------- */
const COL = {
    vatDeep: new THREE.Color("#06090f"), // floor of the water
    vatMid: new THREE.Color("#0a0e19"), // fog + dome mid — kept within ~5%
    vatHigh: new THREE.Color("#111726"), // above, faintly lighter
    keyIvory: new THREE.Color("#e9edf6"), // the one light — strictly cool
    inkDeep: new THREE.Color("#1d2a47"), // slow pigment, sinking into the dye
    inkPale: new THREE.Color("#d7e3f8"), // fast pigment catching the shaft
    madder: new THREE.Color("#b04033"), // disturbance only — craft red, lit
    shadow: new THREE.Color("#04060b"), // the pool
};
const FOG_COLOR = COL.vatMid.clone();
/* THE ONE LIGHT — a cool ivory key hung upper-left, visible as a shaft
   in the water. World-space rig; the trails receive it transformed into
   their rotating local space via per-frame uniforms. */
const KEY_L_WORLD = new THREE.Vector3(-0.3, 0.85, 0.42).normalize();
const SHAFT_LEN = 7.5;
const SHAFT_WIDTH = 1.15;
/* ---------------------------------------------------------------
   THE EQUATION — Thomas's cyclically symmetric attractor
   dx/dt = sin(y) − Bx ;  dy/dt = sin(z) − By ;  dz/dt = sin(x) − Bz
   B is the chaos dial. 0.18 sits at the edge: a woven, ball-like
   braid that never settles and never smears into noise.
   --------------------------------------------------------------- */
const B = 0.18;
const SIM_SCALE = 0.5; // sim units (±4-ish) → world units
const SIM_SPEED = 1.15;
/* History rows advance on SIM time, not frames — trail length must not
   depend on the display's refresh rate. Each row is ~35 ms of path; the
   head row is rewritten every frame so the tip stays continuous. */
const ROW_DT = 0.035;
function thomas(x, y, z, out) {
    out[0] = Math.sin(y) - B * x;
    out[1] = Math.sin(z) - B * y;
    out[2] = Math.sin(x) - B * z;
}
/* ---------------------------------------------------------------
   QUALITY — per-tier budgets
   --------------------------------------------------------------- */
const QUALITY = {
    high: { particles: 1536, history: 40 },
    medium: { particles: 1024, history: 32 },
    low: { particles: 640, history: 26 },
};
export async function createBasin(canvas, profile, opts = {}) {
    const q = QUALITY[profile.tier];
    const P = q.particles;
    const H = q.history;
    const SEGS = P * (H - 1);
    const reduced = profile.prefersReducedMotion;
    const renderer = new THREE.WebGPURenderer({
        canvas,
        antialias: true,
        powerPreference: "high-performance",
        forceWebGL: !!opts.forceWebGL,
    });
    await renderer.init();
    /* DPR policy: additive glow softens gracefully, so resolution is the
       right thing to spend first. Desktop caps at 1.5 (measured: dpr 2 at
       1440×900 costs ~66% of the frame rate on an integrated GPU, and the
       look barely changes); phones keep 2 — small screens, tier-low
       counts, and pixel density is most visible there. */
    const dprCap = profile.isMobile ? 2 : Math.min(1.5, profile.dpr[1]);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, dprCap));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.setClearColor(FOG_COLOR, 1);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, canvas.clientWidth / Math.max(1, canvas.clientHeight), 0.1, 140);
    const basin = new THREE.Group();
    scene.add(basin);
    /* ---------------------------------------------------------------
       THE DOME — the same room-with-weather discipline, strictly cool
       --------------------------------------------------------------- */
    {
        const domeMat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
        const nrm = normalize(positionLocal);
        const y = nrm.y;
        const below = vec3(COL.vatDeep.r, COL.vatDeep.g, COL.vatDeep.b);
        const mid = vec3(FOG_COLOR.r, FOG_COLOR.g, FOG_COLOR.b);
        const above = vec3(COL.vatHigh.r, COL.vatHigh.g, COL.vatHigh.b);
        const ivory = vec3(COL.keyIvory.r, COL.keyIvory.g, COL.keyIvory.b);
        const base = mix(mix(below, mid, smoothstep(-0.5, 0.05, y)), above, smoothstep(0.08, 0.75, y));
        /* Faint brightening of the water toward where the light hangs —
           the room admits its one light; the void does not. */
        const toKey = clamp(nrm.dot(vec3(KEY_L_WORLD.x, KEY_L_WORLD.y, KEY_L_WORLD.z)), 0, 1);
        domeMat.colorNode = base.add(ivory.mul(pow(toKey, 3.5).mul(0.05)));
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(60, 32, 24), domeMat));
    }
    /* ---------------------------------------------------------------
       SIM STATE — positions, impulses, heat. CPU-owned, texture-shared.
       History texture: width = particle, height = ring slot.
       RGB = sim-space position, A = heat at the moment of writing, so a
       disturbance leaves a red streak along the path it took home.
       --------------------------------------------------------------- */
    const pos = new Float32Array(P * 3);
    const imp = new Float32Array(P * 3);
    const heat = new Float32Array(P);
    const deriv = new Float32Array(3);
    // Seed in a loose shell; pre-warm pulls everything onto the manifold.
    for (let i = 0; i < P; i++) {
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 2.2 + Math.random() * 1.6;
        pos[i * 3 + 0] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph);
    }
    const histData = new Float32Array(P * H * 4);
    const histTex = new THREE.DataTexture(histData, P, H, THREE.RGBAFormat, THREE.FloatType);
    histTex.magFilter = THREE.NearestFilter;
    histTex.minFilter = THREE.NearestFilter;
    histTex.generateMipmaps = false;
    histTex.needsUpdate = true;
    let head = 0;
    let rowClock = 0;
    /* One RK2 (midpoint) step per particle + impulse decay. */
    const mid = new Float32Array(3);
    function integrate(h) {
        const impDecay = Math.exp(-h * 3.2);
        const heatDecay = Math.exp(-h * 0.8); // ~4 s from bloom to healed
        for (let i = 0; i < P; i++) {
            const ix = i * 3;
            let x = pos[ix];
            let y = pos[ix + 1];
            let z = pos[ix + 2];
            thomas(x, y, z, deriv);
            mid[0] = x + deriv[0] * h * 0.5;
            mid[1] = y + deriv[1] * h * 0.5;
            mid[2] = z + deriv[2] * h * 0.5;
            thomas(mid[0], mid[1], mid[2], deriv);
            x += deriv[0] * h + imp[ix] * h;
            y += deriv[1] * h + imp[ix + 1] * h;
            z += deriv[2] * h + imp[ix + 2] * h;
            pos[ix] = x;
            pos[ix + 1] = y;
            pos[ix + 2] = z;
            imp[ix] *= impDecay;
            imp[ix + 1] *= impDecay;
            imp[ix + 2] *= impDecay;
            heat[i] *= heatDecay;
        }
    }
    let heatMax = 0;
    function writeRow(advance) {
        if (advance)
            head = (head + 1) % H;
        const rowOff = head * P * 4;
        let hm = 0;
        for (let i = 0; i < P; i++) {
            const ix = i * 3;
            const o = rowOff + i * 4;
            histData[o] = pos[ix];
            histData[o + 1] = pos[ix + 1];
            histData[o + 2] = pos[ix + 2];
            histData[o + 3] = heat[i];
            if (heat[i] > hm)
                hm = heat[i];
        }
        heatMax = hm;
        histTex.needsUpdate = true;
    }
    /* Pre-warm: settle onto the attractor, then fill every history row so
       the braid is fully formed at first paint — no naked start. */
    for (let i = 0; i < 260; i++)
        integrate(0.03);
    for (let r = 0; r < H; r++) {
        integrate(ROW_DT);
        writeRow(true);
    }
    /* ---------------------------------------------------------------
       UNIFORMS
       --------------------------------------------------------------- */
    const uHead = uniform(head);
    /* Speed normalisation is a constant now that rows are sim-cadenced:
       a typical |f| of ~1.6 sim units/s over ROW_DT, scaled to world. */
    const uInvRef = uniform(1 / (ROW_DT * 1.6 * SIM_SCALE * 1.9));
    /* Light rig uniforms. World-space shaft placement is set by frame()
       (composition differs desktop/portrait); the *Local variants are the
       same rig transformed into the rotating group's space each frame so
       the filaments are lit consistently while the object turns. */
    const uTimeB = uniform(0);
    const uShaftOW = uniform(new THREE.Vector3(0.9, 4.6, -1.3));
    const uShaftDW = uniform(new THREE.Vector3(-0.42, -1.0, 0.1).normalize());
    const uKeyLLocal = uniform(KEY_L_WORLD.clone());
    const uShaftOLocal = uniform(new THREE.Vector3());
    const uShaftDLocal = uniform(new THREE.Vector3());
    const uCamLocal = uniform(new THREE.Vector3(0, 0, 9));
    /* Exposure differs per framing: the portrait braid is smaller and
       runs tier-low path counts, so it earns more light. */
    const uExposure = uniform(1);
    /* Gaussian shaft intensity at a point, given the rig in that point's
       own space. Radial falloff across the beam, soft entry and slow
       decay along it. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const shaftMaskAt = (p, o, d) => {
        const v = p.sub(o);
        const along = v.dot(d);
        const perp = v.sub(d.mul(along));
        const r2 = perp.dot(perp);
        const radial = exp(r2.mul(-1 / (SHAFT_WIDTH * SHAFT_WIDTH)));
        const alongFade = smoothstep(-0.5, 1.6, along).mul(exp(along.mul(-0.08)));
        return radial.mul(alongFade);
    };
    /* ---------------------------------------------------------------
       TRAIL GEOMETRY — one instanced quad per (particle, segment)
       Everything is derived from the history texture in the vertex
       stage; the CPU never touches this geometry again.
       --------------------------------------------------------------- */
    {
        const base = new THREE.PlaneGeometry(1, 1, 1, 1);
        const geo = new THREE.InstancedBufferGeometry();
        geo.index = base.index;
        geo.attributes.position = base.attributes.position;
        geo.attributes.uv = base.attributes.uv;
        geo.instanceCount = SEGS;
        const aSeg = new Float32Array(SEGS * 2); // particleIndex, segIndex
        for (let p = 0; p < P; p++) {
            for (let s = 0; s < H - 1; s++) {
                const k = (p * (H - 1) + s) * 2;
                aSeg[k] = p;
                aSeg[k + 1] = s;
            }
        }
        geo.setAttribute("aSeg", new THREE.InstancedBufferAttribute(aSeg, 2));
        const mat = new THREE.MeshBasicNodeMaterial();
        mat.transparent = true;
        mat.blending = THREE.AdditiveBlending;
        mat.depthWrite = false;
        mat.side = THREE.DoubleSide;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const seg = instancedBufferAttribute(geo.attributes.aSeg);
        const pIdx = seg.x;
        const sIdx = seg.y;
        const wrap = (v) => v.sub(floor(v.div(H)).mul(H));
        const uP = pIdx.add(0.5).div(P);
        const slot0 = wrap(uHead.sub(sIdx).add(H * 2));
        const slot1 = wrap(uHead.sub(sIdx).sub(1).add(H * 2));
        const t0 = texture(histTex, vec2(uP, slot0.add(0.5).div(H)));
        const t1 = texture(histTex, vec2(uP, slot1.add(0.5).div(H)));
        const p0 = t0.xyz.mul(SIM_SCALE);
        const p1 = t1.xyz.mul(SIM_SCALE);
        const segHeat = max(t0.w, t1.w);
        const along = uv().y;
        const centre = mix(p0, p1, along);
        const dir = p1.sub(p0);
        const segLen = length(dir);
        /* Camera transformed into the group's rotating local space — the
           positions here are local, so world cameraPosition would skew both
           the billboard and every lighting term as the object turns. */
        const viewDir = normalize(uCamLocal.sub(centre));
        const side = normalize(cross(viewDir, dir.div(max(segLen, 1e-5))));
        /* Age taper: newest segments are widest and brightest; the tail
           thins to nothing. Age runs continuously ALONG each segment, not
           per-segment — otherwise the taper steps at every joint and the
           close-up reads as blocky dashes. Per-particle jitter breaks
           uniformity. */
        const age = sIdx.add(along).div(H - 1);
        const lifeW = pow(oneMinus(age), 1.35);
        const jitter = fract(sin(pIdx.mul(12.9898)).mul(43758.5453));
        /* Tier low (phones) runs slightly thinner ribbons: overdraw is the
           scarce resource there, and 640 paths read fine a touch finer. */
        const baseW = profile.tier === "low" ? 0.012 : 0.014;
        const halfW = float(baseW)
            .mul(lifeW.mul(0.85).add(0.15))
            .mul(mix(float(0.55), float(1.45), jitter))
            .mul(smoothstep(0.0, 0.006, segLen)); // collapse degenerate segments
        mat.positionNode = centre.add(side.mul(uv().x.sub(0.5).mul(2)).mul(halfW));
        /* ---------- colour: lit pigment, not emitted light ----------
           The filament is ink. Its albedo comes from speed (slow pigment
           sinks toward the dye, fast pigment runs pale); its LUMINANCE
           comes from the room: one ivory key with a lit flank and a shadow
           flank, the visible shaft it passes through, occlusion inside the
           braid's body, and water that darkens with depth. Nothing emits. */
        const speedT = clamp(segLen.mul(uInvRef), 0.0, 1.0);
        const inkDeepC = vec3(COL.inkDeep.r, COL.inkDeep.g, COL.inkDeep.b);
        const inkPaleC = vec3(COL.inkPale.r, COL.inkPale.g, COL.inkPale.b);
        const madderC = vec3(COL.madder.r, COL.madder.g, COL.madder.b);
        const keyC = vec3(COL.keyIvory.r, COL.keyIvory.g, COL.keyIvory.b);
        const heat = clamp(segHeat, 0, 1);
        let albedo = mix(inkDeepC, inkPaleC, pow(speedT, 1.5));
        albedo = mix(albedo, madderC, heat);
        /* The lit flank: the braid shaded as a body. Outer shell facing the
           key catches it; the far flank falls into its own shadow. */
        const outward = normalize(centre);
        const keyLn = normalize(uKeyLLocal);
        const flank = clamp(outward.dot(keyLn), -1, 1).mul(0.5).add(0.5);
        const litSide = pow(flank, 1.4);
        /* Fibre response along the filament (a thread lights fullest when
           the light rakes across it, not along it). */
        const tanN = dir.div(max(segLen, 1e-5));
        const tDotL = tanN.dot(keyLn);
        const fibre = pow(oneMinus(tDotL.mul(tDotL)).max(0), 0.5);
        /* Occlusion: the braid's interior swallows light. */
        const radial = length(centre).div(2.0);
        const occ = smoothstep(0.15, 1.0, radial).mul(0.75).add(0.25);
        /* The shaft: pigment inside the beam is what the eye reads as lit;
           outside it survives on the water's ambient alone. */
        const shaft = shaftMaskAt(centre, uShaftOLocal, uShaftDLocal);
        const keyStrength = litSide.mul(fibre.mul(0.45).add(0.55)).mul(mix(float(0.32), float(1.0), shaft));
        /* Water: darker with depth below, dimmer with distance. */
        const depthWater = smoothstep(-3.4, 2.2, centre.y).mul(0.55).add(0.45);
        const dist = length(centre.sub(uCamLocal));
        const depthDim = exp(dist.sub(6).max(0).mul(-0.09));
        /* Fresh dye is wet — it catches light the settled pigment cannot,
           and it must: the red IS the thesis when it appears. */
        const ambient = mix(float(0.22), float(0.55), heat);
        const lum = ambient
            .add(keyStrength.mul(1.5))
            .mul(occ)
            .mul(depthWater)
            .mul(depthDim)
            .mul(uExposure);
        const heatLift = mix(float(1), float(2.2), heat);
        const bright = lifeW.mul(0.9).add(0.1);
        /* ALL lighting evaluates in the VERTEX stage and interpolates —
           lighting varies smoothly along a filament, so per-fragment
           recomputation (with its two history-texture taps per pixel) buys
           nothing visible and cost the real phone its 60 fps. The fragment
           is left with one interpolated colour and the core profile. */
        const vLit = varying(albedo.mul(keyC).mul(lum).mul(bright).mul(heatLift));
        const vAge = varying(age);
        /* Filament profile: dense core, pigment-soft edge; the newest tips
           are still blooming — softer, slightly haloed. */
        const across = uv().x;
        const strand = smoothstep(0.0, 0.42, across).mul(smoothstep(1.0, 0.58, across));
        const tipSoft = smoothstep(0.16, 0.0, vAge); // 1 at the very tip
        const core = pow(strand, mix(float(3.0), float(1.6), tipSoft))
            .mul(0.95)
            .add(strand.mul(mix(float(0.5), float(0.75), tipSoft)));
        mat.colorNode = vLit.mul(core);
        /* eslint-enable @typescript-eslint/no-explicit-any */
        const mesh = new THREE.Mesh(geo, mat);
        mesh.frustumCulled = false;
        basin.add(mesh);
    }
    /* ---------------------------------------------------------------
       THE ROOM — world-space fixtures. These do not rotate with the
       object: the light and the floor belong to the room, not the work.
       --------------------------------------------------------------- */
    /* The visible shaft: one cylindrically-billboarded blade of light. */
    {
        const beamMat = new THREE.MeshBasicNodeMaterial();
        beamMat.transparent = true;
        beamMat.blending = THREE.AdditiveBlending;
        beamMat.depthWrite = false;
        beamMat.side = THREE.DoubleSide;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const along = uv().y; // 0 top of beam → 1 bottom
        const acrossB = uv().x;
        const centreB = uShaftOW.add(uShaftDW.mul(along.mul(SHAFT_LEN)));
        const viewB = normalize(cameraPosition.sub(centreB));
        const sideB = normalize(cross(uShaftDW, viewB));
        /* Quad width hugs the visible gaussian — fragments past ~1.5σ are
           invisible but still cost full additive fill on mobile GPUs. */
        beamMat.positionNode = centreB.add(sideB.mul(acrossB.sub(0.5).mul(SHAFT_WIDTH * 1.7)));
        const ivory = vec3(COL.keyIvory.r, COL.keyIvory.g, COL.keyIvory.b);
        const acrossGauss = exp(acrossB.sub(0.5).mul(acrossB.sub(0.5)).mul(-11));
        const alongFade = smoothstep(0.0, 0.16, along).mul(pow(oneMinus(along), 1.3));
        beamMat.colorNode = ivory.mul(acrossGauss).mul(alongFade).mul(0.075);
        /* eslint-enable @typescript-eslint/no-explicit-any */
        const beam = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 24), beamMat);
        beam.frustumCulled = false;
        scene.add(beam);
    }
    /* Motes: the water made visible, only ever inside the shaft. */
    {
        const M = profile.tier === "high" ? 90 : profile.tier === "medium" ? 60 : 36;
        const base = new THREE.PlaneGeometry(1, 1, 1, 1);
        const geo = new THREE.InstancedBufferGeometry();
        geo.index = base.index;
        geo.attributes.position = base.attributes.position;
        geo.attributes.uv = base.attributes.uv;
        geo.instanceCount = M;
        const aMote = new Float32Array(M * 4); // along, radius, angle, seed
        for (let i = 0; i < M; i++) {
            aMote[i * 4 + 0] = Math.random();
            aMote[i * 4 + 1] = Math.pow(Math.random(), 0.6) * SHAFT_WIDTH * 0.5;
            aMote[i * 4 + 2] = Math.random() * Math.PI * 2;
            aMote[i * 4 + 3] = Math.random();
        }
        geo.setAttribute("aMote", new THREE.InstancedBufferAttribute(aMote, 4));
        const moteMat = new THREE.MeshBasicNodeMaterial();
        moteMat.transparent = true;
        moteMat.blending = THREE.AdditiveBlending;
        moteMat.depthWrite = false;
        moteMat.side = THREE.DoubleSide;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const m = instancedBufferAttribute(geo.attributes.aMote);
        const seed = m.w;
        /* A stable frame perpendicular to the beam, built from the beam
           direction itself (which never parallels world-X here). */
        const p1 = normalize(cross(uShaftDW, vec3(1, 0, 0)));
        const p2 = normalize(cross(uShaftDW, p1));
        const drift = sin(uTimeB.mul(0.06).add(seed.mul(6.28))).mul(0.35);
        const alongM = m.x.mul(SHAFT_LEN * 0.85).add(drift).add(0.4);
        const swirl = uTimeB.mul(0.03).mul(mix(float(0.6), float(1.4), seed));
        const px = cos(m.z.add(swirl)).mul(m.y);
        const py = sin(m.z.add(swirl)).mul(m.y);
        const centreM = uShaftOW
            .add(uShaftDW.mul(alongM))
            .add(p1.mul(px))
            .add(p2.mul(py));
        const viewM = normalize(cameraPosition.sub(centreM));
        const sideM = normalize(cross(viewM, vec3(0, 1, 0)));
        const upM = normalize(cross(sideM, viewM));
        const size = mix(float(0.012), float(0.03), fract(seed.mul(7.13)));
        moteMat.positionNode = centreM
            .add(sideM.mul(uv().x.sub(0.5).mul(size)))
            .add(upM.mul(uv().y.sub(0.5).mul(size)));
        const ivory = vec3(COL.keyIvory.r, COL.keyIvory.g, COL.keyIvory.b);
        const dCentre = length(uv().sub(vec2(0.5, 0.5))).mul(2);
        const disc = smoothstep(1.0, 0.2, dCentre);
        const twinkle = sin(uTimeB.mul(mix(float(0.4), float(1.1), seed)).add(seed.mul(9.4)))
            .mul(0.5)
            .add(0.5);
        const inShaft = shaftMaskAt(centreM, uShaftOW, uShaftDW);
        moteMat.colorNode = ivory.mul(disc).mul(inShaft).mul(twinkle.mul(0.5).add(0.2)).mul(0.5);
        /* eslint-enable @typescript-eslint/no-explicit-any */
        const motes = new THREE.Mesh(geo, moteMat);
        motes.frustumCulled = false;
        scene.add(motes);
    }
    /* The shadow-pool: a soft dark ellipse the object stands over. The
       single cheapest cure for "floating specimen" — the room has a
       floor, and the work casts onto it. Shadow only, no reflection. */
    const pool = (() => {
        const poolMat = new THREE.MeshBasicNodeMaterial();
        poolMat.transparent = true;
        poolMat.depthWrite = false;
        const d = length(uv().sub(vec2(0.5, 0.5))).mul(2);
        const shadowC = vec3(COL.shadow.r, COL.shadow.g, COL.shadow.b);
        poolMat.colorNode = shadowC;
        poolMat.opacityNode = exp(d.mul(d).mul(-3.2)).mul(smoothstep(1.0, 0.55, d)).mul(0.7);
        const meshP = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 3.0), poolMat);
        meshP.rotation.x = -Math.PI / 2;
        scene.add(meshP);
        return meshP;
    })();
    /* Where the shaft meets the floor, the floor answers: a dim ivory
       ellipse — the gallery spotlight completing its throw. This is what
       makes the ground legible without any reflection. */
    const lightPool = (() => {
        const lpMat = new THREE.MeshBasicNodeMaterial();
        lpMat.transparent = true;
        lpMat.blending = THREE.AdditiveBlending;
        lpMat.depthWrite = false;
        const d = length(uv().sub(vec2(0.5, 0.5))).mul(2);
        const ivory = vec3(COL.keyIvory.r, COL.keyIvory.g, COL.keyIvory.b);
        lpMat.colorNode = ivory.mul(exp(d.mul(d).mul(-4.5))).mul(0.055);
        const meshL = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), lpMat);
        meshL.rotation.x = -Math.PI / 2;
        scene.add(meshL);
        return meshL;
    })();
    /* Seat the light-pool exactly where the beam axis pierces the floor
       plane the shadow-pool defines. */
    function seatLightPool() {
        const o = uShaftOW.value;
        const d = uShaftDW.value;
        const floorY = pool.position.y + 0.02;
        const t = (floorY - o.y) / d.y;
        lightPool.position.set(o.x + d.x * t, floorY, Math.min(1.4, o.z + d.z * t));
    }
    /* ---------------------------------------------------------------
       FRAMING — attractor right of the type block; portrait stacks it
       below on clear vat, per the standing legibility rule.
       --------------------------------------------------------------- */
    const camBase = new THREE.Vector3();
    const Y_AXIS = new THREE.Vector3(0, 1, 0);
    const tmpV = new THREE.Vector3();
    function frame() {
        const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
        camera.aspect = aspect;
        if (aspect < 0.8) {
            /* Portrait: type on clear water above; the object stands over its
               pool in the lower half; the shaft falls down the middle-left. */
            camera.fov = 50;
            camera.position.set(0, 0.05, 9.6);
            basin.position.set(0.12, -0.9, 0);
            camera.lookAt(0.05, -0.5, 0);
            pool.position.set(0.5, -3.0, 0.3);
            uShaftOW.value.set(1.1, 4.6, -1.0);
            uShaftDW.value.set(-0.3, -1.0, 0.08).normalize();
            uExposure.value = 1.6;
        }
        else {
            /* Desktop: the object stands upper-right over its shadow; the
               wordmark sits low-left on the same floor; the shaft enters at
               the object's crown and falls toward the type. */
            camera.fov = 40;
            camera.position.set(0, 0.95, 8.4);
            basin.position.set(1.75, 0.2, 0);
            camera.lookAt(0.65, -0.05, 0);
            pool.position.set(2.05, -1.8, 0.25);
            uShaftOW.value.set(1.75, 4.8, -1.0);
            uShaftDW.value.set(-0.42, -1.0, 0.1).normalize();
            uExposure.value = 1;
        }
        camera.updateProjectionMatrix();
        seatLightPool();
        /* The breath re-centres on wherever this framing put the camera —
           a stale base after an aspect change drags the whole scene. */
        camBase.copy(camera.position);
    }
    frame();
    /* Mobile browsers fire a stream of height changes while the URL bar
       collapses. Refitting on each one made the attractor swell and walk
       out of frame during a normal scroll. Only a real layout change —
       any width change, or a large height change — re-frames. */
    let lastW = canvas.clientWidth;
    let lastH = canvas.clientHeight;
    function onResize() {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (w === lastW && Math.abs(h - lastH) < lastH * 0.2)
            return;
        lastW = w;
        lastH = h;
        renderer.setSize(w, h, false);
        frame();
    }
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    /* ---------------------------------------------------------------
       INPUT — the hand in the basin
       Moving the pointer through the attractor kicks nearby matter off
       the manifold and marks it hot. The equation does the rest: every
       disturbance falls back into orbit. You cannot break it.
       --------------------------------------------------------------- */
    const pointerNdc = new THREE.Vector2(0, 0);
    let pointerSpeed = 0;
    let lastPX = 0;
    let lastPY = 0;
    const ray = new THREE.Raycaster();
    const hitPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const hit = new THREE.Vector3();
    const KICK_R = 2.1; // sim units
    function onPointerMove(e) {
        const r = canvas.getBoundingClientRect();
        const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
        const ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
        pointerSpeed = Math.min(2, pointerSpeed + Math.hypot(nx - lastPX, ny - lastPY) * 6);
        lastPX = nx;
        lastPY = ny;
        pointerNdc.set(nx, ny);
        if (reduced)
            return; // a frozen sim must not accumulate un-healable kicks
        ray.setFromCamera(pointerNdc, camera);
        if (!ray.ray.intersectPlane(hitPlane, hit))
            return;
        hit.sub(basin.position);
        // un-rotate into sim space
        const rotY = -basin.rotation.y;
        const sx = (hit.x * Math.cos(rotY) - hit.z * Math.sin(rotY)) / SIM_SCALE;
        const sy = hit.y / SIM_SCALE;
        const sz = (hit.x * Math.sin(rotY) + hit.z * Math.cos(rotY)) / SIM_SCALE;
        applyKick(sx, sy, sz, 2.4 * Math.min(1, pointerSpeed), 0.9);
    }
    /* One disturbance, whoever causes it — the visitor's hand or the
       entrance drop. Matter near the point is shoved off the manifold
       and marked hot; the equation supplies the comeback. */
    function applyKick(sx, sy, sz, k, heatGain, radius = KICK_R) {
        for (let i = 0; i < P; i++) {
            const ix = i * 3;
            const dx = pos[ix] - sx;
            const dy = pos[ix + 1] - sy;
            const dz = pos[ix + 2] - sz;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 > radius * radius)
                continue;
            const d = Math.sqrt(Math.max(d2, 1e-4));
            const fall = 1 - d / radius;
            const g = (k * fall * fall) / d;
            imp[ix] += dx * g;
            imp[ix + 1] += dy * g;
            imp[ix + 2] += dz * g * 0.5;
            heat[i] = Math.min(1, heat[i] + fall * heatGain);
        }
    }
    /* ---------------------------------------------------------------
       THE ENTRANCE DROP — once, at load: a single madder bead falls down
       the shaft into the basin, blooms red, and is pulled home. Every
       visitor sees the thesis proven exactly once; after this, the only
       red that ever appears is the visitor's own. Skipped entirely under
       reduced motion (a frozen sim could never heal it).
       --------------------------------------------------------------- */
    const DROP_AT = 1.15;
    const DROP_DUR = 0.9;
    /* The drop aims at whichever particle is crown-most at impact time —
       a fixed point can sit in a gap of the manifold and bloom nothing;
       real matter guarantees the red blooms in the light. */
    const DROP_IMPACT_SIM = new THREE.Vector3(0, 2.4, 0);
    function crownPoint(out) {
        let best = -Infinity;
        let bi = 0;
        for (let i = 0; i < P; i++) {
            const ix = i * 3;
            const score = pos[ix + 1] - 0.3 * Math.abs(pos[ix]) - 0.3 * Math.abs(pos[ix + 2]);
            if (score > best) {
                best = score;
                bi = ix;
            }
        }
        return out.set(pos[bi], pos[bi + 1], pos[bi + 2]);
    }
    let dropDone = reduced;
    const beadMat = new THREE.MeshBasicNodeMaterial();
    beadMat.colorNode = vec3(COL.madder.r, COL.madder.g, COL.madder.b).mul(1.7);
    const bead = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 10), beadMat);
    bead.visible = false;
    scene.add(bead);
    const beadStart = new THREE.Vector3();
    const beadEnd = new THREE.Vector3();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    /* ---------------------------------------------------------------
       THE LOOP
       --------------------------------------------------------------- */
    let prev = performance.now();
    let frames = 0;
    let winStart = prev;
    const perf = {
        fps: 0,
        ms: 0,
        frames: 0,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        backend: renderer.backend?.isWebGPUBackend ? "webgpu" : "webgl",
        tier: profile.tier,
        dpr: renderer.getPixelRatio(),
    };
    window.__basinPerf = perf;
    const loop = () => {
        const now = performance.now();
        const dt = Math.min(0.05, (now - prev) / 1000);
        prev = now;
        if (!reduced) {
            const h = dt * SIM_SPEED;
            integrate(h);
            rowClock += h;
            if (rowClock >= ROW_DT) {
                rowClock -= ROW_DT;
                writeRow(true); // commit a new row at sim cadence
            }
            else {
                writeRow(false); // keep the trail tip continuous between rows
            }
            uHead.value = head;
            uTimeB.value += dt;
            basin.rotation.y += dt * 0.05;
            pointerSpeed = Math.max(0, pointerSpeed - dt * 4);
            /* Entrance drop timeline. */
            if (!dropDone) {
                const t = (uTimeB.value - DROP_AT) / DROP_DUR;
                if (t >= 0 && t < 1) {
                    const rot = basin.rotation.y;
                    crownPoint(DROP_IMPACT_SIM); // live target: real matter, tracked
                    beadEnd
                        .copy(DROP_IMPACT_SIM)
                        .multiplyScalar(SIM_SCALE)
                        .applyAxisAngle(Y_AXIS, rot)
                        .add(basin.position);
                    beadStart.copy(uShaftOW.value).addScaledVector(uShaftDW.value, 2.2);
                    bead.visible = true;
                    bead.position.lerpVectors(beadStart, beadEnd, t * t);
                }
                else if (t >= 1) {
                    bead.visible = false;
                    dropDone = true;
                    applyKick(DROP_IMPACT_SIM.x, DROP_IMPACT_SIM.y, DROP_IMPACT_SIM.z, 2.9, 1.0, 2.6);
                }
            }
        }
        /* The rig, transformed into the rotating group's space so the
           filaments are lit by a light that belongs to the ROOM. */
        {
            const c = Math.cos(-basin.rotation.y);
            const s = Math.sin(-basin.rotation.y);
            const rotXZ = (v, out) => out.set(c * v.x - s * v.z, v.y, s * v.x + c * v.z);
            rotXZ(KEY_L_WORLD, uKeyLLocal.value);
            rotXZ(uShaftDW.value, uShaftDLocal.value);
            tmpV.copy(uShaftOW.value).sub(basin.position);
            rotXZ(tmpV, uShaftOLocal.value);
            tmpV.copy(camera.position).sub(basin.position);
            rotXZ(tmpV, uCamLocal.value);
        }
        /* Input-driven camera breath — allowed under reduced motion. */
        camera.position.x = camBase.x + pointerNdc.x * 0.16;
        camera.position.y = camBase.y + pointerNdc.y * 0.1;
        renderer.render(scene, camera);
        frames++;
        perf.frames++;
        perf.heatMax = Math.round(heatMax * 1000) / 1000;
        perf.simClock = Math.round(uTimeB.value * 100) / 100;
        perf.dropDone = dropDone;
        if (now - winStart >= 500) {
            perf.fps = Math.round((frames * 1000) / (now - winStart));
            perf.ms = Math.round(((now - winStart) / frames) * 100) / 100;
            frames = 0;
            winStart = now;
        }
    };
    renderer.setAnimationLoop(loop);
    /* The loop runs only while the tab is visible AND the hero is wanted
       on screen — a long page below the hero must not pay for a hidden
       simulation. */
    let wanted = true;
    function applyRunState() {
        if (document.hidden || !wanted) {
            renderer.setAnimationLoop(null);
        }
        else {
            prev = performance.now();
            winStart = prev;
            frames = 0;
            renderer.setAnimationLoop(loop);
        }
    }
    function onVisibility() {
        applyRunState();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return {
        backend: perf.backend,
        setRunning(run) {
            wanted = run;
            applyRunState();
        },
        dispose() {
            window.removeEventListener("pointermove", onPointerMove);
            document.removeEventListener("visibilitychange", onVisibility);
            ro.disconnect();
            renderer.setAnimationLoop(null);
            histTex.dispose();
            renderer.dispose();
        },
    };
}
