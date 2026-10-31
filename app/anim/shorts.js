// Edulink Shorts: a vertical feed of short lessons (under 60 seconds) you swipe through.
// Each short ends on a cliffhanger that leads into the next one; the notes carry the full detail.
//
// A short looks like:
//   { id, series, part, of, title, beats: ['line with *emphasis*', { say, speak, d }], next: 'cliffhanger line',
//     build(g, fx) => (lt, P) => { ...draw one moment... } }
// Voice: if recorded clips exist at shorts/voice/<id>/<n>.mp3 (n = beat number from 1), they are used.
// Otherwise the computer's own voice reads the line (a Nigerian English voice if the computer has one).
import { S, C, clamp, easeOut, backOut } from './videoplayer.js';

const FONT = "'Plus Jakarta Sans', system-ui, sans-serif";
const W = 720, H = 1280;
const plain = (s) => s.replace(/\*/g, '');

// ---- drawing helpers that give shorts their punchy look
export const fx = {
  // Big tilted sticker text that pops in.
  sticker(g, x, y, text, { color = C.orange, ink = '#1C0A00', size = 44, rot = -4 } = {}) {
    const grp = S('g', { opacity: 0 }, g);
    const w = text.length * size * 0.62 + 44;
    const inner = S('g', {}, grp);
    S('rect', { x: -w / 2, y: -size * 0.95, width: w, height: size * 1.5, rx: 14, fill: color }, inner);
    const t = S('text', { x: 0, y: size * 0.18, fill: ink, 'font-family': FONT, 'font-size': size, 'font-weight': 800, 'text-anchor': 'middle' }, inner);
    t.textContent = text;
    return {
      g: grp,
      set(a) {
        const k = backOut(clamp(a));
        grp.setAttribute('opacity', clamp(a * 3).toFixed(3));
        grp.setAttribute('transform', `translate(${x} ${y}) rotate(${rot}) scale(${(0.4 + 0.6 * k).toFixed(3)})`);
      },
    };
  },
  // Plain big text.
  text(g, x, y, str, { size = 40, fill = C.ink, weight = 800, anchor = 'middle' } = {}) {
    const t = S('text', { x, y, fill, 'font-family': FONT, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor, opacity: 0 }, g);
    t.textContent = str;
    return { el: t, set: (a, dy = 0) => { t.setAttribute('opacity', clamp(a).toFixed(3)); t.setAttribute('transform', `translate(0 ${((1 - clamp(a)) * dy).toFixed(1)})`); } };
  },
  // Camera: zoom into a point (k = 1 is no zoom) with optional shake.
  camera(root, k, cx, cy, shake = 0, t = 0) {
    const sx = shake ? Math.sin(t * 61) * shake : 0, sy = shake ? Math.cos(t * 53) * shake : 0;
    root.setAttribute('transform', `translate(${(cx - cx * k + sx).toFixed(1)} ${(cy - cy * k + sy).toFixed(1)}) scale(${k.toFixed(4)})`);
  },
  // A quick pulse 0 → 1 → 0 around progress p (for flashes and punches).
  pulse: (p, at = 0, len = 0.15) => { const u = (p - at) / len; return u < 0 || u > 1 ? 0 : Math.sin(Math.PI * u); },
};

// ---- voice
const voices = () => ('speechSynthesis' in window ? speechSynthesis.getVoices() : []);
function pickVoice() {
  const v = voices();
  return v.find((x) => /en[-_]NG/i.test(x.lang)) || v.find((x) => /Nigeria|Abeo|Ezinne/i.test(x.name))
    || v.find((x) => x.lang === 'en-GB') || v.find((x) => x.lang.startsWith('en')) || null;
}
export const hasNigerianVoice = () => !!voices().find((x) => /en[-_]NG/i.test(x.lang) || /Nigeria/i.test(x.name));

function probeClip(src) {
  return new Promise((res) => {
    const a = new Audio(); let done = false;
    const fin = (ok) => { if (!done) { done = true; res(ok ? a : null); } };
    a.preload = 'auto'; a.onloadedmetadata = () => fin(true); a.onerror = () => fin(false);
    setTimeout(() => fin(false), 1500);
    a.src = src;
  });
}

// ---- the feed
function quizHTML(s, i, shorts) {
  const q = s.quiz, nxt = shorts[i + 1];
  return `<section class="sh-slide sh-qslide" data-q="${i}">
    <div class="sh-stage sh-q">
      <div class="sh-q-k">Quick check · ${s.series} ${s.part}/${s.of}</div>
      <div class="sh-q-t">${q.q}</div>
      <div class="sh-q-o">${q.options.map((o, k) => `<button data-o="${k}"><i>${'ABCD'[k]}</i><span>${o}</span></button>`).join('')}</div>
      <div class="sh-q-why" hidden></div>
      <div class="sh-q-next" hidden>${nxt ? `Swipe up: ${nxt.title} ↑` : 'Series done! Open the note 📖'}</div>
    </div>
  </section>`;
}

export function mountShorts(host, shorts, { base = 'shorts/', onNote, onPractise, onAnswer, autostart } = {}) {
  host.innerHTML = `<div class="sh-feed">${shorts.map((s, i) => `
    <section class="sh-slide" data-i="${i}">
      <div class="sh-stage">
        <svg class="sh-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${plain(s.title)}"></svg>
        <div class="sh-prog"><i></i></div>
        <div class="sh-top"><span class="sh-series">${s.title}</span><span class="sh-part">Part ${s.part}/${s.of}</span></div>
        <div class="sh-cap"></div>
        <div class="sh-next" hidden><div class="sh-next-k">${i < shorts.length - 1 ? 'Next' : 'The end'}</div><div class="sh-next-t">${s.next || ''}</div>
          ${i < shorts.length - 1 ? '<div class="sh-next-h">Swipe up ↑</div>' : '<button class="sh-again">Watch again</button>'}</div>
        <button class="sh-tap" aria-label="Play or pause"></button>
        <div class="sh-paused" hidden>▶</div>
        <div class="sh-rail">
          <button data-a="like" aria-label="Like"><span>♥</span><b>Like</b></button>
          <button data-a="note" aria-label="Read the note"><span>📖</span><b>Notes</b></button>
          <button data-a="practise" aria-label="Practise"><span>✍️</span><b>Practise</b></button>
          <button data-a="mute" aria-label="Sound"><span>🔊</span><b>Sound</b></button>
        </div>
      </div>
    </section>${s.quiz ? quizHTML(s, i, shorts) : ''}`).join('')}
    <div class="sh-start"><button>▶ Tap to start</button></div>
  </div>`;

  const feed = host.querySelector('.sh-feed');
  const slides = [...host.querySelectorAll('.sh-slide[data-i]')];
  const allSlides = [...host.querySelectorAll('.sh-slide')];
  let quizDone = {};
  try { quizDone = JSON.parse(localStorage.getItem('sh-quiz') || '{}'); } catch { quizDone = {}; }
  let muted = false, started = false, active = -1, raf = 0, last = 0, likes = {};
  try { likes = JSON.parse(localStorage.getItem('sh-likes') || '{}'); } catch { likes = {}; }

  // Build every short once.
  const items = shorts.map((s, i) => {
    const el = slides[i], svg = el.querySelector('.sh-svg');
    S('rect', { width: W, height: H, fill: C.bg }, svg);
    const glow = S('radialGradient', { id: `shg${i}`, cx: '50%', cy: '35%', r: '70%' }, S('defs', {}, svg));
    S('stop', { offset: '0%', 'stop-color': '#3A2414' }, glow); S('stop', { offset: '100%', 'stop-color': C.bg }, glow);
    S('rect', { width: W, height: H, fill: `url(#shg${i})` }, svg);
    const base = S('g', { transform: 'translate(360 600) scale(1.12) translate(-360 -600)' }, svg); // fill the frame a little more
    const root = S('g', {}, base);
    const ui = S('g', {}, svg); // stickers and equations: not moved by the camera
    const flash = S('rect', { width: W, height: H, fill: '#fff', opacity: 0, 'pointer-events': 'none' }, svg);
    const it = { s, el, svg, root, flash, clips: [], t: 0, playing: false, speaking: false, beatIdx: -1, ended: false };
    it.fx = { ...fx, flash: (a) => flash.setAttribute('opacity', (clamp(a) * 0.4).toFixed(3)), root, ui };
    it.draw = s.build(root, it.fx);
    it.time = () => {
      let t0 = 0;
      it.B = s.beats.map((b, bi) => {
        const text = typeof b === 'string' ? b : b.say;
        const words = plain(text).split(/\s+/).length;
        const clip = it.clips[bi];
        const d = clip ? clip.duration + 0.25 : (typeof b === 'object' && b.d) || Math.max(1.8, words / 3.0 + 0.35);
        const r = { s: t0, e: t0 + d, text, spoken: (typeof b === 'object' && b.speak) || plain(text) };
        t0 += d; return r;
      });
      it.total = t0;
    };
    it.time();
    if (likes[s.id]) el.querySelector('[data-a="like"]').classList.add('on');
    return it;
  });

  // Look for recorded voice clips in the background; the timing updates when they are found.
  items.forEach(async (it) => {
    const first = await probeClip(`${base}voice/${it.s.id}/1.mp3`);
    if (!first) return;
    const rest = await Promise.all(it.s.beats.slice(1).map((_, bi) => probeClip(`${base}voice/${it.s.id}/${bi + 2}.mp3`)));
    const found = [first, ...rest];
    if (found.every(Boolean)) { it.clips = found; it.time(); }
  });

  function caption(it, bi) {
    const box = it.el.querySelector('.sh-cap');
    const b = it.B[bi]; const d = b.e - b.s;
    const words = b.text.split(/\s+/);
    const step = Math.min(0.16, (d * 0.55) / words.length);
    let em = false;
    box.innerHTML = words.map((w, k) => {
      const open = w.startsWith('*'), close = w.replace(/[.,!?:;)]+$/, '').endsWith('*');
      if (open) em = true;
      const html = `<span class="${em ? 'em' : ''}" style="animation-delay:${(k * step).toFixed(2)}s">${w.replace(/\*/g, '')}</span>`;
      if (close) em = false;
      return html;
    }).join(' ');
  }

  function stopVoice(it) {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    it.clips.forEach((c) => { if (c) { c.pause(); } });
    it.speaking = false;
  }
  function speak(it, bi) {
    stopVoice(it);
    if (muted || !it.playing) return;
    const clip = it.clips[bi];
    if (clip) {
      clip.currentTime = 0; it.speaking = true;
      clip.onended = () => { it.speaking = false; };
      clip.play().catch(() => { it.speaking = false; });
      return;
    }
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(it.B[bi].spoken);
    const v = pickVoice(); if (v) { u.voice = v; u.lang = v.lang; }
    u.rate = 1.05; u.pitch = 1.0;
    u.onend = u.onerror = () => { it.speaking = false; };
    it.speaking = true;
    speechSynthesis.speak(u);
  }

  function render(it) {
    const t = it.t;
    let bi = it.B.findIndex((b) => t < b.e); if (bi < 0) bi = it.B.length - 1;
    const P = (i, a = 0, b = 1) => { const B = it.B[i]; const d = B.e - B.s; return clamp((t - (B.s + a * d)) / ((b - a) * d || 1)); };
    it.draw(t, P);
    if (bi !== it.beatIdx) { it.beatIdx = bi; caption(it, bi); if (it.playing) speak(it, bi); }
    it.el.querySelector('.sh-prog i').style.width = (t / it.total) * 100 + '%';
  }

  function setPlaying(it, on) {
    it.playing = on;
    it.el.querySelector('.sh-paused').hidden = on || it.ended;
    if (!on) stopVoice(it); else { speak(it, Math.max(0, it.beatIdx)); }
  }

  function reset(it) { it.t = 0; it.ended = false; it.beatIdx = -1; it.el.querySelector('.sh-next').hidden = true; render(it); }

  function activate(i) {
    if (i === active) return;
    if (active >= 0) { setPlaying(items[active], false); reset(items[active]); }
    active = i;
    const it = items[i];
    reset(it);
    if (started) setPlaying(it, true);
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const it = items[active];
    if (it && it.playing && !it.ended) {
      const b = it.B[it.beatIdx];
      let nt = it.t + dt;
      if (it.speaking && b && nt >= b.e - 0.03) nt = Math.min(it.t, b.e - 0.03); // wait for the voice
      it.t = Math.min(nt, it.total);
      if (it.t >= it.total) {
        it.ended = true; it.playing = false;
        it.el.querySelector('.sh-next').hidden = false;
        if (active < items.length - 1 || it.s.quiz) setTimeout(() => { if (items[active] === it && it.ended) slides[active].nextElementSibling?.scrollIntoView({ behavior: 'smooth' }); }, 2200);
      }
      render(it);
    }
    raf = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver((ents) => {
    ents.forEach((e) => {
      if (!e.isIntersecting || e.intersectionRatio <= 0.6) return;
      cur = allSlides.indexOf(e.target);
      if (e.target.dataset.i !== undefined) activate(+e.target.dataset.i);
      else if (active >= 0) { setPlaying(items[active], false); reset(items[active]); active = -1; } // a question card: pause the video
    });
  }, { root: feed, threshold: [0.6] });
  let cur = 0;
  allSlides.forEach((s) => io.observe(s));

  const onClick = (e) => {
    const start = e.target.closest('.sh-start button');
    if (start) { started = true; host.querySelector('.sh-start').remove(); if (active < 0) activate(0); setPlaying(items[active], true); return; }
    const opt = e.target.closest('.sh-q-o button');
    if (opt) { answer(opt); return; }
    const slide = e.target.closest('.sh-slide[data-i]'); if (!slide) return;
    const it = items[+slide.dataset.i];
    if (e.target.closest('.sh-tap')) { if (it.ended) { reset(it); setPlaying(it, true); } else setPlaying(it, !it.playing); return; }
    if (e.target.closest('.sh-again')) { slides[0].scrollIntoView({ behavior: 'smooth' }); return; }
    const a = e.target.closest('[data-a]')?.dataset.a;
    if (a === 'like') { likes[it.s.id] = !likes[it.s.id]; e.target.closest('button').classList.toggle('on', !!likes[it.s.id]); try { localStorage.setItem('sh-likes', JSON.stringify(likes)); } catch { /* private window */ } }
    if (a === 'mute') { muted = !muted; host.querySelectorAll('[data-a="mute"] span').forEach((n) => { n.textContent = muted ? '🔇' : '🔊'; }); if (muted) stopVoice(it); else speak(it, it.beatIdx); }
    if (a === 'note') onNote?.(it.s);
    if (a === 'practise') onPractise?.(it.s);
  };
  // Question cards: tap an option, see right or wrong at once, with the one-line reason.
  function answer(btn) {
    const card = btn.closest('.sh-qslide'); if (card.classList.contains('done')) return;
    const s = shorts[+card.dataset.q], k = +btn.dataset.o, ok = k === s.quiz.answer;
    card.classList.add('done');
    card.querySelectorAll('.sh-q-o button').forEach((b, j) => { b.classList.toggle('right', j === s.quiz.answer); b.classList.toggle('wrong', j === k && !ok); b.disabled = true; });
    const why = card.querySelector('.sh-q-why');
    why.innerHTML = `<b>${ok ? 'Correct! 🎉' : 'Not quite.'}</b> ${s.quiz.why}`; why.className = 'sh-q-why ' + (ok ? 'ok' : 'no'); why.hidden = false;
    card.querySelector('.sh-q-next').hidden = false;
    quizDone[s.id] = { ok, at: Date.now() };
    try { localStorage.setItem('sh-quiz', JSON.stringify(quizDone)); } catch { /* private window */ }
    onAnswer?.(s, ok);
  }
  const onKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = clamp(cur + (e.key === 'ArrowDown' ? 1 : -1), 0, allSlides.length - 1); allSlides[n].scrollIntoView({ behavior: 'smooth' }); }
    if (e.key === ' ') { e.preventDefault(); const it = items[active]; if (it && started) setPlaying(it, !it.playing); }
  };
  host.addEventListener('click', onClick);
  window.addEventListener('keydown', onKey);
  raf = requestAnimationFrame((n) => { last = n; frame(n); });
  // If the learner already tapped something on this page (e.g. a lesson), play straight away.
  if (autostart ?? navigator.userActivation?.hasBeenActive) { started = true; host.querySelector('.sh-start')?.remove(); }
  activate(0);

  // For tests and thumbnails: jump short i to time t (seconds) without playing.
  host.__seek = (i, t) => { const it = items[i]; it.t = clamp(t, 0, it.total); it.beatIdx = -1; render(it); return it.total; };
  host.__answer = (q, k) => answer(host.querySelector(`.sh-qslide[data-q="${q}"] [data-o="${k}"]`));
  host.__lengths = () => items.map((it) => +it.total.toFixed(1));

  return () => { cancelAnimationFrame(raf); io.disconnect(); host.removeEventListener('click', onClick); window.removeEventListener('keydown', onKey); items.forEach(stopVoice); };
}

export const SHORTS_CSS = `
.sh-feed{height:100%;overflow-y:scroll;scroll-snap-type:y mandatory;background:#0B0908;position:relative;scrollbar-width:none}
.sh-feed::-webkit-scrollbar{display:none}
.sh-slide{height:100%;scroll-snap-align:start;scroll-snap-stop:always;display:flex;align-items:center;justify-content:center;position:relative}
.sh-stage{position:relative;height:100%;max-height:100%;aspect-ratio:9/16;max-width:100%;overflow:hidden;border-radius:18px;background:#14110F;font-family:'Plus Jakarta Sans',system-ui,sans-serif;container-type:inline-size}
.sh-svg{position:absolute;inset:0;width:100%;height:100%}
.sh-prog{position:absolute;top:10px;left:12px;right:12px;height:4px;border-radius:4px;background:rgba(255,255,255,.18)}
.sh-prog i{display:block;height:100%;width:0;border-radius:4px;background:#F97316}
.sh-top{position:absolute;top:24px;left:16px;right:16px;display:flex;justify-content:space-between;align-items:center;color:#fff;font-size:3.4cqw;font-weight:800}
.sh-series{background:rgba(0,0,0,.35);padding:5px 12px;border-radius:999px}
.sh-part{color:#FDBA74}
.sh-cap{position:absolute;left:5%;right:17%;bottom:4.5%;text-align:center;color:#fff;font-size:6.2cqw;font-weight:800;line-height:1.22;text-shadow:0 3px 14px rgba(0,0,0,.85);pointer-events:none}
.sh-cap span{display:inline-block;opacity:0;transform:translateY(14px) scale(.85);animation:shw .32s cubic-bezier(.2,1.4,.4,1) forwards}
.sh-cap span.em{color:#FDBA74;font-size:1.14em}
@keyframes shw{to{opacity:1;transform:none}}
.sh-title{position:absolute;left:16px;right:20%;bottom:16px;color:rgba(255,255,255,.85);font-size:3.6cqw;font-weight:700}
.sh-rail{position:absolute;right:10px;bottom:24%;display:flex;flex-direction:column;gap:14px;z-index:3}
.sh-rail button{border:0;background:none;color:#fff;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;font:inherit}
.sh-rail span{width:11cqw;height:11cqw;max-width:52px;max-height:52px;border-radius:50%;background:rgba(0,0,0,.45);display:grid;place-items:center;font-size:5cqw}
.sh-rail b{font-size:2.8cqw;font-weight:700}
.sh-rail button.on span{background:#EF4444}
.sh-tap{position:absolute;inset:60px 18% 0 0;background:none;border:0;cursor:pointer;z-index:2}
.sh-paused[hidden]{display:none}
.sh-paused{position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.8);font-size:16cqw;pointer-events:none}
.sh-next{position:absolute;left:8%;right:8%;top:30%;padding:26px 20px;border-radius:24px;background:rgba(20,17,15,.92);border:2px solid #F97316;text-align:center;color:#fff;z-index:4;animation:shn .45s cubic-bezier(.2,1.4,.4,1)}
.sh-next-k{color:#F97316;font-weight:800;font-size:3.6cqw;letter-spacing:.12em;text-transform:uppercase}
.sh-next-t{font-size:6.4cqw;font-weight:800;margin:10px 0 14px;line-height:1.2}
.sh-next-h{font-weight:800;color:#FDBA74;font-size:4.2cqw;animation:shb 1s ease-in-out infinite}
.sh-again{border:0;border-radius:999px;background:#F97316;color:#fff;font:inherit;font-weight:800;padding:12px 22px;cursor:pointer}
@keyframes shn{from{opacity:0;transform:scale(.8)}}
@keyframes shb{50%{transform:translateY(-6px)}}
.sh-start{position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.45);z-index:9}
.sh-start button{border:0;border-radius:999px;background:#F97316;color:#fff;font:800 20px 'Plus Jakarta Sans',system-ui,sans-serif;padding:16px 30px;cursor:pointer}
.sh-q{display:flex;flex-direction:column;justify-content:center;padding:0 7%;box-sizing:border-box;background:radial-gradient(120% 70% at 50% 25%,#3A2414,#14110F 70%);color:#fff;gap:2.4cqw}
.sh-q-k{color:#F97316;font-weight:800;font-size:3.6cqw;letter-spacing:.1em;text-transform:uppercase}
.sh-q-t{font-size:7cqw;font-weight:800;line-height:1.2;margin-bottom:2cqw}
.sh-q-o{display:flex;flex-direction:column;gap:2.4cqw}
.sh-q-o button{display:flex;align-items:center;gap:3cqw;text-align:left;border:2px solid #3A332E;background:#221D19;color:#fff;border-radius:18px;padding:3.4cqw 4cqw;font:inherit;font-size:4.6cqw;font-weight:700;cursor:pointer;transition:transform .15s,background .2s,border-color .2s}
.sh-q-o button:not(:disabled):hover{border-color:#F97316}
.sh-q-o button:not(:disabled):active{transform:scale(.97)}
.sh-q-o i{font-style:normal;flex:none;width:8cqw;height:8cqw;border-radius:50%;background:#3A332E;display:grid;place-items:center;font-weight:800;font-size:4cqw}
.sh-q-o button.right{background:#14532D;border-color:#4ADE80;animation:shok .4s}
.sh-q-o button.right i{background:#4ADE80;color:#052E16}
.sh-q-o button.wrong{background:#450A0A;border-color:#EF4444;animation:shno .4s}
.sh-q-o button.wrong i{background:#EF4444}
.sh-q-o button:disabled:not(.right):not(.wrong){opacity:.45}
@keyframes shok{50%{transform:scale(1.04)}}
@keyframes shno{20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
.sh-q-why{font-size:4.3cqw;line-height:1.4;border-radius:16px;padding:3.4cqw 4cqw;background:#221D19;animation:shn .35s}
.sh-q-why.ok b{color:#4ADE80}.sh-q-why.no b{color:#FCA5A5}
.sh-q-next{text-align:center;font-weight:800;color:#FDBA74;font-size:4.3cqw;margin-top:2cqw;animation:shb 1s ease-in-out infinite}
`;
