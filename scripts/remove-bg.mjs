import { removeBackground } from "@imgly/background-removal";
import { readFileSync, writeFileSync } from "fs";

const inputPath = "public/images/roxy.png";
const outputPath = "public/images/roxy-nobg.png";

async function main() {
  console.log("正在读取图片...");
  const input = readFileSync(inputPath);

  console.log("正在抠除背景（AI 处理中，可能需要几秒到几十秒）...");
  const blob = await removeBackground(input);

  const buffer = Buffer.from(await blob.arrayBuffer());
  writeFileSync(outputPath, buffer);
  console.log(`完成！已保存到 ${outputPath}`);
}

main().catch((err) => {
  console.error("抠图失败:", err);
  process.exit(1);
});
