// Animated worked example: steps appear one at a time, key numbers pop, the answer is highlighted.
import gsap from 'gsap';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Wrap numbers (with units/powers) so they can be highlighted.
const mark = (s) => esc(s).replace(/(\d+(?:[.,]\d+)?(?:\s?(?:m\/s²|m\/s|m|s|g|kg|N|V|A|C|J|Hz|dm³|cm³|mol|%|°))?)/g, '<span class="hl">$1</span>');

export function mountSteps(section, example) {
  section.innerHTML = `
    <div class="row between wrap gap"><div class="eyebrow">Worked example</div>
      <div class="row gap"><button class="btn ghost sm" data-s="play">Play</button><button class="btn ghost sm" data-s="replay">Replay</button></div></div>
    <div class="ws-q">${esc(example.q)}</div>
    <ol class="ws-steps">${example.steps.map((s, i) => `<li class="ws-step${i === example.steps.length - 1 ? ' ws-final' : ''}"><span class="ws-n">${i + 1}</span><span>${mark(s)}</span></li>`).join('')}</ol>
    <div class="ws-progress"><i></i></div>`;
  const steps = section.querySelectorAll('.ws-step');
  const bar = section.querySelector('.ws-progress i');
  const playBtn = section.querySelector('[data-s="play"]');
  const tl = gsap.timeline({ paused: true, onUpdate: () => { bar.style.width = (tl.progress() * 100).toFixed(1) + '%'; }, onComplete: () => (playBtn.textContent = 'Play') });
  gsap.set(steps, { opacity: 0.18, y: 10 });
  steps.forEach((st, i) => {
    const hls = st.querySelectorAll('.hl');
    tl.to(st, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out' })
      .fromTo(st.querySelector('.ws-n'), { scale: 0.4, backgroundColor: '#F5EFE9' }, { scale: 1, backgroundColor: '#F97316', duration: 0.35, ease: 'back.out(3)' }, '<')
      .fromTo(hls, { color: '#1C1917', scale: 1 }, { color: '#C2410C', scale: 1.18, duration: 0.25, stagger: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '-=0.1');
    if (i === steps.length - 1) tl.fromTo(st, { boxShadow: '0 0 0 0 rgba(249,115,22,0)' }, { boxShadow: '0 0 0 6px rgba(249,115,22,.25)', duration: 0.5, yoyo: true, repeat: 1 });
    tl.to({}, { duration: 1.1 });
  });
  playBtn.addEventListener('click', () => {
    if (tl.isActive()) { tl.pause(); playBtn.textContent = 'Play'; }
    else { if (tl.progress() === 1) tl.restart(); else tl.play(); playBtn.textContent = 'Pause'; }
  });
  section.querySelector('[data-s="replay"]').addEventListener('click', () => { tl.restart(); playBtn.textContent = 'Pause'; });
  // Start playing when the example scrolls into view.
  const io = new IntersectionObserver((es) => { if (es[0].isIntersecting && tl.progress() === 0) { tl.play(); playBtn.textContent = 'Pause'; io.disconnect(); } }, { threshold: 0.5 });
  io.observe(section);
  return () => { io.disconnect(); tl.kill(); };
}
