(() => {
  'use strict';

  // ヒーロー見出し：一文字ずつ表示（span内テキストを .ch に分割し遅延を段付け）
  let chIndex = 0;
  document.querySelectorAll('.hero-area .text > span').forEach((span) => {
    const chars = span.textContent.split('');
    span.textContent = '';
    chars.forEach((c) => {
      const ch = document.createElement('span');
      ch.className = 'ch';
      ch.textContent = c;
      ch.style.transitionDelay = (0.2 + chIndex * 0.09).toFixed(2) + 's';
      span.appendChild(ch);
      chIndex += 1;
    });
  });

  // セクション英字ラベル：一文字ずつ表示（スクロール到達 .active で発火）
  document.querySelectorAll('.sec-en').forEach((el) => {
    const chars = el.textContent.split('');
    el.textContent = '';
    chars.forEach((c, i) => {
      const ch = document.createElement('span');
      ch.className = 'ch';
      ch.textContent = c === ' ' ? '\u00A0' : c;
      ch.style.transitionDelay = (i * 0.05).toFixed(2) + 's';
      el.appendChild(ch);
    });
    el.classList.add('js-active');
  });

  // 説明文：左→右のリビール（スクロール到達 .active で発火）
  document.querySelectorAll('.problem-lead, .works-lead, .clients-lead, .reason-lead, .pricing-lead, .contact-lead').forEach((el) => {
    // clip-pathを本体に掛けるとIntersectionObserverが交差0と判定するため内側spanに掛ける
    el.innerHTML = '<span class="lead-clip">' + el.innerHTML + '</span>';
    el.classList.add('lead-reveal', 'js-active');
  });

  // 実績カルーセル：自動スクロール（右→左）＋マウスドラッグ移動
  const worksTrack = document.querySelector('.works-track');
  if (worksTrack) {
    const items = Array.from(worksTrack.children);
    items.forEach((li) => {
      const clone = li.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('img').forEach((im) => im.setAttribute('alt', ''));
      worksTrack.appendChild(clone);
    });

    const carousel = worksTrack.parentElement;
    const worksReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const SPEED = worksReduce ? 0 : 80; // px/s
    let offset = 0;
    let half = 0;
    let dragging = false;
    let hovering = false;
    let startX = 0;
    let startOffset = 0;

    const measure = () => { half = worksTrack.scrollWidth / 2; };
    measure();
    window.addEventListener('resize', measure);

    carousel.addEventListener('mouseenter', () => { hovering = true; });
    carousel.addEventListener('mouseleave', () => { hovering = false; });
    carousel.addEventListener('pointerdown', (e) => {
      dragging = true;
      startX = e.clientX;
      startOffset = offset;
      carousel.classList.add('is-dragging');
      carousel.setPointerCapture(e.pointerId);
    });
    carousel.addEventListener('pointermove', (e) => {
      if (dragging) offset = startOffset + (e.clientX - startX);
    });
    const endDrag = () => { dragging = false; carousel.classList.remove('is-dragging'); };
    carousel.addEventListener('pointerup', endDrag);
    carousel.addEventListener('pointercancel', endDrag);

    let prevT = performance.now();
    const worksTick = (now) => {
      const dt = Math.min((now - prevT) / 1000, 0.1);
      prevT = now;
      if (!dragging && !hovering) offset -= SPEED * dt;
      if (half > 0) offset = -((((-offset) % half) + half) % half);
      worksTrack.style.transform = 'translateX(' + offset.toFixed(2) + 'px)';
      requestAnimationFrame(worksTick);
    };
    requestAnimationFrame(worksTick);
  }

  // ヒーロー画像クリックで実績ブロックへ
  const heroClickArea = document.querySelector('.hero-image');
  if (heroClickArea) {
    heroClickArea.setAttribute('role', 'link');
    heroClickArea.setAttribute('tabindex', '0');
    heroClickArea.setAttribute('aria-label', '実績を見る');
    const goWorks = () => {
      const works = document.getElementById('works');
      if (works) works.scrollIntoView({ behavior: 'smooth' });
    };
    heroClickArea.addEventListener('click', goWorks);
    heroClickArea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goWorks(); }
    });
  }

  // オープニング（ヒーロー段階出現）：画像ロード待ち→ we-ready
  const heroImg = document.querySelector('.hero-image img');
  const start = () => document.documentElement.classList.add('we-ready');
  if (heroImg && !heroImg.complete) {
    let done = false;
    const go = () => { if (!done) { done = true; start(); } };
    heroImg.addEventListener('load', go, { once: true });
    heroImg.addEventListener('error', go, { once: true });
    setTimeout(go, 3000);
  } else {
    requestAnimationFrame(() => requestAnimationFrame(start));
  }

  // ヒーロー：実績サムネのモザイク切替スライドショー
  // 表示2.2s→モザイク遷移1.1s（ピクセルが粗くなり色が混ざって次カットへ繋がる）
  const heroWrap = document.querySelector('.hero-image');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (heroWrap && !reduceMotion && typeof HTMLCanvasElement === 'function') {
    const names = ['one-and-co', 'smbc', 'softbank', 'recruit', 'mitsui-fudosan', 'speeda', 'loglass', 'lib-consulting', 'newspicks'];
    const HOLD = 2200;
    const TRANS = 1100;
    const MAX_BLOCK = 40;
    const imgs = [];
    let loadedCount = 0;
    names.forEach((n, i) => {
      const im = new Image();
      im.src = 'img/works/' + n + '.webp';
      const onDone = () => {
        loadedCount += 1;
        if (loadedCount === names.length) startSlideshow();
      };
      im.onload = onDone;
      im.onerror = () => { imgs[i] = null; onDone(); };
      imgs[i] = im;
    });

    function startSlideshow() {
      const frames = imgs.filter((im) => im && im.naturalWidth > 0);
      if (frames.length < 2) return;

      const canvas = document.createElement('canvas');
      canvas.className = 'hero-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      heroWrap.appendChild(canvas);
      const ctx = canvas.getContext('2d');
      const off = document.createElement('canvas');
      const offCtx = off.getContext('2d');

      // 背景：同じ絵をぼかして大きく敷く（CSS側でblur）
      const heroSec = heroWrap.closest('.hero-sec');
      const bg = document.createElement('canvas');
      bg.className = 'hero-bg-canvas';
      bg.setAttribute('aria-hidden', 'true');
      if (heroSec) heroSec.prepend(bg);
      const bgCtx = bg.getContext('2d');

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.round(heroWrap.clientWidth * dpr));
        canvas.height = Math.max(1, Math.round(heroWrap.clientHeight * dpr));
        if (heroSec) {
          // ぼかすので低解像度で十分
          bg.width = Math.max(1, Math.round(heroSec.clientWidth / 4));
          bg.height = Math.max(1, Math.round(heroSec.clientHeight / 4));
        }
      };
      resize();
      window.addEventListener('resize', resize);

      const drawBg = () => {
        if (!heroSec) return;
        const w = bg.width;
        const h = bg.height;
        const scale = Math.max(w / canvas.width, h / canvas.height);
        const sw = w / scale;
        const sh = h / scale;
        bgCtx.clearRect(0, 0, w, h);
        bgCtx.drawImage(canvas, (canvas.width - sw) / 2, (canvas.height - sh) / 2, sw, sh, 0, 0, w, h);
      };

      // object-fit: cover 相当の切り出しで描画
      const drawCover = (c, im, w, h) => {
        const scale = Math.max(w / im.naturalWidth, h / im.naturalHeight);
        const sw = w / scale;
        const sh = h / scale;
        c.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, 0, 0, w, h);
      };
      const drawPixelated = (im, block, alpha) => {
        const w = canvas.width;
        const h = canvas.height;
        ctx.globalAlpha = alpha;
        if (block <= 1.5) {
          drawCover(ctx, im, w, h);
          return;
        }
        const pw = Math.max(2, Math.round(w / block));
        const ph = Math.max(2, Math.round(h / block));
        off.width = pw;
        off.height = ph;
        drawCover(offCtx, im, pw, ph);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, pw, ph, 0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
      };

      let idx = 0;
      let phase = 'hold'; // hold | trans
      let phaseStart = performance.now();

      const tick = (now) => {
        const elapsed = now - phaseStart;
        if (phase === 'hold') {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawPixelated(frames[idx], 1, 1);
          if (elapsed >= HOLD) { phase = 'trans'; phaseStart = now; }
        } else {
          const p = Math.min(elapsed / TRANS, 1);
          // ブロックサイズは山なり（細→粗→細）で色の面が繋がる
          const block = 1 + MAX_BLOCK * Math.sin(Math.PI * p);
          const next = frames[(idx + 1) % frames.length];
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawPixelated(frames[idx], block, 1);
          drawPixelated(next, block, p);
          ctx.globalAlpha = 1;
          if (p >= 1) {
            idx = (idx + 1) % frames.length;
            phase = 'hold';
            phaseStart = now;
          }
        }
        drawBg();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // スクロール出現（.js-active → .active / .js-draw → .draw）
  if (typeof IntersectionObserver === 'function') {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add(entry.target.classList.contains('js-draw') ? 'draw' : 'active');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.js-active, .js-draw').forEach((el) => io.observe(el));
  } else {
    document.querySelectorAll('.js-active').forEach((el) => el.classList.add('active'));
    document.querySelectorAll('.js-draw').forEach((el) => el.classList.add('draw'));
  }

  // スクロール進捗レール（--rail-progress 更新）
  const railSections = document.querySelectorAll('.js-rail-section');
  if (railSections.length) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      railSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        const total = rect.height;
        const passed = Math.min(Math.max(vh * 0.7 - rect.top, 0), total);
        sec.style.setProperty('--rail-progress', (passed / total * 100).toFixed(2) + '%');
      });
    };
    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  // ローカルナビ current 表示（セクション到達で切替）
  const navLinks = document.querySelectorAll('.lnav-list a');
  const targets = [];
  navLinks.forEach((a) => {
    const id = a.getAttribute('href');
    const el = id && id.startsWith('#') ? document.querySelector(id) : null;
    if (el) targets.push({ a, el });
  });
  if (targets.length && typeof IntersectionObserver === 'function') {
    const navIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const hit = targets.find((t) => t.el === entry.target);
        if (!hit) return;
        if (entry.isIntersecting) {
          navLinks.forEach((a) => a.classList.remove('current'));
          hit.a.classList.add('current');
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    targets.forEach((t) => navIo.observe(t.el));
  }

  // 右下固定UI：コンタクトセクション到達で非表示（ロゴは残す）
  const contactSec = document.getElementById('contact');
  if (contactSec && typeof IntersectionObserver === 'function') {
    const uiIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        document.documentElement.classList.toggle('hide-fixed-ui', entry.isIntersecting);
      });
    }, { rootMargin: '0px 0px -50% 0px' });
    uiIo.observe(contactSec);
  }

  // コンタクトフォーム（静的版：バリデーション＋サンクス表示のみ。WP実装時に送信処理へ差替）
  const form = document.getElementById('contactForm');
  if (form) {
    // プライバシーポリシー：最後までスクロールで同意チェック解禁→同意で送信解禁
    const privacyBox = document.getElementById('privacyBox');
    const privacyHint = document.getElementById('privacyHint');
    const privacyAgree = document.getElementById('privacyAgree');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (privacyBox && privacyAgree && submitBtn) {
      const unlockConsent = () => {
        if (!privacyAgree.disabled) return;
        privacyAgree.disabled = false;
        if (privacyHint) {
          privacyHint.textContent = 'ご確認ありがとうございます。同意にチェックのうえ送信してください。';
          privacyHint.classList.add('is-done');
        }
      };
      const checkScrolled = () => {
        if (privacyBox.scrollTop + privacyBox.clientHeight >= privacyBox.scrollHeight - 4) unlockConsent();
      };
      privacyBox.addEventListener('scroll', checkScrolled, { passive: true });
      checkScrolled(); // 内容がボックスに収まる場合は即解禁
      window.addEventListener('resize', checkScrolled);
      privacyAgree.addEventListener('change', () => {
        submitBtn.disabled = !privacyAgree.checked;
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('input[required], select[required]').forEach((input) => {
        const badge = input.closest('.form-group').querySelector('.required');
        let ok = input.value.trim() !== '' && input.checkValidity();
        // メールアドレス（確認用）は一致チェック
        if (ok && input.id === 'emailConfirm') {
          ok = input.value.trim() === form.querySelector('#email').value.trim();
        }
        if (badge) badge.classList.toggle('error', !ok);
        if (!ok) valid = false;
      });
      if (!valid) return;
      // 確認画面へ（入力値を転記）
      const confirmBox = document.getElementById('contactConfirm');
      if (!confirmBox) return;
      confirmBox.querySelectorAll('[data-confirm]').forEach((dd) => {
        const field = form.querySelector('#' + dd.getAttribute('data-confirm'));
        dd.textContent = field ? field.value.trim() : '';
      });
      form.style.display = 'none';
      confirmBox.hidden = false;
      setContactState('confirm');
      document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
    });

    // ステップごとに見出し／リード文を差し替え
    const heading = document.querySelector('.contact-heading');
    const lead = document.querySelector('.contact-lead');
    const initialHeading = heading ? heading.textContent : '';
    const initialLead = lead ? lead.innerHTML : '';
    function setContactState(state) {
      if (!heading || !lead) return;
      if (state === 'confirm') {
        heading.textContent = '入力内容をご確認ください。';
        lead.textContent = '内容に誤りがなければ「送信する」を押してください。';
      } else if (state === 'thanks') {
        heading.textContent = 'お問い合わせありがとうございました。';
        lead.textContent = '担当者より、実績映像（ワークスリール）のご案内を追ってお送りいたします。';
      } else {
        heading.textContent = initialHeading;
        lead.innerHTML = initialLead;
      }
    }

    // 確認画面：修正（フォームへ戻る）／送信（完了画面へ）
    const confirmBox = document.getElementById('contactConfirm');
    const backBtn = document.getElementById('confirmBack');
    const sendBtn = document.getElementById('confirmSend');
    if (confirmBox && backBtn && sendBtn) {
      backBtn.addEventListener('click', () => {
        confirmBox.hidden = true;
        form.style.display = '';
        setContactState('input');
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
      });
      sendBtn.addEventListener('click', () => {
        // 静的版：ここでは送信処理なし。WP実装時にPOST処理へ差替
        confirmBox.hidden = true;
        const thanks = document.querySelector('.contact-thanks');
        if (thanks) {
          thanks.hidden = false;
          requestAnimationFrame(() => thanks.classList.add('is-visible'));
        }
        setContactState('thanks');
        document.getElementById('contact').scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
})();
