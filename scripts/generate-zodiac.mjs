// 매일 12별자리 운세를 Claude API로 생성해 data/zodiac.js에 저장한다.
// 실행: ANTHROPIC_API_KEY=... node scripts/generate-zodiac.mjs
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "data", "zodiac.js");

const SIGNS = [
  ["aries", "양자리"],
  ["taurus", "황소자리"],
  ["gemini", "쌍둥이자리"],
  ["cancer", "게자리"],
  ["leo", "사자자리"],
  ["virgo", "처녀자리"],
  ["libra", "천칭자리"],
  ["scorpio", "전갈자리"],
  ["sagittarius", "사수자리"],
  ["capricorn", "염소자리"],
  ["aquarius", "물병자리"],
  ["pisces", "물고기자리"],
];

function todayKST() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const signSchema = {
  type: "object",
  properties: {
    score: { type: "integer", description: "1~5 사이의 오늘 운세 별점" },
    summary: { type: "string" },
    love: { type: "string" },
    money: { type: "string" },
    health: { type: "string" },
    luckyColor: { type: "string" },
    luckyNumber: { type: "integer" },
  },
  required: ["score", "summary", "love", "money", "health", "luckyColor", "luckyNumber"],
  additionalProperties: false,
};

const schema = {
  type: "object",
  properties: Object.fromEntries(SIGNS.map(([id]) => [id, signSchema])),
  required: SIGNS.map(([id]) => id),
  additionalProperties: false,
};

const SYSTEM = `당신은 한국어 운세 웹사이트 '하루결'의 별자리 운세 작가입니다.
독자는 출근길이나 쉬는 시간에 가볍게 운세를 보는 20~40대입니다.

작성 원칙:
- 말투는 다정하고 담백한 해요체. 과장, 공포감 조성, 단정적인 예언은 쓰지 않습니다.
- 낮은 운세도 조심할 점과 작은 팁으로 부드럽게 전합니다.
- 의료·투자·법률에 관한 구체적인 조언은 하지 않습니다.
- summary는 2문장, 50~80자. love/money/health는 각 1문장, 20~40자.
- 12별자리의 문장이 서로 겹치지 않게, 날짜와 계절감을 살려 매일 새롭게 씁니다.
- score는 1~5 정수이고, 12개가 고르게 분포하도록(5점과 2점 이하도 포함) 정합니다.
- luckyColor는 짧은 한국어 색 이름, luckyNumber는 1~45 정수입니다.`;

async function main() {
  const date = todayKST();
  const client = new Anthropic();

  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema },
    },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `오늘은 ${date}입니다. 다음 12별자리의 오늘 운세를 작성해 주세요: ${SIGNS.map(([id, name]) => `${name}(${id})`).join(", ")}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`요청이 거절되었습니다: ${response.stop_details?.category ?? "unknown"}`);
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("응답이 max_tokens에서 잘렸습니다.");
  }

  const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const signs = JSON.parse(text);

  for (const [id] of SIGNS) {
    const s = signs[id];
    if (!s || !s.summary) throw new Error(`${id} 데이터가 비어 있습니다.`);
    s.score = Math.max(1, Math.min(5, Math.round(s.score)));
  }

  const body =
    "// 이 파일은 scripts/generate-zodiac.mjs가 매일 자동으로 덮어씁니다.\n" +
    `window.ZODIAC_DATA = ${JSON.stringify({ date, signs }, null, 2)};\n`;
  fs.writeFileSync(OUT, body, "utf8");
  console.log(`✔ ${date} 별자리 운세를 저장했습니다 → ${path.relative(process.cwd(), OUT)}`);
}

main().catch((err) => {
  if (err instanceof Anthropic.AuthenticationError) {
    console.error("API 키가 올바르지 않습니다. ANTHROPIC_API_KEY를 확인하세요.");
  } else if (err instanceof Anthropic.RateLimitError) {
    console.error("요청이 너무 많습니다. 잠시 후 다시 시도하세요.");
  } else if (err instanceof Anthropic.APIError) {
    console.error(`API 오류 ${err.status}: ${err.message}`);
  } else {
    console.error(err);
  }
  process.exit(1);
});
