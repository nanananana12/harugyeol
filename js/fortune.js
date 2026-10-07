/*
 * 규칙 기반 오늘의 운세 엔진.
 * 같은 사람(이름·생년월일·시각)이 같은 날 보면 항상 같은 결과가 나오고,
 * 날짜가 바뀌면 결과도 바뀐다. 서버 없이 브라우저에서만 동작한다.
 */
(function () {
  "use strict";

  // ---------- 날짜 / 난수 ----------

  function todayKST() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    const y = get("year"), m = get("month"), d = get("day");
    const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return { y, m, d, key, weekday };
  }

  // cyrb53 문자열 해시
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- 띠 / 별자리 ----------

  const TTI = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

  // 입춘 기준이 아닌 양력 연도 기준의 간이 계산
  function getTti(year) {
    return TTI[(((year - 4) % 12) + 12) % 12];
  }

  const SIGNS = [
    { id: "capricorn", name: "염소자리", from: [12, 22] },
    { id: "aquarius", name: "물병자리", from: [1, 20] },
    { id: "pisces", name: "물고기자리", from: [2, 19] },
    { id: "aries", name: "양자리", from: [3, 21] },
    { id: "taurus", name: "황소자리", from: [4, 20] },
    { id: "gemini", name: "쌍둥이자리", from: [5, 21] },
    { id: "cancer", name: "게자리", from: [6, 22] },
    { id: "leo", name: "사자자리", from: [7, 23] },
    { id: "virgo", name: "처녀자리", from: [8, 23] },
    { id: "libra", name: "천칭자리", from: [9, 23] },
    { id: "scorpio", name: "전갈자리", from: [10, 23] },
    { id: "sagittarius", name: "사수자리", from: [11, 23] },
  ];

  function getSign(month, day) {
    const v = month * 100 + day;
    let found = SIGNS[0]; // 12/22 ~ 1/19 염소자리
    for (const s of SIGNS.slice(1)) {
      if (v >= s.from[0] * 100 + s.from[1]) found = s;
    }
    if (v >= 1222) found = SIGNS[0];
    return found;
  }

  const SIJIN = [
    { name: "자시", time: "밤 11시 반 ~ 새벽 1시 반", trait: "고요한 시간에 태어나 생각이 깊은 편이에요." },
    { name: "축시", time: "새벽 1시 반 ~ 3시 반", trait: "묵묵히 쌓아 올리는 끈기가 강점이에요." },
    { name: "인시", time: "새벽 3시 반 ~ 5시 반", trait: "남보다 한발 먼저 움직이는 추진력이 있어요." },
    { name: "묘시", time: "새벽 5시 반 ~ 7시 반", trait: "부드럽지만 쉽게 꺾이지 않는 사람이에요." },
    { name: "진시", time: "아침 7시 반 ~ 9시 반", trait: "판을 크게 보는 시야가 장점이에요." },
    { name: "사시", time: "오전 9시 반 ~ 11시 반", trait: "눈치가 빠르고 상황 판단이 정확해요." },
    { name: "오시", time: "오전 11시 반 ~ 오후 1시 반", trait: "밝은 에너지로 주변을 끌어당겨요." },
    { name: "미시", time: "오후 1시 반 ~ 3시 반", trait: "배려심이 깊어 사람들이 편하게 다가와요." },
    { name: "신시", time: "오후 3시 반 ~ 5시 반", trait: "재치 있고 손재주가 좋은 편이에요." },
    { name: "유시", time: "오후 5시 반 ~ 7시 반", trait: "꼼꼼하고 마무리가 깔끔한 사람이에요." },
    { name: "술시", time: "저녁 7시 반 ~ 9시 반", trait: "한번 맺은 인연을 오래 지키는 의리가 있어요." },
    { name: "해시", time: "밤 9시 반 ~ 11시 반", trait: "여유롭고 넉넉한 마음이 복을 불러요." },
  ];

  // ---------- 문장 풀 ----------

  const OVERALL = {
    high: [
      "막혀 있던 일이 스르르 풀리는 하루예요. 미뤄 둔 일을 꺼내기에 좋아요.",
      "작은 행운이 연달아 찾아오는 날이에요. 평소보다 한 걸음 더 내디뎌 보세요.",
      "주변의 도움과 타이밍이 잘 맞아떨어지는 하루예요.",
      "기분 좋은 소식이 들려올 수 있어요. 연락에 조금 더 귀 기울여 보세요.",
      "몸도 마음도 가벼운 날이에요. 새로 시작하는 일에 힘이 실려요.",
      "생각보다 일이 빠르게 진행돼요. 자신감을 가져도 좋은 하루예요.",
    ],
    mid: [
      "크게 좋고 나쁨 없이 잔잔하게 흘러가는 하루예요. 평소 리듬을 지키면 충분해요.",
      "작은 일에서 소소한 기쁨을 발견할 수 있는 날이에요.",
      "서두르지 않으면 무난하게 지나가는 하루예요. 하나씩 차근차근 해 보세요.",
      "오전보다 오후에 기운이 살아나요. 중요한 일은 오후로 미뤄도 좋아요.",
      "익숙한 것들 속에서 안정감을 얻는 날이에요.",
      "계획대로만 되진 않아도 결과는 나쁘지 않아요. 유연하게 대처해 보세요.",
    ],
    low: [
      "에너지가 조금 낮은 날이에요. 무리하지 말고 쉬어 가도 괜찮아요.",
      "사소한 일에 마음이 흔들릴 수 있어요. 한 박자 쉬고 대답해 보세요.",
      "오늘은 새 일을 벌이기보다 정리하기에 좋은 날이에요.",
      "기대만큼 풀리지 않아도 실망하지 마세요. 내일을 위한 준비 기간이에요.",
      "작은 실수가 생길 수 있으니 확인을 한 번 더 해 주세요.",
      "혼자만의 시간이 힘이 되는 하루예요. 일찍 쉬는 것도 좋은 선택이에요.",
    ],
  };

  const KEYWORDS = {
    high: ["순풍", "기회", "확장", "반가운 소식", "자신감", "도약", "결실"],
    mid: ["균형", "차분함", "꾸준함", "소확행", "정돈", "유연함", "안정"],
    low: ["쉼표", "정리", "재충전", "신중함", "기다림", "회복", "내려놓기"],
  };

  const CATEGORIES = [
    {
      id: "love",
      name: "애정운",
      lines: {
        high: [
          "마음을 표현하면 기대 이상의 반응이 돌아와요.",
          "곁에 있는 사람과의 대화가 유난히 잘 통하는 날이에요.",
          "새로운 인연이 가까이 있을지 몰라요. 약속에 적극적으로 나가 보세요.",
          "작은 선물이나 다정한 메시지가 관계를 한층 깊게 만들어요.",
          "웃음이 많아지는 하루, 그 모습에 끌리는 사람이 있어요.",
        ],
        mid: [
          "특별한 일은 없어도 편안한 관계가 이어져요.",
          "먼저 안부를 묻는 것만으로도 충분히 따뜻한 하루가 돼요.",
          "상대의 이야기를 끝까지 들어 주는 것이 오늘의 포인트예요.",
          "익숙함 속에서 고마움을 다시 느끼게 되는 날이에요.",
          "가벼운 산책이나 차 한잔이 관계에 좋은 쉼표가 돼요.",
        ],
        low: [
          "말 한마디가 오해를 부를 수 있어요. 오늘은 부드럽게 말해 보세요.",
          "서운한 감정은 오늘보다 내일 이야기하는 게 좋아요.",
          "상대에게 기대하기보다 나를 먼저 챙기는 날로 삼아요.",
          "연락이 뜸해도 너무 마음 쓰지 마세요. 각자의 사정이 있어요.",
          "감정이 앞서기 쉬운 날이니 결론은 잠시 미뤄 두세요.",
        ],
      },
    },
    {
      id: "money",
      name: "금전운",
      lines: {
        high: [
          "뜻밖의 수입이나 혜택이 생길 수 있어요.",
          "그동안의 노력이 금전적인 보상으로 돌아오는 흐름이에요.",
          "좋은 조건의 제안을 받을 수 있어요. 꼼꼼히 살펴보면 이득이에요.",
          "필요한 물건을 저렴하게 구할 수 있는 운이 따라요.",
          "작은 투자나 저축 계획을 세우기에 좋은 날이에요.",
        ],
        mid: [
          "들어오는 만큼 나가는 하루예요. 큰 지출만 피하면 무난해요.",
          "가계부를 한번 정리해 보면 새는 돈이 보여요.",
          "지금 당장 필요하지 않은 물건은 장바구니에 넣어만 두세요.",
          "소소한 할인이나 적립이 기분을 좋게 해 줘요.",
          "돈 이야기는 숫자를 정확히 확인하고 나누면 깔끔해요.",
        ],
        low: [
          "충동구매를 조심하세요. 하루만 고민하면 생각이 바뀔 거예요.",
          "빌려주거나 빌리는 일은 오늘은 피하는 게 좋아요.",
          "예상치 못한 작은 지출이 생길 수 있어요. 여유분을 남겨 두세요.",
          "급하게 결정한 결제는 후회로 이어지기 쉬운 날이에요.",
          "지갑과 카드 같은 소지품을 한 번 더 확인해 주세요.",
        ],
      },
    },
    {
      id: "health",
      name: "건강운",
      lines: {
        high: [
          "컨디션이 좋아 무엇을 해도 지치지 않는 날이에요.",
          "가벼운 운동이 기분까지 끌어올려 줘요.",
          "잠을 푹 자고 나면 활력이 두 배가 되는 하루예요.",
          "몸이 가벼워 새로운 운동을 시작하기 딱 좋아요.",
          "맛있게 먹은 한 끼가 오늘의 에너지원이 돼요.",
        ],
        mid: [
          "물을 자주 마시면 오후 컨디션이 훨씬 좋아져요.",
          "오래 앉아 있었다면 한 시간에 한 번 기지개를 켜 주세요.",
          "평소 리듬대로 먹고 자면 무난한 하루예요.",
          "가벼운 스트레칭으로 굳은 어깨를 풀어 주세요.",
          "카페인은 오후 이른 시간까지만 즐기는 게 좋아요.",
        ],
        low: [
          "피로가 쌓여 있을 수 있어요. 오늘은 일찍 잠자리에 드세요.",
          "자극적인 음식보다 따뜻하고 순한 음식이 몸에 잘 맞아요.",
          "목과 어깨가 쉽게 뭉치는 날이에요. 자세를 자주 바꿔 주세요.",
          "무리한 일정은 줄이고 쉬는 시간을 꼭 챙기세요.",
          "환절기 컨디션 관리에 신경 써 주세요. 겉옷을 챙기면 좋아요.",
        ],
      },
    },
    {
      id: "work",
      name: "일·학업운",
      lines: {
        high: [
          "집중력이 높아 밀린 일을 한 번에 끝낼 수 있어요.",
          "아이디어가 인정받는 날이에요. 의견을 자신 있게 말해 보세요.",
          "어려워 보이던 문제가 의외로 쉽게 풀려요.",
          "함께하는 사람들과 손발이 척척 맞는 하루예요.",
          "새로운 것을 배우면 머리에 쏙쏙 들어오는 날이에요.",
        ],
        mid: [
          "우선순위를 정해 두면 하루가 훨씬 수월해져요.",
          "큰 성과보다 꾸준한 진행이 빛나는 날이에요.",
          "중요한 메일이나 메시지는 보내기 전에 한 번 더 읽어 보세요.",
          "혼자 고민하기보다 짧게라도 물어보는 게 빨라요.",
          "오후에 집중이 잘 되니 어려운 일은 그때 몰아서 해 보세요.",
        ],
        low: [
          "실수가 생기기 쉬운 날이니 숫자와 날짜를 꼼꼼히 확인하세요.",
          "새로운 일을 맡기보다 지금 하던 일을 마무리하는 게 좋아요.",
          "의견 충돌이 생기면 한발 물러서는 것이 결국 이기는 길이에요.",
          "집중이 잘 안 되면 짧게 쉬었다 다시 시작해 보세요.",
          "마감은 여유 있게 잡아 두는 게 마음 편한 하루예요.",
        ],
      },
    },
  ];

  const ADVICE = [
    "오늘은 '괜찮아'라는 말을 스스로에게 한 번 더 해 주세요.",
    "창문을 열고 바깥 공기를 깊게 마셔 보세요.",
    "미뤄 둔 연락 하나를 오늘 해 보세요. 생각보다 반가워할 거예요.",
    "책상 위를 정리하면 머릿속도 함께 정리돼요.",
    "점심 이후 10분 산책이 좋은 기운을 불러와요.",
    "좋아하는 노래 한 곡으로 하루를 시작해 보세요.",
    "오늘 고마웠던 일 세 가지를 떠올리며 잠들어 보세요.",
    "평소와 다른 길로 걸어 보면 작은 행운을 만날 수 있어요.",
    "따뜻한 차 한잔과 함께 잠깐 멈추는 시간을 가져 보세요.",
    "작은 약속이라도 꼭 지키면 신뢰가 쌓이는 날이에요.",
    "누군가를 칭찬하면 그 기운이 나에게 돌아와요.",
    "오늘 할 일 목록에서 하나를 과감히 지워도 괜찮아요.",
  ];

  const QUOTES = [
    "천천히 가도 멈추지만 않으면 돼요.",
    "오늘의 작은 친절이 내일의 큰 행운이 돼요.",
    "흐린 날에도 구름 위의 해는 그대로예요.",
    "좋은 일은 준비된 사람에게 먼저 와요.",
    "웃는 얼굴에는 복이 따라와요.",
    "완벽하지 않아도 충분히 잘하고 있어요.",
    "가장 좋은 타이밍은 생각보다 가까이에 있어요.",
    "쉬어 가는 것도 앞으로 가는 방법이에요.",
    "마음이 가는 쪽에 답이 있을 때가 많아요.",
    "오늘의 나에게 조금 더 다정해지세요.",
    "작은 변화가 큰 흐름을 만들어요.",
    "지나간 일보다 지금 이 순간에 집중해요.",
  ];

  const COLORS = [
    { name: "라벤더", hex: "#b9a7e6" },
    { name: "민트", hex: "#9ad8c3" },
    { name: "코랄", hex: "#f39a86" },
    { name: "하늘색", hex: "#9cc7ef" },
    { name: "버터옐로", hex: "#f4dc8a" },
    { name: "올리브", hex: "#9aa165" },
    { name: "네이비", hex: "#2f3d6b" },
    { name: "베이지", hex: "#e5d6bf" },
    { name: "와인", hex: "#8a2f45" },
    { name: "화이트", hex: "#ffffff" },
    { name: "차콜", hex: "#3c3c40" },
    { name: "피치", hex: "#f8c3a4" },
  ];

  const DIRECTIONS = ["동쪽", "서쪽", "남쪽", "북쪽", "동남쪽", "동북쪽", "남서쪽", "북서쪽"];

  // ---------- 생성 ----------

  function bracket(score) {
    if (score >= 78) return "high";
    if (score >= 58) return "mid";
    return "low";
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  // 점수는 극단값이 덜 나오도록 두 난수의 평균을 쓴다
  function score(rng, min, max) {
    const r = (rng() + rng()) / 2;
    return Math.round(min + r * (max - min));
  }

  function generate(input) {
    const name = String(input.name || "").trim();
    const [by, bm, bd] = String(input.birth).split("-").map(Number);
    const hour = input.hour === "" || input.hour == null ? null : Number(input.hour);
    const today = todayKST();

    const rng = mulberry32(hash(`${name}|${input.birth}|${hour}|${today.key}`));
    // 사람마다 고정된 '타고난 기운'으로 점수에 약간의 성향을 준다
    const personal = mulberry32(hash(`${name}|${input.birth}`));
    const bias = Math.round((personal() - 0.5) * 8);

    const categories = CATEGORIES.map((c) => {
      const s = Math.max(35, Math.min(99, score(rng, 42, 98) + bias));
      return { id: c.id, name: c.name, score: s, text: pick(rng, c.lines[bracket(s)]) };
    });

    const avg = categories.reduce((a, c) => a + c.score, 0) / categories.length;
    const total = Math.max(40, Math.min(99, Math.round(avg + (rng() - 0.5) * 6)));
    const level = bracket(total);

    const best = categories.slice().sort((a, b) => b.score - a.score)[0];
    const worst = categories.slice().sort((a, b) => a.score - b.score)[0];

    const overall = [pick(rng, OVERALL[level])];
    overall.push(`특히 ${best.name}이 좋은 흐름이니 이 부분에 힘을 실어 보세요.`);
    if (worst.score < 58) {
      overall.push(`${worst.name}은 조금 조심하는 게 좋아요.`);
    }

    const luckySijin = SIJIN[Math.floor(rng() * 12)];

    let hourNote = null;
    if (hour !== null && SIJIN[hour]) {
      const sj = SIJIN[hour];
      hourNote = `${sj.name}에 태어난 ${name}님은 ${sj.trait} 오늘은 ${luckySijin.name}(${luckySijin.time})에 좋은 기운이 모여요.`;
    }

    return {
      date: today,
      name,
      tti: getTti(by),
      sign: getSign(bm, bd),
      sijin: hour !== null ? SIJIN[hour] : null,
      total,
      level,
      keyword: pick(rng, KEYWORDS[level]),
      overall,
      hourNote,
      categories,
      advice: pick(rng, ADVICE),
      quote: pick(rng, QUOTES),
      lucky: {
        color: pick(rng, COLORS),
        number: 1 + Math.floor(rng() * 45),
        direction: pick(rng, DIRECTIONS),
        time: luckySijin,
      },
    };
  }

  window.Fortune = { generate, todayKST, getSign, getTti, SIGNS };
})();
