/**
 * puzzleLink — 自定义出题链接编解码工具
 *
 * 纯前端方案：把 { 加密 token, 提示 } 编码进 URL query，
 * 别人通过链接进入即可看到同一题目与提示。
 *
 * 安全说明：URL 中只含加密 token（前端无法解密），
 * 明文目标词从未出现在前端代码、Network、DevTools、URL 中。
 *
 * 编码：JSON → encodeURIComponent → btoa → URL-safe base64
 *   - encodeURIComponent 处理中文（UTF-8 字节）
 *   - btoa 生成 base64
 *   - 替换 +/= 为 URL 安全字符 -_~
 */

export interface PuzzleData {
  /** 后端加密后的目标词 token */
  t: string;
  /** 提示文字 */
  h: string;
}

/** 把 puzzle 数据编码为 URL 安全的字符串 */
export function encodePuzzle(data: PuzzleData): string {
  const json = JSON.stringify(data);
  // encodeURIComponent 处理 UTF-8 中文，再 btoa
  const base64 = btoa(encodeURIComponent(json));
  // 转成 URL-safe base64
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "~");
}

/** 把 URL query 中的 q 参数解码为 puzzle 数据 */
export function decodePuzzle(q: string): PuzzleData | null {
  try {
    // 还原 URL-safe base64
    let base64 = q.replace(/-/g, "+").replace(/_/g, "/").replace(/~/g, "=");
    // 补齐 padding
    const pad = base64.length % 4;
    if (pad) base64 += "=".repeat(4 - pad);
    const json = decodeURIComponent(atob(base64));
    const obj = JSON.parse(json);
    if (typeof obj.t === "string" && typeof obj.h === "string") {
      return { t: obj.t, h: obj.h };
    }
    return null;
  } catch {
    return null;
  }
}

/** 生成完整的分享链接（基于当前 origin + hash 路由） */
export function buildPuzzleUrl(data: PuzzleData): string {
  const q = encodePuzzle(data);
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}#/games/cihai-xunzong?mode=custom&q=${q}`;
}
