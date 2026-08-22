/**
 * localNovels — 本地 epub 小说加载
 *
 * 数据源：用户提供的本地 epub 文件（位于 ui/epub/ 目录）
 * 解析：epub.js + jszip 在浏览器中运行时解析
 *       - 加载 epub → 读取 metadata（书名/作者）→ 生成 spine（阅读顺序）
 *       - 渲染到 iframe，支持翻页、目录跳转、阅读进度持久化
 *
 * 性能优化：
 *   - epub 文件用 fetch 一次性下载到 ArrayBuffer，jszip 解压到内存
 *   - Book 实例在 Reader 组件卸载时销毁，避免内存泄漏
 *   - 章节切换用 rendition.display(target) 异步等待，避免卡顿
 *   - 阅读进度（cfi）持久化到 localStorage，下次打开自动恢复
 */

export interface LocalNovelMeta {
  /** 唯一 id，用作 localStorage key 前缀 */
  id: string;
  /** epub 文件路径（相对 public 根目录） */
  url: string;
  /** 封面图路径（相对 public 根目录） */
  cover: string;
  /** 书架展示用书名（运行时也会从 epub 元数据读取覆盖） */
  title: string;
  /** 书架展示用作者（运行时也会从 epub 元数据读取覆盖） */
  author: string;
  /** 书架卡片主题色（封面加载失败时的兜底色） */
  color: string;
  /** 书架卡片简介 */
  summary: string;
}

/** ui/epub/ 下的本地 epub 文件列表
 *  注意：vite 会把 public 目录下的文件原样拷贝到 dist 根目录，
 *  所以将 epub 目录放入 public/epub/ 即可通过 /epub/xxx.epub 访问。
 *  这里直接引用相对路径，部署时 vite 会处理。
 */
export const LOCAL_NOVELS: LocalNovelMeta[] = [
  {
    id: "jiushixin",
    url: "epub/九诗心：暗夜里的文学启明 (黄晓丹).epub",
    cover: "epub/九诗心：暗夜里的文学启明 (黄晓丹)封面.jpg",
    title: "九诗心：暗夜里的文学启明",
    author: "黄晓丹",
    color: "#7c3aed",
    summary:
      "九位古代诗人在暗夜里的心灵启明，从屈原到李清照，看古典诗人如何在生命的幽暗时刻寻找光亮。",
  },
  {
    id: "taiyang",
    url: "epub/太阳的阴影深入非洲的旅程 ([波]雷沙德·卡普希钦斯基 著 毛蕊 译).epub",
    cover: "epub/太阳的阴影深入非洲的旅程 ([波]雷沙德·卡普希钦斯基 著 毛蕊 译)封面.jpg",
    title: "太阳的阴影：深入非洲的旅程",
    author: "[波] 雷沙德·卡普希钦斯基 著 / 毛蕊 译",
    color: "#c2410c",
    summary:
      "波兰著名记者的非洲见闻录，跨越数十年的实地观察，记录这片大陆的复杂与真实。",
  },
  {
    id: "yaoyouguang",
    url: "epub/要有光 (梁鸿) .epub",
    cover: "epub/要有光 (梁鸿)封面.jpg",
    title: "要有光",
    author: "梁鸿",
    color: "#b91c1c",
    summary:
      "梁鸿笔下关于乡土、记忆与精神之光的书写，在文字中寻找照亮生活的微光。",
  },
  {
    id: "zhexuejia",
    url: "epub/哲学家的最后一课 (朱锐).epub",
    cover: "epub/哲学家的最后一课 (朱锐)封面.jpg",
    title: "哲学家的最后一课",
    author: "朱锐",
    color: "#0369a1",
    summary:
      "一位哲学家面对死亡时的最后讲述，关于生命、意义与如何向死而生。",
  },
  {
    id: "kanbujian",
    url: "epub/看不见的中东：深入日常生活的中东之旅 (姚璐).epub",
    cover: "epub/看不见的中东：深入日常生活的中东之旅 (姚璐)封面.jpg",
    title: "看不见的中东：深入日常生活的中东之旅",
    author: "姚璐",
    color: "#15803d",
    summary:
      "深入中东日常生活的旅行记录，揭开新闻头条之外这片土地的真实面貌。",
  },
  {
    id: "zhaizi",
    url: "epub/我是寨子里长大的女孩 (扎十一惹).epub",
    cover: "epub/我是寨子里长大的女孩 (扎十一惹)封面.jpg",
    title: "我是寨子里长大的女孩",
    author: "扎十一惹",
    color: "#be185d",
    summary:
      "从寨子走出的女孩的成长记忆，关于乡土、身份与寻找自我的真实书写。",
  },
];

/** 阅读进度持久化 key */
function progressKey(novelId: string) {
  return `novel-progress-${novelId}`;
}

export function getProgress(novelId: string): string | null {
  try {
    return localStorage.getItem(progressKey(novelId));
  } catch {
    return null;
  }
}

export function saveProgress(novelId: string, cfi: string) {
  try {
    localStorage.setItem(progressKey(novelId), cfi);
  } catch {
    /* ignore */
  }
}

/** 最近阅读的小说 id */
export function getLastReadNovelId(): string | null {
  try {
    return localStorage.getItem("novel-last-read");
  } catch {
    return null;
  }
}

export function setLastReadNovelId(id: string) {
  try {
    localStorage.setItem("novel-last-read", id);
  } catch {
    /* ignore */
  }
}
