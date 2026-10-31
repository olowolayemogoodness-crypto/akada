// Motion-graphics "video" player. Each lesson is drawn in SVG as a pure function of time,
// so play, pause, scrubbing and chapters are exact and nothing needs to be downloaded.
// Narration uses the Mac's built-in offline voices; captions are always available.

export const NS = 'http://www.w3.org/2000/svg';
export function S(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) n.setAttribute(k, v);
  if (parent) parent.appendChild(n);
  return n;
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const backOut = (t) => { const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
// Smooth movement through [[time, value], …]; velocity is zero at each keyframe.
export function keyframes(list, t) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) {
    const [t1, v1] = list[i], [t0, v0] = list[i - 1];
    if (t <= t1) { const u = clamp((t - t0) / (t1 - t0 || 1)); return lerp(v0, v1, u * u * (3 - 2 * u)); }
  }
  return list.at(-1)[1];
}
export const C = { bg: '#14110F', ink: '#F5F5F4', muted: '#A8A29E', dim: '#57534E', orange: '#F97316', peach: '#FDBA74', blue: '#3B7DDD', sky: '#7DB4F5', red: '#EF4444', copper: '#E8913A', copperDark: '#8A4B17', green: '#4ADE80', gold: '#FDE68A' };

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const ICON = {
  play: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15a1 1 0 001.5.86l12-7.5a1 1 0 000-1.72l-12-7.5A1 1 0 007 4.5z"/></svg>',
  pause: '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16" rx="1.2"/><rect x="14" y="4" width="4" height="16" rx="1.2"/></svg>',
  voice: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"/></svg>',
  mute: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M22 9l-6 6M16 9l6 6"/></svg>',
  cc: '<svg width="20" height="18" viewBox="0 0 26 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1.5" y="1.5" width="23" height="17" rx="4"/><path d="M11 8a3 3 0 100 4M19 8a3 3 0 100 4" stroke-linecap="round"/></svg>',
  full: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  replay: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5"/></svg>',
};

export function mountVideo(host, video, { practiseTopic } = {}) {
  // ---- timing: each caption gets enough time to be read (or spoken) comfortably
  let t0 = 0;
  const beats = [], chapters = [];
  video.scenes.forEach((sc, si) => {
    sc.start = t0;
    sc.B = sc.beats.map((b, bi) => {
      const text = typeof b === 'string' ? b : b.say;
      const words = text.split(/\s+/).length;
      const d = typeof b === 'object' && b.d ? b.d : Math.max(3.2, words / 2.75 + 0.6);
      const s = t0 - sc.start, e = s + d;
      beats.push({ text, spoken: (typeof b === 'object' && b.speak) || text, start: t0, end: t0 + d, scene: si });
      const ch = (sc.chapters || [[0, sc.chapter]]).find(([k]) => k === bi);
      if (ch) chapters.push({ title: ch[1], at: t0 });
      t0 += d;
      return { s, e };
    });
    sc.end = t0;
  });
  const total = t0;

  host.innerHTML = `<div class="vplayer" tabindex="0">
    <div class="vstage"><svg class="vsvg" viewBox="0 0 1280 720" role="img" aria-label="${video.title}"></svg>
      <button class="vbig" aria-label="Play">${ICON.play}<span>Play lesson · ${fmt(total)}</span></button>
      <div class="vend" hidden><div class="vend-in"><div class="vend-k">Lesson complete</div><div class="vend-t">${video.title}</div>
        <div class="vend-b"><button class="vbtn primary" data-v="replay">${ICON.replay}Watch again</button>${practiseTopic ? `<button class="vbtn" data-practise="${practiseTopic}">Practise the questions</button>` : ''}</div></div></div>
    </div>
    <div class="vcap"><span></span></div>
    <div class="vbar">
      <button class="vctl" data-v="toggle" aria-label="Play">${ICON.play}</button>
      <span class="vtime">0:00 / ${fmt(total)}</span>
      <div class="vtrack" role="slider" aria-label="Seek" aria-valuemin="0" aria-valuemax="${Math.round(total)}" tabindex="0"><div class="vrail"><div class="vfill"></div>${chapters.slice(1).map((c) => `<i style="left:${(c.at / total) * 100}%"></i>`).join('')}</div><div class="vknob"></div><div class="vtip" hidden></div></div>
      <button class="vctl" data-v="voice" aria-label="Narration" title="Narration">${ICON.voice}</button>
      <button class="vctl on" data-v="cc" aria-label="Captions" title="Captions">${ICON.cc}</button>
      <button class="vctl vrate" data-v="rate" title="Speed">1×</button>
      <button class="vctl" data-v="full" aria-label="Full screen" title="Full screen">${ICON.full}</button>
    </div>
    <div class="vchapters">${chapters.map((c, i) => `<button data-ch="${i}"><b>${fmt(c.at)}</b>${c.title}</button>`).join('')}</div>
  </div>`;
  const $ = (s) => host.querySelector(s);
  const root = $('.vplayer'), svg = $('.vsvg'), cap = $('.vcap span'), capBox = $('.vcap');
  S('rect', { width: 1280, height: 720, fill: C.bg }, svg);
  const grid = S('g', { opacity: 0.06 }, svg);
  for (let x = 0; x <= 1280; x += 64) S('line', { x1: x, y1: 0, x2: x, y2: 720, stroke: '#fff' }, grid);
  for (let y = 0; y <= 720; y += 64) S('line', { x1: 0, y1: y, x2: 1280, y2: y, stroke: '#fff' }, grid);
  for (const sc of video.scenes) { sc.g = S('g', {}, svg); sc.draw = sc.build(sc.g); }

  // ---- state
  let t = 0, playing = false, rate = 1, voice = 'speechSynthesis' in window, ccOn = true, raf = 0, last = 0;
  let beatIdx = -1, speaking = false, utter = null, ended = false;
  const voices = () => speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'));
  const pickVoice = () => { const v = voices(); return v.find((x) => /Daniel|Serena|Kate|Arthur/.test(x.name)) || v.find((x) => x.lang === 'en-GB') || v.find((x) => /Samantha|Karen|Moira/.test(x.name)) || v[0]; };
  if (!voice) root.querySelector('[data-v="voice"]').hidden = true;

  function speak(text) {
    stopSpeech();
    if (!voice || !playing) return;
    utter = new SpeechSynthesisUtterance(text.replace(/e\.m\.f\./g, 'E M F').replace(/a\.c\./g, 'A C').replace(/d\.c\./g, 'D C').replace(/Φ/g, 'flux'));
    const v = pickVoice(); if (v) utter.voice = v;
    utter.rate = 0.98 * rate; utter.pitch = 1.02;
    utter.onend = utter.onerror = () => { speaking = false; };
    speaking = true;
    speechSynthesis.speak(utter);
  }
  function stopSpeech() { if ('speechSynthesis' in window) speechSynthesis.cancel(); speaking = false; utter = null; }

  function render() {
    const bi = Math.max(0, beats.findIndex((b) => t < b.end) === -1 ? beats.length - 1 : beats.findIndex((b) => t < b.end));
    for (const sc of video.scenes) {
      const on = t >= sc.start - 0.001 && (t < sc.end || (sc === video.scenes.at(-1)));
      sc.g.style.display = on ? '' : 'none';
      if (!on) continue;
      const lt = t - sc.start;
      const fade = Math.min(clamp(lt / 0.35), sc === video.scenes.at(-1) ? 1 : clamp((sc.end - t) / 0.3));
      sc.g.setAttribute('opacity', fade.toFixed(3));
      const P = (i, a = 0, b = 1) => { const B = sc.B[i]; const d = B.e - B.s; return clamp((lt - (B.s + a * d)) / ((b - a) * d || 1)); };
      sc.draw(lt, sc.B, P);
    }
    if (bi !== beatIdx) {
      beatIdx = bi;
      cap.textContent = beats[bi].text;
      cap.parentElement.classList.remove('in'); void cap.offsetWidth; cap.parentElement.classList.add('in');
      if (playing) speak(beats[bi].spoken);
      root.querySelectorAll('.vchapters button').forEach((b, i) => b.classList.toggle('on', t >= chapters[i].at && (i === chapters.length - 1 || t < chapters[i + 1].at)));
    }
    const f = t / total;
    $('.vfill').style.width = f * 100 + '%';
    $('.vknob').style.left = f * 100 + '%';
    $('.vtime').textContent = `${fmt(t)} / ${fmt(total)}`;
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (playing) {
      const b = beats[beatIdx];
      let nt = t + dt * rate;
      // Keep pictures and narration together: wait at the end of a caption until the voice finishes.
      if (voice && speaking && b && nt >= b.end - 0.05) nt = Math.min(t, b.end - 0.05);
      t = nt;
      if (t >= total) { t = total; setPlaying(false); ended = true; $('.vend').hidden = false; }
      render();
    }
    raf = requestAnimationFrame(frame);
  }
  function setPlaying(p) {
    playing = p;
    if (p && ended) { ended = false; t = 0; beatIdx = -1; $('.vend').hidden = true; }
    $('.vbig').hidden = true;
    const btn = root.querySelector('[data-v="toggle"]');
    btn.innerHTML = p ? ICON.pause : ICON.play; btn.setAttribute('aria-label', p ? 'Pause' : 'Play');
    root.classList.toggle('playing', p);
    if (p) { last = performance.now(); const b = beats[beatIdx]; if (b && voice) speak(b.text); }
    else stopSpeech();
  }
  function seek(nt) {
    const was = playing; stopSpeech();
    t = clamp(nt, 0, total - 0.01); ended = false; $('.vend').hidden = true; $('.vbig').hidden = true;
    beatIdx = -1; playing = false; render(); playing = was;
    if (was && voice) speak(beats[beatIdx].spoken);
  }

  // ---- controls
  root.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) { if (e.target.closest('.vsvg')) setPlaying(!playing); return; }
    if (b.classList.contains('vbig')) return setPlaying(true);
    if (b.dataset.ch) return seek(chapters[+b.dataset.ch].at + 0.01);
    switch (b.dataset.v) {
      case 'toggle': return setPlaying(!playing);
      case 'replay': return seek(0), setPlaying(true);
      case 'voice': voice = !voice; b.innerHTML = voice ? ICON.voice : ICON.mute; b.classList.toggle('off', !voice); if (!voice) stopSpeech(); else if (playing) speak(beats[beatIdx].spoken); return;
      case 'cc': ccOn = !ccOn; b.classList.toggle('on', ccOn); capBox.classList.toggle('hidden', !ccOn); return;
      case 'rate': rate = rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : rate === 1.5 ? 0.85 : 1; b.textContent = rate + '×'; if (playing && voice) speak(beats[beatIdx].spoken); return;
      case 'full': return document.fullscreenElement ? document.exitFullscreen() : root.requestFullscreen?.();
    }
  });
  root.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); setPlaying(!playing); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); seek(t + 5); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); seek(t - 5); }
    else if (e.key === 'f') root.requestFullscreen?.();
  });
  const track = $('.vtrack'), tip = $('.vtip');
  const at = (e) => { const r = track.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width) * total; };
  let drag = false;
  track.addEventListener('pointerdown', (e) => { drag = true; track.setPointerCapture(e.pointerId); seek(at(e)); });
  track.addEventListener('pointermove', (e) => {
    const s = at(e); if (drag) seek(s);
    const ch = chapters.filter((c) => c.at <= s).at(-1);
    tip.hidden = false; tip.textContent = `${fmt(s)} · ${ch?.title || ''}`; tip.style.left = (s / total) * 100 + '%';
  });
  track.addEventListener('pointerleave', () => { tip.hidden = true; });
  track.addEventListener('pointerup', () => { drag = false; });

  // Poster frame: the title fully drawn.
  t = Math.min(video.poster ?? 3, total); render(); t = 0; beatIdx = -1;
  $('.vtime').textContent = `0:00 / ${fmt(total)}`; $('.vfill').style.width = '0%'; $('.vknob').style.left = '0%';
  cap.textContent = beats[0].text;
  raf = requestAnimationFrame((n) => { last = n; frame(n); });
  if ('speechSynthesis' in window) speechSynthesis.getVoices();

  return () => { cancelAnimationFrame(raf); stopSpeech(); };
}
