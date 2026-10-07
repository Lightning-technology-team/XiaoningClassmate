/* 小柠同学官网 · 站点通用脚本 */
(function () {
    'use strict';

    /* 供 <head> 引导脚本判断动效是否就绪 */
    window.__motionReady = true;

    /* ---------- 导航 ---------- */
    const nav = document.querySelector('.nav');
    if (nav) {
        const sync = () => nav.classList.toggle('is-pinned', window.scrollY > 8);
        window.addEventListener('scroll', sync, { passive: true });
        sync();
    }

    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');
    if (toggle && links) {
        toggle.addEventListener('click', () => {
            const open = links.classList.toggle('is-open');
            toggle.setAttribute('aria-expanded', String(open));
        });
        links.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                links.classList.remove('is-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    /* ---------- 弹窗 ---------- */
    window.createSheet = function (el, onOpen) {
        const close = () => {
            el.classList.remove('is-open');
            document.body.style.overflow = '';
        };
        el.addEventListener('click', (e) => { if (e.target === el) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && el.classList.contains('is-open')) close();
        });
        return {
            open() {
                el.classList.add('is-open');
                document.body.style.overflow = 'hidden';
                if (onOpen) onOpen();
            },
            close
        };
    };

    /* ---------- 版本工具 ---------- */
    window.escapeHtml = function (value) {
        const el = document.createElement('div');
        el.textContent = value === undefined || value === null ? '' : String(value);
        return el.innerHTML;
    };

    /** 比较版本号：a > b 返回正数 */
    window.compareVersions = function (a, b) {
        const pa = String(a).replace(/^v/i, '').split('.').map(Number);
        const pb = String(b).replace(/^v/i, '').split('.').map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const d = (pa[i] || 0) - (pb[i] || 0);
            if (d !== 0) return d;
        }
        return 0;
    };

    /** 取得版本列表（按配置顺序） */
    window.allReleases = function () {
        return (typeof versionConfig !== 'undefined' && versionConfig.versions) || [];
    };

    /** 取得最新版本条目 */
    window.latestRelease = function () {
        const list = window.allReleases();
        if (!list.length) return null;
        return list.reduce((best, item) => (window.compareVersions(item.version, best.version) > 0 ? item : best), list[0]);
    };

    /** 下载最新版本 APK */
    window.downloadAPK = function () {
        const release = window.latestRelease();
        if (!release) return;
        const link = document.createElement('a');
        link.href = './' + release.filename;
        link.download = release.filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /** 渲染版本列表到容器 */
    window.renderReleases = function (mount) {
        const list = window.allReleases();
        if (!list.length) {
            mount.innerHTML = '<p class="placeholder">暂无历史版本</p>';
            return;
        }
        const newest = window.latestRelease();
        mount.innerHTML = list.slice().reverse().map((item) => {
            const isNewest = newest && window.compareVersions(item.version, newest.version) === 0;
            return `
                <div class="release">
                    <div class="info">
                        <div class="line">
                            <span class="ver">${window.escapeHtml(item.version)}</span>
                            ${isNewest ? '<span class="badge-latest">最新</span>' : ''}
                            <span class="date">${window.escapeHtml(item.date || '')}</span>
                        </div>
                        <p class="desc">${window.escapeHtml(item.description || '')}</p>
                    </div>
                    <a class="get" href="./${window.escapeHtml(item.filename)}" download>
                        <svg class="icon" viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/></svg>
                        下载
                    </a>
                </div>`;
        }).join('');
    };

    /* ---------- 更新日志渲染 ---------- */
    window.renderChangelog = async function (mount) {
        try {
            const res = await fetch('./README.md', { cache: 'no-cache' });
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const text = await res.text();
            mount.innerHTML = typeof marked !== 'undefined'
                ? marked.parse(text)
                : '<pre>' + window.escapeHtml(text) + '</pre>';
        } catch (err) {
            mount.innerHTML = '<p class="placeholder">更新日志加载失败，请稍后重试</p>';
            console.error('[更新日志]', err);
        }
    };

    /* ---------- 版权年份 ---------- */
    document.querySelectorAll('[data-year]').forEach((el) => {
        el.textContent = new Date().getFullYear();
    });
})();

/* =============================================================================
   动效：滚动入场、滚动进度、指针光晕、磁吸按钮、数字滚动
   ========================================================================== */
(function () {
    'use strict';

    /* 参与滚动入场的元素（与 site.css 中的选择器保持一致） */
    const REVEAL = '.section-head, .hero > *, .page-head > *, .grid > *, .rows > .row,'
        + ' .notes > .note, .showcase .window, .stats > .stat, .callout, .release, .doc, .cta';

    const mq = (q) => (window.matchMedia ? window.matchMedia(q).matches : false);
    const reduced = mq('(prefers-reduced-motion: reduce)');
    const finePointer = mq('(hover: hover) and (pointer: fine)');

    /* ---------- 顶部滚动进度条 ---------- */
    try {
        const bar = document.createElement('div');
        bar.className = 'scroll-progress';
        document.body.appendChild(bar);
        let ticking = false;
        const paint = () => {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
            bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
            ticking = false;
        };
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(paint);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        paint();
    } catch (err) { /* 忽略 */ }

    /* ---------- 滚动入场 ---------- */
    const observer = (!reduced && 'IntersectionObserver' in window)
        ? new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                reveal(entry.target);
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 })
        : null;

    /** 同一组内的元素依次错峰出现 */
    function delayOf(el) {
        const parent = el.parentElement;
        if (!parent) return 0;
        const group = Array.prototype.filter.call(
            parent.children,
            (node) => node.matches && node.matches(REVEAL)
        );
        const index = group.indexOf(el);
        return Math.min(Math.max(index, 0), 5) * 70;
    }

    function reveal(el) {
        if (el.classList.contains('is-revealed')) return;
        el.style.setProperty('--d', delayOf(el) + 'ms');
        el.classList.add('is-revealed');
    }

    function scan(root) {
        const scope = (root && root.nodeType === 1) ? root : document;
        let list = scope.querySelectorAll(REVEAL);
        if (scope.nodeType === 1 && scope.matches(REVEAL)) list = [scope, ...list];
        list.forEach((el) => {
            if (el.dataset.motionBound) return;
            el.dataset.motionBound = '1';
            if (observer) observer.observe(el);
            else reveal(el);
        });
    }

    scan(document);

    /* 动态注入的内容（版本列表、更新日志等）同样参与入场 */
    if ('MutationObserver' in window) {
        new MutationObserver((records) => {
            records.forEach((record) => {
                Array.prototype.forEach.call(record.addedNodes, (node) => {
                    if (node.nodeType === 1) scan(node.parentElement || document);
                });
            });
        }).observe(document.body, { childList: true, subtree: true });
    }

    /* ---------- 卡片：跟随指针的光晕 ---------- */
    if (finePointer) {
        document.querySelectorAll('.card, .project-card').forEach((el) => {
            el.addEventListener('pointermove', (e) => {
                const r = el.getBoundingClientRect();
                el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(2) + '%');
                el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(2) + '%');
            }, { passive: true });
        });
    }

    /* ---------- 按钮：磁吸跟手（用 translate，避免覆盖按下动画） ---------- */
    if (finePointer) {
        document.querySelectorAll('.btn').forEach((btn) => {
            btn.addEventListener('pointermove', (e) => {
                const r = btn.getBoundingClientRect();
                const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
                const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
                btn.style.translate = (dx * 6).toFixed(2) + 'px ' + (dy * 4).toFixed(2) + 'px';
            });
            btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
        });
    }

    /* ---------- 点击：涟漪反馈 ---------- */
    const TAPPABLE = '.card, .project-card, .btn, .row, .note, .callout, .release';
    document.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || !e.target.closest) return;
        const host = e.target.closest(TAPPABLE);
        if (!host) return;
        const rect = host.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const size = Math.max(rect.width, rect.height) * 2.1;
        const ripple = document.createElement('span');
        ripple.className = 'ripple is-on';
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left) + 'px';
        ripple.style.top = (e.clientY - rect.top) + 'px';
        host.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }, { passive: true });

    /* ---------- 数字滚动 ---------- */
    const values = document.querySelectorAll('.stat .value');
    if (values.length && !reduced && 'IntersectionObserver' in window) {
        const counter = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                counter.unobserve(entry.target);
                countUp(entry.target);
            });
        }, { threshold: 0.5 });
        values.forEach((el) => counter.observe(el));
    }

    function countUp(el) {
        const match = el.textContent.trim().match(/^(\d+(?:\.\d+)?)(.*)$/);
        if (!match || match[2].charAt(0) === '.') return;   /* 形如 3.0.0 的版本号跳过 */
        const target = parseFloat(match[1]);
        const suffix = match[2];
        const digits = (match[1].split('.')[1] || '').length;
        const start = performance.now();
        const tick = (now) => {
            const t = Math.min(1, (now - start) / 1100);
            const eased = 1 - Math.pow(1 - t, 3);
            if (t < 1) {
                el.textContent = (target * eased).toFixed(digits) + suffix;
                requestAnimationFrame(tick);
            } else {
                el.textContent = target.toFixed(digits) + suffix;
            }
        };
        requestAnimationFrame(tick);
    }
})();