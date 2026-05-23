import sharp from "sharp";

const inputPath = "public/images/roxy.png";
const outputPath = "public/images/roxy-clean.png";

async function main() {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  console.log(`尺寸: ${metadata.width}x${metadata.height}, 通道: ${metadata.channels}`);

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  // 只处理右下角最角落的 200x100 区域（典型水印位置）
  const wmW = Math.min(200, Math.floor(width * 0.15));
  const wmH = Math.min(100, Math.floor(height * 0.13));
  const startX = width - wmW;
  const startY = height - wmH;

  console.log(`水印区域: (${startX},${startY}) ${wmW}x${wmH}`);

  // 从水印区域的上方和左方边缘采样 "干净" 背景色
  // 上方边缘（水印区域上边一排）
  const bgSamples = [];
  const edgeY = startY - 2;
  for (let x = startX; x < width; x += 2) {
    const i = (edgeY * width + x) * channels;
    bgSamples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }
  // 左方边缘
  const edgeX = startX - 2;
  for (let y = startY; y < height; y += 2) {
    const i = (y * width + edgeX) * channels;
    bgSamples.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }

  // 计算背景色的中位数和标准差
  const sortedR = bgSamples.map((s) => s[0]).sort((a, b) => a - b);
  const sortedG = bgSamples.map((s) => s[1]).sort((a, b) => a - b);
  const sortedB = bgSamples.map((s) => s[2]).sort((a, b) => a - b);
  const mid = Math.floor(bgSamples.length / 2);
  const bgMedian = [sortedR[mid], sortedG[mid], sortedB[mid]];

  // 计算标准差，判断背景颜色一致性
  let varSum = 0;
  for (const s of bgSamples) {
    varSum += (s[0] - bgMedian[0]) ** 2 + (s[1] - bgMedian[1]) ** 2 + (s[2] - bgMedian[2]) ** 2;
  }
  const stdDev = Math.sqrt(varSum / bgSamples.length);
  console.log(`背景中位数(RGB): ${bgMedian.join(", ")}, 标准差: ${stdDev.toFixed(1)}`);

  // 在水印区域中，找出那些明显亮于/异于背景的像素
  const threshold = Math.max(30, stdDev * 2.5);
  console.log(`检测阈值: ${threshold.toFixed(1)}`);

  let replaced = 0;
  for (let y = startY; y < height; y++) {
    for (let x = startX; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

      const dist = Math.sqrt(
        (r - bgMedian[0]) ** 2 + (g - bgMedian[1]) ** 2 + (b - bgMedian[2]) ** 2
      );

      if (dist > threshold) {
        // 这可能是水印 — 用周围非水印像素的平均色填充
        // 取相邻的非水印像素
        const neighbors = [];
        for (let dy = -3; dy <= 3; dy++) {
          for (let dx = -3; dx <= 3; dx++) {
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && !(dx === 0 && dy === 0)) {
              const ni = (ny * width + nx) * channels;
              const nd = Math.sqrt(
                (pixels[ni] - bgMedian[0]) ** 2 +
                (pixels[ni + 1] - bgMedian[1]) ** 2 +
                (pixels[ni + 2] - bgMedian[2]) ** 2
              );
              if (nd <= threshold && pixels[ni + 3] > 0) {
                neighbors.push([pixels[ni], pixels[ni + 1], pixels[ni + 2], pixels[ni + 3]]);
              }
            }
          }
        }

        if (neighbors.length > 0) {
          // 取邻居平均色
          const avg = [0, 0, 0, 0];
          for (const n of neighbors) {
            avg[0] += n[0]; avg[1] += n[1]; avg[2] += n[2]; avg[3] += n[3];
          }
          pixels[i] = Math.round(avg[0] / neighbors.length);
          pixels[i + 1] = Math.round(avg[1] / neighbors.length);
          pixels[i + 2] = Math.round(avg[2] / neighbors.length);
          pixels[i + 3] = Math.round(avg[3] / neighbors.length);
        } else {
          // 没有干净邻居，用背景中位数
          pixels[i] = bgMedian[0];
          pixels[i + 1] = bgMedian[1];
          pixels[i + 2] = bgMedian[2];
          pixels[i + 3] = 255;
        }
        replaced++;
      }
    }
  }

  console.log(`替换像素: ${replaced}/${wmW * wmH} (${((replaced / (wmW * wmH)) * 100).toFixed(1)}%)`);

  console.log("保存...");
  await sharp(pixels, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log(`完成: ${outputPath}`);
}

main().catch((err) => {
  console.error("失败:", err);
  process.exit(1);
});
