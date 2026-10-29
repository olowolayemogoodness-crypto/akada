// Small 2D plotting helper for the maths explainers (crisp on Retina screens).
export function plot(stageEl) {
  const canvas = document.createElement('canvas');
  stageEl.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const view = { xmin: -6, xmax: 6, ymin: -6, ymax: 10 };
  let W = 600, H = 340;
  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = stageEl.clientWidth || 600; H = stageEl.clientHeight || 340;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const X = (x) => ((x - view.xmin) / (view.xmax - view.xmin)) * W;
  const Y = (y) => H - ((y - view.ymin) / (view.ymax - view.ymin)) * H;
  const api = {
    view, ctx, X, Y, get W() { return W; }, get H() { return H; }, fit,
    clear() {
      ctx.fillStyle = '#FAF8F5'; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = '#EEE8E2'; ctx.lineWidth = 1;
      for (let x = Math.ceil(view.xmin); x <= view.xmax; x++) { ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); }
      for (let y = Math.ceil(view.ymin); y <= view.ymax; y++) { ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); ctx.stroke(); }
      ctx.strokeStyle = '#A8A29E'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
      ctx.fillStyle = '#78716C'; ctx.font = '600 11px "Plus Jakarta Sans", system-ui';
      for (let x = Math.ceil(view.xmin); x <= view.xmax; x += 2) if (x) ctx.fillText(x, X(x) + 3, Y(0) + 13);
      for (let y = Math.ceil(view.ymin); y <= view.ymax; y += 2) if (y) ctx.fillText(y, X(0) + 5, Y(y) - 3);
    },
    curve(f, color = '#F97316', width = 3.5) {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineJoin = 'round'; ctx.beginPath();
      let started = false;
      for (let px = 0; px <= W; px += 2) {
        const x = view.xmin + (px / W) * (view.xmax - view.xmin), y = f(x);
        if (!Number.isFinite(y) || y < view.ymin - 50 || y > view.ymax + 50) { started = false; continue; }
        if (!started) { ctx.moveTo(px, Y(y)); started = true; } else ctx.lineTo(px, Y(y));
      }
      ctx.stroke();
    },
    line(x1, y1, x2, y2, color = '#1C1917', width = 2, dash = []) {
      ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(X(x1), Y(y1)); ctx.lineTo(X(x2), Y(y2)); ctx.stroke(); ctx.setLineDash([]);
    },
    dot(x, y, color = '#1C1917', r = 6) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X(x), Y(y), r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); },
    text(t, x, y, color = '#1C1917', dx = 8, dy = -8) {
      ctx.font = '700 13px "Plus Jakarta Sans", system-ui';
      const w = ctx.measureText(t).width;
      ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.roundRect(X(x) + dx - 5, Y(y) + dy - 15, w + 10, 21, 6); ctx.fill();
      ctx.fillStyle = color; ctx.fillText(t, X(x) + dx, Y(y) + dy);
    },
  };
  fit();
  return api;
}
