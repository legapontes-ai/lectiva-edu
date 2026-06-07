// Remove o fundo branco do logo, recorta o emblema e gera o favicon.
const Jimp = require("jimp");
const path = require("node:path");

const ORIG = "brand-assets/logo-original.png";

/** Torna transparente o branco/quase-branco (com feathering), preservando cores. */
function tirarFundo(img) {
  const { data } = img.bitmap;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mn = Math.min(r, g, b);
    const sat = Math.max(r, g, b) - mn;
    if (mn >= 246 && sat <= 18) {
      data[i + 3] = 0;
    } else if (mn >= 215 && sat <= 28) {
      const a = Math.round((255 * (246 - mn)) / (246 - 215));
      data[i + 3] = Math.max(0, Math.min(data[i + 3], a));
    }
  }
  return img;
}

(async () => {
  const base = await Jimp.read(ORIG);
  const W = base.bitmap.width, H = base.bitmap.height;

  // 1) Logo completo (lockup) transparente
  const full = base.clone();
  tirarFundo(full);
  full.autocrop({ tolerance: 0.004, cropOnlyFrames: false, leaveBorder: 6 });
  await full.writeAsync("public/brand/logo-lectiva.png");
  console.log("full ->", full.bitmap.width + "x" + full.bitmap.height);

  // 2) Emblema (escudo) recortado
  const ex = Math.round(W * 0.34), ew = Math.round(W * 0.32);
  const ey = Math.round(H * 0.065), eh = Math.round(H * 0.49);
  const mark = base.clone().crop(ex, ey, ew, eh);
  tirarFundo(mark);
  mark.autocrop({ tolerance: 0.004, cropOnlyFrames: false, leaveBorder: 4 });
  await mark.writeAsync("public/brand/logo-mark.png");
  console.log("mark ->", mark.bitmap.width + "x" + mark.bitmap.height);

  // 3) Favicon (512 quadrado, emblema centralizado com folga)
  const size = 512, pad = Math.round(size * 0.1);
  const m2 = mark.clone().scaleToFit(size - 2 * pad, size - 2 * pad);
  const canvas = new Jimp(size, size, 0x00000000);
  canvas.composite(m2, Math.round((size - m2.bitmap.width) / 2), Math.round((size - m2.bitmap.height) / 2));
  await canvas.writeAsync(path.join("src", "app", "icon.png"));
  console.log("favicon -> 512x512");

  console.log("OK");
})().catch((e) => { console.error(e); process.exit(1); });
