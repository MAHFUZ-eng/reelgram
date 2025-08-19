/* Adapter that connects your existing UI to the backend without editing your files.
   - Registers/logs in automatically using your display name from localStorage 'rg_user'
   - Mirrors likes/comments to backend
   - Appends backend reels to your feed (keeping the same look)
   - Realtime chat via socket.io (works across devices)
   - WebRTC signaling relayed via socket.io so calls work across the internet
*/

(() => {
  const API = location.origin;
  const sel = (q, r = document) => r.querySelector(q);
  const on = (el, ev, fn, opts) => el.addEventListener(ev, fn, opts);

  // --- Socket.io client (autoload)
  const s = document.createElement('script');
  s.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";
  s.onload = start;
  document.head.appendChild(s);

  async function api(path, options = {}) {
    const res = await fetch(API + path, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  function getCurrentUserName() {
    try {
      const u = JSON.parse(localStorage.getItem('rg_user'));
      return u?.displayName || null;
    } catch { return null; }
  }

  async function ensureBackendAuth() {
    // Try me
    try { const me = await api('/api/auth/me'); return me.user; } catch {}
    // Otherwise auto-login / register using your displayName
    let name = getCurrentUserName();
    if (!name) {
      // wait until your auth modal sets it
      const form = sel('#authForm');
      if (!form) return null;
      await new Promise(resolve => on(form, 'submit', () => setTimeout(resolve, 100), { once: true }));
      name = getCurrentUserName();
    }
    const username = (name || 'guest').toLowerCase().replace(/\s+/g, '');
    const password = 'demo12345';
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
      return r.user;
    } catch {
      const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ username, displayName: name || 'Guest', password }) });
      return r.user;
    }
  }

  function reelHtml(reel) {
    // Use same classes and structure your CSS expects
    return `
      <article class="reel" data-reel="${reel._id}" data-db-id="${reel._id}">
        <video src="${reel.videoUrl}" preload="metadata" playsinline></video>
        <div class="overlay"></div>
        <div class="meta">
          <h4>@${reel.author || 'user'}</h4>
          <div class="desc">${escapeHtml(reel.caption || '')}</div>
          <div class="pill small">#reels</div>
          <div class="pill small">#fresh</div>
        </div>
        <div class="actions">
          <button class="icon-btn like-btn" title="Like">🤍</button>
          <div class="count" data-likecount>${reel.likesCount || 0}</div>
          <button class="icon-btn comment-btn" title="Comments">💬</button>
          <div class="count" data-commentcount>${reel.commentsCount || 0}</div>
          <button class="icon-btn share-btn" title="Share">📤</button>
        </div>
      </article>
    `;
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  async function loadBackendReels() {
    try {
      const { reels } = await api('/api/reels?limit=10');
      if (!reels?.length) return;
      const feed = sel('#feed');
      const wrap = document.createElement('div');
      wrap.innerHTML = reels.map(r => reelHtml({ ...r, author: 'user' })).join('');
      // append to the end; your existing listeners will handle UI
      feed.appendChild(wrap);
    } catch (e) { console.warn('Reels load failed', e); }
  }

  function setupLikeMirror() {
    const feed = sel('#feed');
    on(feed, 'click', async (e) => {
      const btn = e.target.closest('.like-btn');
      if (!btn) return;
      const reelEl = e.target.closest('.reel');
      const dbId = reelEl?.dataset.dbId; // only mirror backend reels
      if (!dbId) return;
      try {
        const r = await api(`/api/reels/${dbId}/like`, { method: 'POST' });
        // update count number from server? Just let your UI change locally;
        // optional: refetch counts later
      } catch (err) { console.warn('like mirror err', err); }
    }, true);
  }

  function setupCommentMirror() {
    // capture which reel was opened
    let currentDbReelId = null;
    const feed = sel('#feed');
    on(feed, 'click', (e) => {
      const btn = e.target.closest('.comment-btn');
      if (!btn) return;
      const reelEl = e.target.closest('.reel');
      currentDbReelId = reelEl?.dataset.dbId || null;
    }, true);

    const form = sel('#commentForm');
    if (!form) return;
    on(form, 'submit', async (e) => {
      if (!currentDbReelId) return; // non-backend reel, ignore
      const input = sel('#commentInput');
      const text = input?.value?.trim();
      if (!text) return;
      try {
        await api(`/api/reels/${currentDbReelId}/comments`, {
          method: 'POST',
          body: JSON.stringify({ text })
        });
      } catch (err) { console.warn('comment mirror err', err); }
    }, true);
  }

  async function fillSuggested() {
    try {
      const { users } = await api('/api/users/suggested');
      const ul = sel('#suggestedList');
      if (!ul || !users?.length) return;
      ul.innerHTML = '';
      users.forEach(u => {
        const li = document.createElement('li');
        li.innerHTML = `<div class="pill">@${u.username || u.displayName}</div><button class="btn" data-chat="${u.username}">Message</button>`;
        ul.appendChild(li);
      });
    } catch(e) {}
  }

  function setupChat(socket, me) {
    // when you click "Start" in drawer, your code creates/opens chat.
    // We mirror send via socket using the chat header.
    const chatForm = sel('#chatForm');
    const chatLog  = sel('#chatLog');
    const chatHeader = sel('#chatHeader');

    on(chatForm, 'submit', (e) => {
      try {
        const header = chatHeader?.textContent || '';
        const m = header.match(/Chat with (.+)$/);
        const partner = m ? m[1] : null;
        const input = sel('#chatMessage');
        const text = input?.value?.trim();
        if (partner && text) {
          socket.emit('chat:send', { toName: partner, text });
        }
      } catch {}
    }, true);

    socket.on('chat:message', (msg) => {
      // append a mirrored bubble (non-intrusive)
      // (your UI already shows your own messages; this displays incoming)
      if (!chatLog) return;
      const div = document.createElement('div');
      div.className = 'msg ' + (msg.from === 'me' ? 'me' : 'them');
      div.textContent = msg.text;
      chatLog.appendChild(div);
      chatLog.scrollTop = chatLog.scrollHeight;
    });
  }

  function setupCallingSignal(socket) {
    // 1) Send local signals (when your original code writes to localStorage)
    const _setItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(k, v) {
      _setItem(k, v);
      try {
        if (k.startsWith('reelgram_signal_') && !k.endsWith('_last')) {
          const code = k.replace('reelgram_signal_', '');
          const arr = JSON.parse(v) || [];
          const last = arr[arr.length - 1];
          if (last) socket.emit('call:signal', { code, data: last });
        }
        if (k.startsWith('reelgram_signal_') && k.endsWith('_last')) {
          const code = k.replace('reelgram_signal_', '').replace('_last','');
          // join the signaling room when we see local activity
          socket.emit('call:join', { code });
        }
      } catch {}
    };

    // 2) Receive remote signals and inject into localStorage so your existing code handles them
    socket.on('call:signal', ({ code, data }) => {
      const key = 'reelgram_signal_' + code;
      try {
        const arr = JSON.parse(localStorage.getItem(key) || '[]');
        arr.push({ ...data, _via: 'socket' });
        _setItem(key, JSON.stringify(arr));
        _setItem(key+'_last', String(Date.now()));
      } catch {}
    });
  }

  async function start() {
    const me = await ensureBackendAuth();

    // connect socket with token (from cookie is fine; still pass placeholder)
    const token = (document.cookie.match(/(?:^| )token=([^;]+)/) || [])[1] || '';
    const socket = io('/', { auth: { token } });

    setupCallingSignal(socket);
    setupLikeMirror();
    setupCommentMirror();
    setupChat(socket, me);
    await loadBackendReels();
    await fillSuggested();

    console.log('%cAdapter ready: backend connected', 'color: #6aa6ff');
  }
})();
