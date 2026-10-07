(function () {
  "use strict";

  const STORAGE_KEY = "harugyeol:profile";
  const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

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
        if (bar) bar.style.strokeDashoffset = bar.dataset.target;
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
  }

  // 저장된 정보를 지우고 입력 화면으로 돌아간다
  function resetFortune() {
    storage("clear");
    form.reset();
    result.hidden = true;
    result.innerHTML = "";
    form.hidden = false;
  }

  // 로고를 누르면 처음 화면으로
  $(".logo").addEventListener("click", (e) => {
    e.preventDefault();
    resetFortune();
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

  // 저장된 정보가 있으면 바로 오늘 운세를 보여 준다
  const saved = storage("get");
  if (saved && saved.name && saved.birth) {
    $("#name").value = saved.name;
    $("#birth").value = saved.birth;
    $("#hour").value = saved.hour || "";
    renderFortune(Fortune.generate(saved));
  }
})();
