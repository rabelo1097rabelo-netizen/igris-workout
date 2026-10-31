const app = {
  workout: null,
  igrisState: {
    time: 0,
    showSword: true,
    slashTimer: 0,
    slashDuration: 0.65,
    ariseTimer: 0,
    ariseDuration: 2.2,
    windBoost: 1.2,
    blinkTimer: 0,
    armDeg: 0,
    prevArmDeg: 0,
    lightningIntensity: 0.35,
    eyeDx: 0,
    eyeDy: 0,
    touchX: 0,
    touchY: 0,
    particles: []
  },
  layers: {},

  init() {
    this.registerServiceWorker();
    this.initIgrisRig();
    this.fetchWorkout();
    setInterval(() => this.fetchWorkout(true), 20000);
  },

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  },

  async fetchWorkout(silent = false) {
    try {
      const res = await fetch('/api/workout');
      const data = await res.json();
      if (data && data.workout) {
        this.workout = data.workout;
        this.renderWorkout();
      }
    } catch (e) {
      if (!silent) console.error('Erro ao buscar treino:', e);
    }
  },

  renderWorkout() {
    if (!this.workout) return;
    const w = this.workout;

    const titleEl = document.getElementById('quest-workout-title');
    if (titleEl) titleEl.innerText = `${w.sport_type ? w.sport_type + ' • ' : ''}${w.title}`;

    const durEl = document.getElementById('quest-duration');
    if (durEl) durEl.innerText = `${w.duration_mins || 0} min`;

    const distEl = document.getElementById('quest-distance');
    if (distEl) distEl.innerText = w.distance_km ? `${w.distance_km} km` : '--';

    const paceEl = document.getElementById('quest-pace');
    if (paceEl) paceEl.innerText = w.target_pace || 'Z2 Base';

    const hrEl = document.getElementById('quest-hr');
    if (hrEl) hrEl.innerText = w.target_hr_bpm ? `${w.target_hr_bpm} bpm` : '150 bpm';

    const stratEl = document.getElementById('quest-strategy');
    if (stratEl) stratEl.innerText = w.ai_strategy || 'Execute o treino mantendo a cadência e zonas corretas.';

    const rankEl = document.getElementById('hunter-rank-display');
    if (rankEl) rankEl.innerText = `${w.hunter_rank || 'RANK B'} • LV ${w.hunter_level || 24}`;

    const expEl = document.getElementById('hunter-exp-text');
    if (expEl) expEl.innerText = `EXP ${w.exp_progress || 75}%`;

    if (w.attributes) {
      document.getElementById('attr-str').innerText = w.attributes.str || 40;
      document.getElementById('attr-agi').innerText = w.attributes.agi || 55;
      document.getElementById('attr-vit').innerText = w.attributes.vit || 60;
      document.getElementById('attr-per').innerText = w.attributes.per || 35;
      document.getElementById('attr-int').innerText = w.attributes.int || 28;
    }

    const btnSend = document.getElementById('btn-send-garmin');
    if (btnSend && w.garmin_uploaded) {
      btnSend.innerHTML = '<span>✓ Já no Garmin Connect & Relógio</span>';
      btnSend.style.background = 'rgba(16, 185, 129, 0.2)';
      btnSend.style.border = '1px solid #10B981';
      btnSend.style.color = '#34D399';
    }

    const btnArise = document.getElementById('btn-arise-complete');
    if (btnArise && w.is_completed) {
      btnArise.innerHTML = '<span>🏆 MISSÃO CONCLUÍDA (SOMBRAS EXTRAÍDAS)</span>';
      btnArise.classList.add('completed');
    }
  },

  async sendToGarmin() {
    this.showToast('Enviando treino para o Garmin Connect & Forerunner 965...');
    this.triggerIgrisSlash();
    this.setSpeech('"Comandante, enviando estratégia aos servidores do Garmin!"');

    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_to_garmin' })
      });
      const data = await res.json();
      if (data.success) {
        this.workout = data.workout;
        this.renderWorkout();
        this.showToast('✓ Sincronizado com o relógio Garmin com sucesso!');
      }
    } catch (e) {
      this.showToast('Erro de conexão ao enviar para o Garmin.');
    }
  },

  async completeWorkout() {
    this.triggerIgrisArise();
    this.setSpeech('"ERGA-SE! O poder da sua corrida fortaleceu o Exército!"');
    this.showToast('⚔️ ERGA-SE! Treino concluído e atributos aumentados!');

    try {
      const res = await fetch('/api/workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete_workout' })
      });
      const data = await res.json();
      if (data.success) {
        this.workout = data.workout;
        this.renderWorkout();
      }
    } catch (e) {
      console.error(e);
    }
  },

  triggerTouchReaction() {
    this.triggerIgrisSlash();
    const phrases = [
      '"Estou pronto para a batalha, Meu Senhor!"',
      '"A Espada do Rei Demônio corta qualquer preguiça!"',
      '"Vamos ao treino. O Monarca das Sombras não descansa."',
      '"Cada quilômetro percorrido ergue novos cavaleiros."'
    ];
    this.setSpeech(phrases[Math.floor(Math.random() * phrases.length)]);
  },

  triggerIgrisSlash() {
    this.igrisState.slashTimer = this.igrisState.slashDuration;
    this.igrisState.windBoost = 2.2;
    this.igrisState.lightningIntensity = 1.0;
    this.spawnParticles(16, '#00E5FF');
  },

  triggerIgrisArise() {
    this.igrisState.ariseTimer = this.igrisState.ariseDuration;
    this.igrisState.windBoost = 3.5;
    this.igrisState.lightningIntensity = 1.0;
    this.spawnParticles(35, '#A855F7');
    this.spawnParticles(20, '#00E5FF');
  },

  spawnParticles(count, color) {
    for (let i = 0; i < count; i++) {
      this.igrisState.particles.push({
        x: 0.5 + (Math.random() - 0.5) * 0.4,
        y: 0.5 + (Math.random() - 0.5) * 0.4,
        vx: (Math.random() - 0.5) * 0.04,
        vy: -Math.random() * 0.05 - 0.01,
        size: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.03 + 0.015,
        color: color
      });
    }
  },

  setSpeech(text) {
    const el = document.getElementById('igris-speech');
    if (el) el.innerText = text;
  },

  showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
  },

  // -------------------------------------------------------------
  // CHIBI IGRIS 60 FPS CANVAS ENGINE
  // -------------------------------------------------------------
  initIgrisRig() {
    const canvas = document.getElementById('igris-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const loadImg = (src) => {
      const img = new Image();
      img.src = src;
      return img;
    };

    this.layers = {
      plume: loadImg('/img/shadows/chibi_rig_plume.png'),
      body: loadImg('/img/shadows/chibi_rig_body.png'),
      head: loadImg('/img/shadows/chibi_rig_head.png'),
      armWave: loadImg('/img/shadows/chibi_rig_arm_wave.png'),
      armSword: loadImg('/img/shadows/chibi_rig_arm_sword.png')
    };

    canvas.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        const rect = canvas.getBoundingClientRect();
        this.igrisState.touchX = e.touches[0].clientX - rect.left;
        this.igrisState.touchY = e.touches[0].clientY - rect.top;
      }
    });

    const loop = () => {
      this.renderIgrisFrame(ctx, canvas);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  },

  renderIgrisFrame(ctx, canvas) {
    const st = this.igrisState;
    const layers = this.layers;
    const dt = 0.016;
    st.time += dt;

    if (st.slashTimer > 0) st.slashTimer = Math.max(0, st.slashTimer - dt);
    if (st.ariseTimer > 0) st.ariseTimer = Math.max(0, st.ariseTimer - dt);
    if (st.windBoost > 1.0) st.windBoost = Math.max(1.0, st.windBoost - dt * 0.8);

    const cw = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, cw, ch);

    const rigW = 420;
    const rigH = 580;
    const scale = Math.min(cw / rigW, ch / rigH) * 0.90;
    const bobY = Math.sin(st.time * 2.5) * 4.0;
    const breath = Math.sin(st.time * 2.8);

    // Aura de fundo
    const auraColor = st.ariseTimer > 0 ? 'rgba(168, 85, 247, 0.4)' : 'rgba(0, 229, 255, 0.22)';
    const grad = ctx.createRadialGradient(cw * 0.52, ch * 0.52 + bobY * 0.4, 6, cw * 0.52, ch * 0.52 + bobY * 0.4, cw * 0.46);
    grad.addColorStop(0, auraColor);
    grad.addColorStop(0.6, 'rgba(15, 23, 42, 0.35)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cw * 0.52, ch * 0.52 + bobY * 0.4, cw * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // Partículas
    st.particles.forEach((p, idx) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life > 0) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x * cw, p.y * ch, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });
    st.particles = st.particles.filter(p => p.life > 0);

    ctx.save();
    ctx.translate(cw * 0.5, ch * 0.52 + bobY * scale);
    ctx.scale(scale, scale);
    ctx.translate(-rigW * 0.5, -rigH * 0.5);

    // 1. Plume
    if (layers.plume.complete) {
      const numP = 20;
      const shP = rigH / numP;
      const pAmp = 10.0 + st.windBoost * 8.0;
      for (let i = 0; i < numP; i++) {
        const y0 = i * shP;
        const frac = Math.max(0, (i - 2) / (numP - 2));
        const dx = Math.sin(st.time * 4.8 - i * 0.36) * pAmp * Math.pow(frac, 1.35);
        ctx.drawImage(layers.plume, 0, y0, rigW, shP + 1.5, dx, y0, rigW, shP + 1.5);
      }
    }

    // 2. Body
    if (layers.body.complete) {
      const splitY = 385;
      ctx.save();
      ctx.translate(225, 290);
      ctx.scale(1.0 + breath * 0.018, 1.0 - breath * 0.012);
      ctx.translate(-225, -290);
      ctx.drawImage(layers.body, 0, 0, rigW, splitY, 0, 0, rigW, splitY + 1);
      ctx.restore();

      const numC = 16;
      const capeH = rigH - splitY;
      const shC = capeH / numC;
      const cAmp = 9.5 + st.windBoost * 7.5;
      for (let i = 0; i < numC; i++) {
        const y0 = splitY + i * shC;
        const frac = (i + 1) / numC;
        const wave = Math.sin(st.time * 4.0 - i * 0.42) * cAmp * Math.pow(frac, 1.4);
        const stretchW = 1.0 + Math.sin(st.time * 3.5 - i * 0.3) * 0.036 * frac;
        const dw = rigW * stretchW;
        const ox = (rigW - dw) * 0.5 + wave;
        ctx.drawImage(layers.body, 0, y0, rigW, shC + 1.5, ox, y0, dw, shC + 1.5);
      }
    }

    // 3. Arm & Sword
    if (layers.armSword.complete) {
      let armAngle = 0;
      if (st.ariseTimer > 0) {
        // Movimento de ERGA-SE: Igris ergue a espada solenemente para o alto
        armAngle = -65.0 * Math.sin((1.0 - st.ariseTimer / st.ariseDuration) * Math.PI);
      } else if (st.slashTimer > 0) {
        const prog = 1.0 - (st.slashTimer / st.slashDuration);
        armAngle = prog < 0.3 ? -35.0 * (prog / 0.3) : 60.0 * (1.0 - (prog - 0.3) / 0.7);
      } else {
        armAngle = Math.sin(st.time * 3.0) * 8.5;
      }

      ctx.save();
      ctx.translate(158, 320);
      ctx.rotate((-armAngle * Math.PI) / 180.0);
      ctx.translate(-158, -320);
      ctx.drawImage(layers.armSword, 0, 0);
      ctx.restore();
    }

    // 4. Head & Dragon Eyes
    if (layers.head.complete) {
      ctx.save();
      ctx.translate(225, 255 + breath * 2.5);
      ctx.translate(-225, -255);
      ctx.drawImage(layers.head, 0, 0);

      // Olhos Brancos Glaciais com pupila suave
      [[192.0, 188.0], [251.0, 188.0]].forEach(([ex, ey], idxE) => {
        // Sclera branca pura
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 12.6, 10.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cicatriz estelar vertical no olho direito
        if (idxE === 1) {
          ctx.fillStyle = '#F5FDFF';
          ctx.beginPath();
          ctx.moveTo(ex, ey - 24);
          ctx.lineTo(ex + 2.5, ey - 5);
          ctx.lineTo(ex + 14, ey);
          ctx.lineTo(ex + 2.5, ey + 5);
          ctx.lineTo(ex, ey + 24);
          ctx.lineTo(ex - 2.5, ey + 5);
          ctx.lineTo(ex - 14, ey);
          ctx.lineTo(ex - 2.5, ey - 5);
          ctx.closePath();
          ctx.fill();
        }

        // Pupila suave azul-celeste
        ctx.fillStyle = '#40ACEB';
        ctx.beginPath();
        ctx.ellipse(ex, ey, 3.2, 4.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brilho especular
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(ex - 1.2, ey - 1.4, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    ctx.restore();
  }
};

document.addEventListener('DOMContentLoaded', () => app.init());
