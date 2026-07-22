(function () {
  "use strict";
  const canvas = document.getElementById("sphere-canvas");
  const ctx = canvas.getContext("2d");

  const WORDS = [
    "Chloroplast",
    "Elodea",
    "Epidermis",
    "Epithelial",
    "Stomata",
    "Vacuole",
    "Ribosomes",
    "Nucleus",
    "Cytoplasm",
    "Erythrocytes",
    "Neurons",
    "Leukocytes",
    "Thrombocytes",
    "Cell",
  ];

  let W, H, R;
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.min(W, H) * 0.42;
  }
  resize();
  window.addEventListener("resize", resize);

  const PHI = (1 + Math.sqrt(5)) / 2;
  const norm = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const mid = (a, b) => norm(a.map((c, i) => (c + b[i]) / 2));

  let verts = [
    [-1, PHI, 0],
    [1, PHI, 0],
    [-1, -PHI, 0],
    [1, -PHI, 0],
    [0, -1, PHI],
    [0, 1, PHI],
    [0, -1, -PHI],
    [0, 1, -PHI],
    [PHI, 0, -1],
    [PHI, 0, 1],
    [-PHI, 0, -1],
    [-PHI, 0, 1],
  ].map(norm);

  let faces = [
    [0, 11, 5],
    [0, 5, 1],
    [0, 1, 7],
    [0, 7, 10],
    [0, 10, 11],
    [1, 5, 9],
    [5, 11, 4],
    [11, 10, 2],
    [10, 7, 6],
    [7, 1, 8],
    [3, 9, 4],
    [3, 4, 2],
    [3, 2, 6],
    [3, 6, 8],
    [3, 8, 9],
    [4, 9, 5],
    [2, 4, 11],
    [6, 2, 10],
    [8, 6, 7],
    [9, 8, 1],
  ];

  for (let s = 0; s < 2; s++) {
    const nf = [],
      cache = {};
    const getMid = (i, j) => {
      const k = [Math.min(i, j), Math.max(i, j)].join("_");
      if (!cache[k]) {
        cache[k] = verts.length;
        verts.push(mid(verts[i], verts[j]));
      }
      return cache[k];
    };
    for (const [a, b, c] of faces) {
      const ab = getMid(a, b),
        bc = getMid(b, c),
        ca = getMid(c, a);
      nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = nf;
  }

  const edgeSet = new Set(),
    edges = [];
  for (const [a, b, c] of faces) {
    for (const [i, j] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const k = [Math.min(i, j), Math.max(i, j)].join("_");
      if (!edgeSet.has(k)) {
        edgeSet.add(k);
        edges.push([i, j]);
      }
    }
  }

  const labels = WORDS.map((word, i) => {
    const ga = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (i / (WORDS.length - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = ga * i;
    return {
      word,
      x: r * Math.cos(th),
      y,
      z: r * Math.sin(th),
      opacity: 0,
    };
  });

  let rotX = 0.32,
    rotY = 0,
    velX = 0,
    velY = 0.0032;
  let drag = false,
    lmx,
    lmy;

  canvas.addEventListener("mousedown", (e) => {
    drag = true;
    lmx = e.clientX;
    lmy = e.clientY;
  });
  window.addEventListener("mouseup", () => {
    drag = false;
  });
  window.addEventListener("mousemove", (e) => {
    if (!drag) return;
    velY = (e.clientX - lmx) * 0.003;
    velX = (e.clientY - lmy) * 0.003;
    lmx = e.clientX;
    lmy = e.clientY;
  });
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      drag = true;
      lmx = e.touches[0].clientX;
      lmy = e.touches[0].clientY;
    },
    { passive: false },
  );
  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      if (!drag) return;
      const t = e.touches[0];
      velY = (t.clientX - lmx) * 0.004;
      velX = (t.clientY - lmy) * 0.004;
      lmx = t.clientX;
      lmy = t.clientY;
    },
    { passive: false },
  );
  window.addEventListener("touchend", () => {
    drag = false;
  });

  function rotV(v, ax, ay) {
    let [x, y, z] = v;
    const x2 = x * Math.cos(ay) + z * Math.sin(ay);
    const z2 = -x * Math.sin(ay) + z * Math.cos(ay);
    const y2 = y * Math.cos(ax) - z2 * Math.sin(ax);
    const z3 = y * Math.sin(ax) + z2 * Math.cos(ax);
    return [x2, y2, z3];
  }

  function projV(v) {
    const cx = W / 2,
      cy = H / 2,
      p = 3.8;
    const sc = (R * p) / (p + v[2]);
    return { sx: cx + v[0] * sc, sy: cy + v[1] * sc, depth: v[2] };
  }

  const EC = [
    "rgba(180,180,158,",
    "rgba(201,161,75,",
    "rgba(152,152,138,",
    // "rgba(135,222,158,",
    // "rgba(95,210,130,",
    // "rgba(65,185,100,",
  ];

  function frame() {
    requestAnimationFrame(frame);
    if (!drag) {
      velY += (0.0032 - velY) * 0.04;
      velX += -velX * 0.04;
    }
    rotY += velY;
    rotX += velX;
    ctx.clearRect(0, 0, W, H);

    const pv = verts.map((v) => projV(rotV(v, rotX, rotY)));

    const se = edges
      .map(([i, j]) => ({ i, j, d: (pv[i].depth + pv[j].depth) / 2 }))
      .sort((a, b) => a.d - b.d);
    for (const { i, j, d } of se) {
      const t = (d + 1) / 2,
        a = (0.06 + t * 0.22).toFixed(2);
      ctx.beginPath();
      ctx.moveTo(pv[i].sx, pv[i].sy);
      ctx.lineTo(pv[j].sx, pv[j].sy);
      ctx.strokeStyle = EC[(i + j) % 3] + a + ")";
      ctx.lineWidth = 0.65 + t * 0.55;
      ctx.stroke();
    }

    for (const lb of labels) {
      const rv = rotV([lb.x, lb.y, lb.z], rotX, rotY);
      const p = projV(rv);
      const front = (rv[2] + 1) / 2;
      const isCell = lb.word === "Cell";
      const tgt = isCell
        ? 0.5 + front * 0.5
        : front < 0.35
          ? 0
          : (front - 0.35) * 0.9;
      lb.opacity += (tgt - lb.opacity) * 0.05;
      if (lb.opacity < 0.01) continue;
      const fs = isCell
        ? Math.round(14 + front * 8)
        : Math.round(10 + front * 5);
      ctx.save();
      ctx.globalAlpha = lb.opacity;
      ctx.font = `${isCell ? "600" : "400"} ${fs}px 'Inter',sans-serif`;
      ctx.fillStyle = isCell ? "#ffffff" : "#9a9a82";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(lb.word, p.sx, p.sy);
      ctx.restore();
    }
  }
  frame();
})();
