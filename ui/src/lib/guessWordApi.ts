/**
 * 猜词游戏后端 API 助手
 *
 * 接口约定（与 individual-learning 后端一致，target 用 AES 加密 token 替代明文）：
 *   POST /api/v1/guessword/similarity  body: { guess, token }
 *     → { code, message, data: { similarity, inCorpus, message, answer } }
 *   POST /api/v1/guessword/daily        body: { date? }
 *     → { code, message, data: { token, date } }
 *   POST /api/v1/guessword/random
 *     → { code, message, data: { token } }
 *   POST /api/v1/guessword/encrypt      body: { word }
 *     → { code, message, data: { token } }
 *   GET  /api/v1/guessword/status
 *     → { code, message, data: { state, vectorSize } }
 *
 * 安全说明：前端只持有 token（AES-CBC 密文），无法解密获取明文目标词。
 * 命中时（similarity>=99）后端返回明文 answer，前端才显示。
 */

// 后端目前只有线上环境，dev / prod 都连线上
const API_BASE = "http://8.156.64.154:8080/api/v1/guessword";

/** 统一响应结构 */
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface SimilarityResult {
  /** 0-100 相似度，-1 表示词库未就绪 */
  similarity: number;
  /** 两词是否都在词库中 */
  inCorpus: boolean;
  /** 提示信息 */
  message?: string;
  /** 命中时（similarity>=99）返回明文答案，否则为 null */
  answer?: string | null;
}

export interface DailyWordResult {
  /** 加密后的目标词 token（前端无法解密） */
  token: string;
  date: string;
}

export interface RandomWordResult {
  /** 加密后的目标词 token（前端无法解密） */
  token: string;
}

export interface EncryptWordResult {
  /** 加密后的目标词 token */
  token: string;
}

export interface CorpusStatus {
  /** IDLE / LOADING / READY / ERROR / DISABLED */
  state: string;
  vectorSize: number;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    throw new Error(`请求失败：${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || "请求失败");
  }
  return json.data;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method: "GET" });
  if (!res.ok) {
    throw new Error(`请求失败：${res.status} ${res.statusText}`);
  }
  const json: ApiResponse<T> = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || "请求失败");
  }
  return json.data;
}

/**
 * 计算猜测词与目标词的相似度
 *
 * @param guess 猜测词（明文）
 * @param token 加密后的目标词 token（前端无法解密）
 */
export function computeSimilarity(guess: string, token: string) {
  return postJson<SimilarityResult>("/similarity", { guess, token });
}

/** 获取每日词（date 可选，默认今天）→ 返回 token */
export function getDailyWord(date?: string) {
  return postJson<DailyWordResult>("/daily", date ? { date } : {});
}

/** 随机选词 → 返回 token */
export function getRandomWord() {
  return postJson<RandomWordResult>("/random", {});
}

/**
 * 自定义出题加密：出题方提交明文 word，后端返回加密 token。
 * 出题方知道 word，无泄漏问题；答题方只持有 token 无法解密。
 */
export function encryptWord(word: string) {
  return postJson<EncryptWordResult>("/encrypt", { word });
}

/** 词库状态 */
export function getCorpusStatus() {
  return getJson<CorpusStatus>("/status");
}
