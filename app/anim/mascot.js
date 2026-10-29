// Edu, the study buddy. An SVG character animated with GSAP that reacts to what you do.
import gsap from 'gsap';

const SVG = `
<svg viewBox="0 0 140 150" width="100%" height="100%" aria-hidden="true">
  <ellipse class="m-shadow" cx="70" cy="142" rx="34" ry="5" fill="#1C1917" opacity=".14"/>
  <g class="m-body">
    <g class="m-arm-l"><rect x="14" y="78" width="16" height="30" rx="8" fill="#EA580C"/></g>
    <g class="m-arm-r"><rect x="110" y="78" width="16" height="30" rx="8" fill="#EA580C"/></g>
    <path d="M70 34c27 0 44 15 44 45s-15 55-44 55-44-25-44-55 17-45 44-45z" fill="#F97316"/>
    <ellipse cx="70" cy="104" rx="25" ry="22" fill="#FDBA74"/>
    <g class="m-eyes">
      <g class="m-eye"><ellipse cx="55" cy="74" rx="10" ry="12" fill="#fff"/><circle class="m-pupil" cx="56" cy="76" r="5.5" fill="#1C1917"/><circle cx="58" cy="73" r="1.8" fill="#fff"/></g>
      <g class="m-eye"><ellipse cx="85" cy="74" rx="10" ry="12" fill="#fff"/><circle class="m-pupil" cx="86" cy="76" r="5.5" fill="#1C1917"/><circle cx="88" cy="73" r="1.8" fill="#fff"/></g>
    </g>
    <ellipse class="m-cheek" cx="45" cy="90" rx="6" ry="3.5" fill="#FB7185" opacity=".45"/>
    <ellipse class="m-cheek" cx="95" cy="90" rx="6" ry="3.5" fill="#FB7185" opacity=".45"/>
    <path class="m-mouth m-smile" d="M60 92q10 9 20 0" stroke="#1C1917" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path class="m-mouth m-grin" d="M57 90q13 16 26 0z" fill="#1C1917" opacity="0"/>
    <path class="m-mouth m-frown" d="M61 97q9-7 18 0" stroke="#1C1917" stroke-width="3.5" fill="none" stroke-linecap="round" opacity="0"/>
    <ellipse class="m-mouth m-o" cx="70" cy="95" rx="4" ry="5" fill="#1C1917" opacity="0"/>
    <g class="m-cap">
      <path d="M70 14l40 14-40 14-40-14z" fill="#1C1917"/>
      <path d="M50 35v10c0 5 9 8 20 8s20-3 20-8V35l-20 7z" fill="#292524"/>
      <g class="m-tassel"><path d="M104 30v18" stroke="#FDBA74" stroke-width="2.5"/><circle cx="104" cy="50" r="3.5" fill="#FDBA74"/></g>
    </g>
  </g>
</svg>`;

export function createMascot(host) {
  host.innerHTML = `<div class="mascot-bubble" hidden></div><div class="mascot-figure">${SVG}</div>`;
  const q = (s) => host.querySelector(s);
  const qa = (s) => host.querySelectorAll(s);
  const bubble = q('.mascot-bubble'), body = q('.m-body'), shadow = q('.m-shadow');
  const pupils = qa('.m-pupil'), eyes = qa('.m-eye');
  const armL = q('.m-arm-l'), armR = q('.m-arm-r');
  const mouths = { smile: q('.m-smile'), grin: q('.m-grin'), frown: q('.m-frown'), o: q('.m-o') };
  gsap.set([armL, armR], { transformOrigin: '50% 10%' });
  gsap.set(body, { transformOrigin: '50% 100%' });
  gsap.set(q('.m-tassel'), { transformOrigin: '104px 30px' });

  // idle: breathe, blink, tassel sway
  const idle = gsap.timeline({ repeat: -1, yoyo: true }).to(body, { scaleY: 0.975, scaleX: 1.015, duration: 1.4, ease: 'sine.inOut' });
  gsap.to(q('.m-tassel'), { rotation: 12, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  let blinkCall;
  const blink = () => { gsap.to(eyes, { scaleY: 0.1, transformOrigin: '50% 60%', duration: 0.08, yoyo: true, repeat: 1 }); blinkCall = gsap.delayedCall(2.5 + Math.random() * 3, blink); };
  blinkCall = gsap.delayedCall(2, blink);

  let current = null, bubbleCall = null;
  const mouth = (m) => Object.entries(mouths).forEach(([k, el]) => gsap.to(el, { opacity: k === m ? 1 : 0, duration: 0.15 }));
  const look = (x, y) => gsap.to(pupils, { x, y, duration: 0.3, ease: 'power2.out' });
  const reset = () => { mouth('smile'); look(0, 0); gsap.to([armL, armR], { rotation: 0, duration: 0.4 }); gsap.to(body, { y: 0, rotation: 0, duration: 0.4 }); };

  function say(text, ms = 3800) {
    if (!text) { bubble.hidden = true; return; }
    bubble.textContent = text; bubble.hidden = false;
    gsap.fromTo(bubble, { opacity: 0, y: 8, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(2)' });
    bubbleCall?.kill();
    bubbleCall = gsap.delayedCall(ms / 1000, () => gsap.to(bubble, { opacity: 0, duration: 0.3, onComplete: () => (bubble.hidden = true) }));
  }

  function confetti(n = 22) {
    const colors = ['#F97316', '#3B7DDD', '#22C55E', '#FACC15', '#FB7185'];
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.className = 'confetti';
      d.style.background = colors[i % colors.length];
      host.appendChild(d);
      gsap.fromTo(d, { x: 60, y: 60, rotation: 0, opacity: 1 }, {
        x: 60 + (Math.random() - 0.5) * 260, y: -40 - Math.random() * 120, rotation: Math.random() * 720,
        duration: 0.9 + Math.random() * 0.6, ease: 'power2.out',
        onComplete: () => gsap.to(d, { y: '+=160', opacity: 0, duration: 0.8, ease: 'power1.in', onComplete: () => d.remove() }),
      });
    }
  }

  const states = {
    idle: () => reset(),
    happy: () => {
      mouth('grin');
      gsap.timeline({ onComplete: reset })
        .to(body, { scaleY: 0.85, scaleX: 1.1, duration: 0.12 })
        .to(body, { y: -26, scaleY: 1.08, scaleX: 0.95, duration: 0.22, ease: 'power2.out' })
        .to([armL, armR], { rotation: (i) => (i ? -150 : 150), duration: 0.2 }, '<')
        .to(shadow, { scale: 0.7, opacity: 0.08, transformOrigin: '50% 50%', duration: 0.22 }, '<')
        .to(body, { y: 0, scaleY: 1, scaleX: 1, duration: 0.3, ease: 'bounce.out' })
        .to(shadow, { scale: 1, opacity: 0.14, duration: 0.3 }, '<')
        .to({}, { duration: 0.6 });
    },
    sad: () => {
      mouth('frown'); look(0, 3);
      gsap.timeline({ onComplete: reset })
        .to(body, { y: 6, scaleY: 0.94, duration: 0.3 })
        .to(body, { rotation: -4, duration: 0.15, yoyo: true, repeat: 3 })
        .to({}, { duration: 0.8 });
    },
    think: () => {
      mouth('o'); look(3, -4);
      gsap.timeline({ onComplete: reset }).to(armR, { rotation: -120, duration: 0.35 }).to(body, { rotation: 3, duration: 0.4 }, '<').to({}, { duration: 1.6 });
    },
    wave: () => {
      mouth('smile');
      gsap.timeline({ onComplete: reset }).to(armR, { rotation: -150, duration: 0.25 }).to(armR, { rotation: -110, duration: 0.18, yoyo: true, repeat: 4 }).to({}, { duration: 0.3 });
    },
    celebrate: () => {
      mouth('grin'); confetti();
      const tl = gsap.timeline({ onComplete: reset });
      for (let i = 0; i < 3; i++) {
        tl.to(body, { y: -22, rotation: i % 2 ? -8 : 8, duration: 0.2, ease: 'power2.out' })
          .to([armL, armR], { rotation: (k) => (k ? -160 : 160), duration: 0.2 }, '<')
          .to(body, { y: 0, rotation: 0, duration: 0.25, ease: 'bounce.out' });
      }
    },
    nod: () => { gsap.timeline({ onComplete: reset }).to(body, { rotation: 4, duration: 0.12, yoyo: true, repeat: 1 }); },
  };

  return {
    react(state, text) { current = state; states[state]?.(); if (text) say(text); },
    say,
    destroy() { idle.kill(); blinkCall?.kill(); bubbleCall?.kill(); gsap.killTweensOf(host.querySelectorAll('*')); host.innerHTML = ''; },
  };
}
