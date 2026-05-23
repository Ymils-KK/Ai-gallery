export interface Work {
  id: string;
  title: string;
  description: string;
  type: "image" | "video";
  src: string;
  thumbnail?: string;
  tags: string[];
  date: string;
}

const works: Work[] = [
  {
    id: "1",
    title: "霓虹城市",
    description: "赛博朋克风格的未来城市夜景，AI 生成的数字艺术作品",
    type: "image",
    src: "https://picsum.photos/seed/neoncity/1200/800",
    tags: ["AI绘画", "赛博朋克"],
    date: "2026-05-20",
  },
  {
    id: "2",
    title: "梦幻森林",
    description: "充满魔法气息的发光森林，梦幻般的视觉体验",
    type: "image",
    src: "https://picsum.photos/seed/forest/1200/800",
    tags: ["AI绘画", "奇幻"],
    date: "2026-05-18",
  },
  {
    id: "3",
    title: "抽象宇宙",
    description: "色彩斑斓的抽象星空，探索宇宙的无限可能",
    type: "image",
    src: "https://picsum.photos/seed/cosmic/1200/800",
    tags: ["AI绘画", "抽象"],
    date: "2026-05-15",
  },
  {
    id: "4",
    title: "AI 视频演示",
    description: "使用 AI 生成的短视频演示作品",
    type: "video",
    src: "https://www.w3schools.com/html/mov_bbb.mp4",
    thumbnail: "https://picsum.photos/seed/videothumb/1200/800",
    tags: ["AI视频", "演示"],
    date: "2026-05-12",
  },
  {
    id: "5",
    title: "机械姬",
    description: "未来机器人肖像，精细的机械细节和光影效果",
    type: "image",
    src: "https://picsum.photos/seed/robot/1200/800",
    tags: ["AI绘画", "科幻"],
    date: "2026-05-10",
  },
  {
    id: "6",
    title: "水下世界",
    description: "神秘深邃的海洋世界，色彩斑斓的珊瑚和鱼群",
    type: "image",
    src: "https://picsum.photos/seed/underwater/1200/800",
    tags: ["AI绘画", "自然"],
    date: "2026-05-08",
  },
];

export default works;
