import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const img = join(root, "img");
const video = join(root, "video");
const models = join(root, "models");
const audio = join(root, "audio");
mkdirSync(video, { recursive: true });
mkdirSync(models, { recursive: true });
mkdirSync(audio, { recursive: true });

function run(bin, args) {
  execFileSync(bin, args, { stdio: "inherit" });
}

const stills = [
  "radix-architecture",
  "radix-contact",
  "radix-eye",
  "radix-finance",
  "radix-founder",
  "radix-identity",
  "radix-knot",
  "radix-retail",
  "radix-talent",
  "radix-warehouse"
];

for (const name of stills) {
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", join(img, `${name}.png`),
    "-vf", "scale=1920:-2:flags=lanczos",
    "-c:v", "libwebp", "-quality", "82", "-compression_level", "5",
    join(img, `${name}.webp`)
  ]);
}

const clips = [
  { src: "radix-warehouse.png", out: "supply.mp4", x: "t*8", y: "t*3" },
  { src: "radix-identity.png", out: "identity.mp4", x: "t*4", y: "t*6" },
  { src: "radix-eye.png", out: "eye.mp4", x: "t*2", y: "t*8" },
  { src: "radix-architecture.png", out: "civic.mp4", x: "t*10", y: "t*2" },
  { src: "radix-finance.png", out: "finance.mp4", x: "t*6", y: "t*4" },
  { src: "radix-knot.png", out: "knot.mp4", x: "t*5", y: "t*5" }
];

for (const clip of clips) {
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-loop", "1", "-t", "8", "-i", join(img, clip.src),
    "-vf", `scale=1600:900:force_original_aspect_ratio=increase,crop=1600:900,scale=1280:720,crop=1280:720:x='${clip.x}':y='${clip.y}',format=yuv420p,fps=24`,
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
    "-movflags", "+faststart",
    join(video, clip.out)
  ]);
}

run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-f", "lavfi", "-t", "12",
  "-i", "sine=frequency=55:sample_rate=44100,volume=0.04,afade=t=in:st=0:d=1.5,afade=t=out:st=10.5:d=1.5",
  "-c:a", "libmp3lame", "-q:a", "6",
  join(audio, "hum.mp3")
]);

function knotPoint(t, p, q, r) {
  const qt = q * t;
  const pt = p * t;
  const rad = r * (2 + Math.cos(qt));
  return {
    x: rad * Math.cos(pt),
    y: rad * Math.sin(pt),
    z: r * Math.sin(qt)
  };
}

function buildMesh(p, q, radius, tube, segs, radial) {
  const positions = [];
  const faces = [];
  for (let i = 0; i <= segs; i++) {
    const t = (i / segs) * Math.PI * 2;
    const a = knotPoint(t, p, q, radius);
    const b = knotPoint(t + 0.002, p, q, radius);
    const tx = b.x - a.x, ty = b.y - a.y, tz = b.z - a.z;
    const len = Math.hypot(tx, ty, tz) || 1;
    let nx = -ty / len, ny = tx / len, nz = 0;
    const nlen = Math.hypot(nx, ny, nz) || 1;
    nx /= nlen; ny /= nlen;
    const bx = ny * tz - nz * ty;
    const by = nz * tx - nx * tz;
    const bz = nx * ty - ny * tx;
    const bl = Math.hypot(bx, by, bz) || 1;
    for (let j = 0; j <= radial; j++) {
      const u = (j / radial) * Math.PI * 2;
      const cx = Math.cos(u) * tube;
      const cy = Math.sin(u) * tube;
      positions.push(
        a.x + nx * cx + (bx / bl) * cy,
        a.y + ny * cx + (by / bl) * cy,
        a.z + nz * cx + (bz / bl) * cy
      );
    }
  }
  const stride = radial + 1;
  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * stride + j + 1;
      const b = i * stride + j + 2;
      const c = (i + 1) * stride + j + 1;
      const d = (i + 1) * stride + j + 2;
      faces.push([a, c, b], [b, c, d]);
    }
  }
  return { positions, faces };
}

const mesh = buildMesh(2, 3, 1.15, 0.22, 180, 12);
let obj = "# RADIX operating knot\n# torus knot p=2 q=3\no RadixKnot\n";
for (let i = 0; i < mesh.positions.length; i += 3) {
  obj += `v ${mesh.positions[i].toFixed(5)} ${mesh.positions[i + 1].toFixed(5)} ${mesh.positions[i + 2].toFixed(5)}\n`;
}
for (const f of mesh.faces) obj += `f ${f[0]} ${f[1]} ${f[2]}\n`;
writeFileSync(join(models, "radix-knot.obj"), obj);

const gltf = {
  asset: { version: "2.0", generator: "RADIX" },
  scenes: [{ nodes: [0] }],
  scene: 0,
  nodes: [{ mesh: 0, name: "RadixKnot" }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1, mode: 4 }] }],
  accessors: [
    { bufferView: 0, componentType: 5126, count: mesh.positions.length / 3, type: "VEC3",
      min: [
        Math.min(...mesh.positions.filter((_, i) => i % 3 === 0)),
        Math.min(...mesh.positions.filter((_, i) => i % 3 === 1)),
        Math.min(...mesh.positions.filter((_, i) => i % 3 === 2))
      ],
      max: [
        Math.max(...mesh.positions.filter((_, i) => i % 3 === 0)),
        Math.max(...mesh.positions.filter((_, i) => i % 3 === 1)),
        Math.max(...mesh.positions.filter((_, i) => i % 3 === 2))
      ]
    },
    { bufferView: 1, componentType: 5123, count: mesh.faces.length * 3, type: "SCALAR" }
  ],
  bufferViews: [
    { buffer: 0, byteOffset: 0, byteLength: mesh.positions.length * 4, target: 34962 },
    { buffer: 0, byteOffset: mesh.positions.length * 4, byteLength: mesh.faces.length * 3 * 2, target: 34963 }
  ],
  buffers: [{ byteLength: 0, uri: "radix-knot.bin" }]
};

const pos = Buffer.alloc(mesh.positions.length * 4);
for (let i = 0; i < mesh.positions.length; i++) pos.writeFloatLE(mesh.positions[i], i * 4);
const idx = Buffer.alloc(mesh.faces.length * 3 * 2);
let o = 0;
for (const f of mesh.faces) {
  idx.writeUInt16LE(f[0] - 1, o); o += 2;
  idx.writeUInt16LE(f[1] - 1, o); o += 2;
  idx.writeUInt16LE(f[2] - 1, o); o += 2;
}
const bin = Buffer.concat([pos, idx]);
gltf.buffers[0].byteLength = bin.length;
writeFileSync(join(models, "radix-knot.bin"), bin);
writeFileSync(join(models, "radix-knot.gltf"), JSON.stringify(gltf, null, 2));

/* Minimal ASCII FBX so DCC tools have a native file next to the OBJ. */
let fbx = `; FBX 6.1.0 project file
FBXHeaderExtension:  {
  FBXHeaderVersion: 1003
  FBXVersion: 6100
  Creator: "RADIX"
}
Definitions:  {
  Count: 1
  ObjectType: "Model" { Count: 1 }
}
Objects:  {
  Model: "Model::RadixKnot", "Mesh" {
    Version: 232
    Vertices: *${mesh.positions.length} {
      a: ${mesh.positions.map((n) => n.toFixed(5)).join(",")}
    }
    PolygonVertexIndex: *${mesh.faces.length * 3} {
      a: ${mesh.faces.map((f) => `${f[0] - 1},${f[1] - 1},${-(f[2])}`).join(",")}
    }
  }
}
Connections:  {
}
`;
writeFileSync(join(models, "radix-knot.fbx"), fbx);

console.log("assets ready");
