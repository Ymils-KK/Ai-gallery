import sharp from "sharp";

const inputPath = "public/images/roxy.png";
const outputPath = "public/images/roxy-nobg.png";

async function main() {
  console.log("读取图片...");
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  console.log(`尺寸: ${metadata.width}x${metadata.height}`);

  // 获取原始RGBA数据
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  // 从四角和四边中部采样背景色
  const samples = [];
  const margin = 10;
  const positions = [
    [margin, margin],                         // 左上
    [width - margin, margin],                 // 右上
    [margin, height - margin],                // 左下
    [width - margin, height - margin],        // 右下
    [Math.floor(width / 2), margin],          // 上中
    [margin, Math.floor(height / 2)],         // 左中
    [width - margin, Math.floor(height / 2)], // 右中
  ];

  for (const [x, y] of positions) {
    const idx = (y * width + x) * channels;
    samples.push([pixels[idx], pixels[idx + 1], pixels[idx + 2]]);
  }

  // 取采样中位数作为背景色
  const sortedR = samples.map((s) => s[0]).sort((a, b) => a - b);
  const sortedG = samples.map((s) => s[1]).sort((a, b) => a - b);
  const sortedB = samples.map((s) => s[2]).sort((a, b) => a - b);
  const mid = Math.floor(samples.length / 2);
  const bgColor = [sortedR[mid], sortedG[mid], sortedB[mid]];
  console.log(`检测到背景色: RGB(${bgColor.join(", ")})`);

  // 创建alpha通道：接近背景色的像素变透明
  const threshold = 60;  // 颜色距离阈值
  const feather = 20;    // 羽化范围
  const totalRange = threshold + feather;

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // 计算与背景色的欧氏距离
    const dist = Math.sqrt(
      (r - bgColor[0]) ** 2 + (g - bgColor[1]) ** 2 + (b - bgColor[2]) ** 2
    );

    if (dist <= threshold) {
      // 背景色范围：完全透明
      pixels[i + 3] = 0;
    } else if (dist < totalRange) {
      // 羽化过渡：半透明
      const alpha = Math.round(((dist - threshold) / feather) * 255);
      pixels[i + 3] = alpha;
    }
    // 否则保持不透明
  }

  console.log("保存结果...");
  await sharp(pixels, {
    raw: { width, height, channels },
  })
    .png()
    .toFile(outputPath);

  console.log(`完成！已保存到 ${outputPath}`);
}

main().catch((err) => {
  console.error("失败:", err.message);
  process.exit(1);
});
