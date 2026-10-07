(function () {
  "use strict";

  const STORAGE_KEY = "harugyeol:profile";
  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

  const ZODIAC_META = [
    { id: "aries", name: "양자리", range: "3.21 ~ 4.19", animal: "🐑", bg: "#fbe9e4" },
    { id: "taurus", name: "황소자리", range: "4.20 ~ 5.20", animal: "🐮", bg: "#eef3e3" },
    { id: "gemini", name: "쌍둥이자리", range: "5.21 ~ 6.21", animal: "🐥", bg: "#fdf4d8" },
    { id: "cancer", name: "게자리", range: "6.22 ~ 7.22", animal: "🦀", bg: "#fde6e2" },
    { id: "leo", name: "사자자리", range: "7.23 ~ 8.22", animal: "🦁", bg: "#fcefd9" },
    { id: "virgo", name: "처녀자리", range: "8.23 ~ 9.22", animal: "🐰", bg: "#f3ecf8" },
    { id: "libra", name: "천칭자리", range: "9.23 ~ 10.22", animal: "🐼", bg: "#eceff3" },
    { id: "scorpio", name: "전갈자리", range: "10.23 ~ 11.22", animal: "🦔", bg: "#f2e9e1" },
    { id: "sagittarius", name: "사수자리", range: "11.23 ~ 12.21", animal: "🐴", bg: "#f6ece2" },
    { id: "capricorn", name: "염소자리", range: "12.22 ~ 1.19", animal: "🐐", bg: "#ecefe8" },
    { id: "aquarius", name: "물병자리", range: "1.20 ~ 2.18", animal: "🐳", bg: "#e3eff9" },
    { id: "pisces", name: "물고기자리", range: "2.19 ~ 3.20", animal: "🐠", bg: "#e2f3f3" },
  ];

  const $ = (sel) => document.querySelector(sel);

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function storage(action, value) {
    try {
      if (action === "get") return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (action === "set") localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      if (action === "clear") localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      return null;
    }
  }

  // ---------- 헤더 날짜 ----------
  const today = Fortune.todayKST();
  $("#today-label").textContent = `${today.m}월 ${today.d}일 ${WEEKDAYS[today.weekday]}요일`;
  $("#birth").max = today.key;

  // ---------- 탭 ----------
  const tabs = document.querySelectorAll(".tab");
  function showTab(name) {
    tabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      document.getElementById(`panel-${t.dataset.tab}`).hidden = !on;
    });
    if (location.hash !== `#${name}`) history.replaceState(null, "", `#${name}`);
  }
  tabs.forEach((t) => t.addEventListener("click", () => showTab(t.dataset.tab)));
  if (location.hash === "#zodiac") showTab("zodiac");
  window.addEventListener("hashchange", () => showTab(location.hash === "#zodiac" ? "zodiac" : "personal"));

  // ---------- 오늘의 운세 ----------
  const form = $("#fortune-form");
  const result = $("#fortune-result");

  function ring(score) {
    const r = 46, c = 2 * Math.PI * r;
    return `
      <div class="score-ring" aria-label="총점 ${score}점">
        <svg viewBox="0 0 104 104" aria-hidden="true">
          <circle class="track" cx="52" cy="52" r="${r}" fill="none" stroke-width="8"/>
          <circle class="bar" cx="52" cy="52" r="${r}" fill="none" stroke-width="8"
            stroke-dasharray="${c}" stroke-dashoffset="${c}" data-target="${c * (1 - score / 100)}"/>
        </svg>
        <div class="num"><b>${score}</b><small>/ 100</small></div>
      </div>`;
  }

  function renderFortune(f) {
    const n = esc(f.name);
    const badges = [`${f.tti}띠`, f.sign.name];
    if (f.sijin) badges.push(f.sijin.name);

    result.innerHTML = `
      <div class="card summary">
        ${ring(f.total)}
        <div>
          <div class="badges">${badges.map((b) => `<span class="badge">${esc(b)}</span>`).join("")}</div>
          <h2>${n}님의 ${f.date.m}월 ${f.date.d}일</h2>
          <p class="keyword">오늘의 키워드 · ${esc(f.keyword)}</p>
        </div>
      </div>

      <div class="card block">
        <h3>총운</h3>
        <p>${f.overall.map(esc).join(" ")}</p>
        ${f.hourNote ? `<p>${esc(f.hourNote)}</p>` : ""}
        <p>${esc(f.advice)}</p>
      </div>

      <div class="card block">
        <h3>분야별 운세</h3>
        <div class="cats">
          ${f.categories.map((c) => `
            <div class="cat">
              <div class="cat-head"><span class="cat-name">${c.name}</span><span class="cat-score">${c.score}</span></div>
              <div class="meter"><span data-w="${c.score}"></span></div>
              <p>${esc(c.text)}</p>
            </div>`).join("")}
        </div>
      </div>

      <div class="card block">
        <h3>오늘의 행운</h3>
        <div class="lucky">
          <div class="lucky-item"><div class="k">색</div><div class="v"><i class="swatch" style="background:${f.lucky.color.hex}"></i>${f.lucky.color.name}</div></div>
          <div class="lucky-item"><div class="k">숫자</div><div class="v">${f.lucky.number}</div></div>
          <div class="lucky-item"><div class="k">방향</div><div class="v">${f.lucky.direction}</div></div>
          <div class="lucky-item"><div class="k">시간</div><div class="v">${f.lucky.time.name}</div></div>
        </div>
      </div>

      <div class="card quote">“${esc(f.quote)}”</div>

      <div class="result-actions">
        <button class="btn-ghost" type="button" id="btn-share">공유하기</button>
        <button class="btn-ghost" type="button" id="btn-reset">다른 사람 보기</button>
      </div>`;

    form.hidden = true;
    result.hidden = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const bar = result.querySelector(".score-ring .bar");
        bar.style.strokeDashoffset = bar.dataset.target;
        result.querySelectorAll(".meter span").forEach((s) => (s.style.width = s.dataset.w + "%"));
      });
    });

    $("#btn-reset").addEventListener("click", () => {
      resetFortune();
      $("#name").focus();
    });

    $("#btn-share").addEventListener("click", async (e) => {
      const text = `${f.name}님의 오늘 운세 점수는 ${f.total}점! 키워드는 '${f.keyword}' ✨`;
      const url = location.origin + location.pathname;
      try {
        if (navigator.share) {
          await navigator.share({ title: "하루결 · 오늘의 운세", text, url });
        } else {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          e.target.textContent = "복사했어요";
          setTimeout(() => (e.target.textContent = "공유하기"), 1600);
        }
      } catch (err) { /* 공유 취소 */ }
    });

    highlightMySign(f.sign.id);
  }

  // 저장된 정보를 지우고 입력 화면으로 돌아간다
  function resetFortune() {
    storage("clear");
    form.reset();
    result.hidden = true;
    result.innerHTML = "";
    form.hidden = false;
    renderZodiac();
  }

  // 로고를 누르면 처음 화면으로
  $(".logo").addEventListener("click", (e) => {
    e.preventDefault();
    resetFortune();
    showTab("personal");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const profile = {
      name: $("#name").value.trim(),
      birth: $("#birth").value,
      hour: $("#hour").value,
    };
    if (!profile.name || !profile.birth) return;
    storage("set", profile);
    renderFortune(Fortune.generate(profile));
    window.scrollTo({ top: result.offsetTop - 80, behavior: "smooth" });
  });

  // ---------- 별자리 운세 ----------
  const grid = $("#zodiac-grid");

  function stars(n) {
    const v = Math.max(1, Math.min(5, Math.round(n)));
    return `<span class="stars" aria-label="5점 만점에 ${v}점">${"★".repeat(v)}<span class="off">${"★".repeat(5 - v)}</span></span>`;
  }

  function renderZodiac() {
    const data = window.ZODIAC_DATA;
    if (!data || !data.signs) {
      grid.innerHTML = `<div class="card empty">오늘의 별자리 운세를 준비하고 있어요.</div>`;
      return;
    }
    const [y, m, d] = data.date.split("-").map(Number);
    $("#zodiac-updated").textContent =
      data.date === today.key
        ? `${m}월 ${d}일 운세 · 매일 자정 업데이트`
        : `${y}.${m}.${d} 기준 · 오늘 운세를 준비 중이에요`;

    grid.innerHTML = ZODIAC_META.map((z) => {
      const s = data.signs[z.id];
      if (!s) return "";
      return `
        <button type="button" class="card zcard" data-id="${z.id}" aria-expanded="false">
          <div class="zcard-top">
            <div class="animal" style="background:${z.bg}" aria-hidden="true">${z.animal}</div>
            <div>
              <div class="zname">${z.name}</div>
              <div class="zdate">${z.range}</div>
            </div>
            ${stars(s.score)}
          </div>
          <p class="zsummary">${esc(s.summary)}</p>
          <div class="zdetail">
            <div class="zrow"><b>애정</b><span>${esc(s.love)}</span></div>
            <div class="zrow"><b>금전</b><span>${esc(s.money)}</span></div>
            <div class="zrow"><b>건강</b><span>${esc(s.health)}</span></div>
            <div class="zlucky">
              <span class="badge">행운의 색 · ${esc(s.luckyColor)}</span>
              <span class="badge">행운의 숫자 · ${esc(s.luckyNumber)}</span>
            </div>
          </div>
        </button>`;
    }).join("");

    grid.querySelectorAll(".zcard").forEach((card) => {
      card.addEventListener("click", () => {
        const open = card.classList.toggle("is-open");
        card.setAttribute("aria-expanded", String(open));
      });
    });
  }

  function highlightMySign(id) {
    grid.querySelectorAll(".zcard").forEach((card) => {
      const mine = card.dataset.id === id;
      card.classList.toggle("is-mine", mine);
      const nameEl = card.querySelector(".zname");
      const tag = nameEl.querySelector(".mine-tag");
      if (mine && !tag) nameEl.insertAdjacentHTML("beforeend", `<span class="mine-tag">내 별자리</span>`);
      if (!mine && tag) tag.remove();
    });
    // 내 별자리를 맨 앞으로
    const mineCard = id && grid.querySelector(`.zcard[data-id="${id}"]`);
    if (mineCard) grid.prepend(mineCard);
  }

  renderZodiac();

  // 저장된 정보가 있으면 바로 오늘 운세를 보여 준다
  const saved = storage("get");
  if (saved && saved.name && saved.birth) {
    $("#name").value = saved.name;
    $("#birth").value = saved.birth;
    $("#hour").value = saved.hour || "";
    renderFortune(Fortune.generate(saved));
  }
})();
