/* Modern Reelgram — TikTok + Instagram Inspired Social Media App
   Features:
   - TikTok-style vertical video feed with infinite scroll
   - Instagram-style stories and UI design
   - Smooth video calls with modern interface
   - Dark/light theme switching
   - Mobile-first responsive design
   - Real-time interactions and animations
*/

(() => {
  // ---------- Utilities ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const now = () => new Date().toISOString();
  
  // Modern utility functions
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };
  
  const throttle = (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };
  
  const formatCount = (count) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return Math.floor(count / 1000) + 'K';
    return Math.floor(count / 1000000) + 'M';
  };

  const store = {
    get(key, def){ try{ return JSON.parse(localStorage.getItem(key)) ?? def; }catch{ return def; } },
    set(key, val){ localStorage.setItem(key, JSON.stringify(val)); },
    del(key){ localStorage.removeItem(key); }
  };

  const uid = () => Math.random().toString(36).slice(2, 10);

  // ---------- Auth System ----------
  const authModal = $('#authModal');
  const loginForm = $('#loginForm');
  const registerForm = $('#registerForm');
  const verificationNotice = $('#verificationNotice');
  const loginFormEl = $('#loginFormEl');
  const registerFormEl = $('#registerFormEl');
  
  let currentUser = store.get('rg_user', null);
  let pendingVerificationEmail = null;

  // Toast notification system
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    $('#toastContainer').appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 100);
    
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function ensureAuth(){
    if(!currentUser || !api.isAuthenticated()){
      showAuthModal();
    } else {
      $('#currentUser').textContent = currentUser.displayName || currentUser.username;
    }
  }
  
  function showAuthModal() {
    showLoginForm();
    authModal.showModal();
  }

  function showLoginForm() {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    verificationNotice.style.display = 'none';
    $('#authTitle').textContent = 'Welcome Back';
  }

  function showRegisterForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    verificationNotice.style.display = 'none';
    $('#authTitle').textContent = 'Join Reelgram';
  }
  
  function showVerificationNotice(email) {
    loginForm.style.display = 'none';
    registerForm.style.display = 'none';
    verificationNotice.style.display = 'block';
    $('#authTitle').textContent = 'Email Verification';
    $('#verificationMessage').textContent = `We've sent a verification email to ${email}. Please check your email and click the verification link to activate your account.`;
    pendingVerificationEmail = email;
  }

  // Form switching
  $('#showRegisterForm').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
  });
  
  $('#showLoginForm').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });
  
  $('#backToLoginBtn').addEventListener('click', () => {
    showLoginForm();
  });

  // Registration
  registerFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = {
      username: $('#registerUsername').value.trim(),
      email: $('#registerEmail').value.trim(),
      password: $('#registerPassword').value,
      displayName: $('#registerDisplayName').value.trim()
    };
    
    if (!userData.username || !userData.email || !userData.password || !userData.displayName) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    try {
      const response = await api.register(userData);
      showToast(response.message, 'success');
      showVerificationNotice(userData.email);
      registerFormEl.reset();
    } catch (error) {
      console.error('Registration error:', error);
      showToast('Registration failed. Please try again.', 'error');
    }
  });

  // Login
  loginFormEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const credentials = {
      email: $('#loginEmail').value.trim(),
      password: $('#loginPassword').value
    };
    
    if (!credentials.email || !credentials.password) {
      showToast('Please fill in all fields', 'error');
      return;
    }
    
    try {
      const response = await api.login(credentials);
      
      if (response.needsVerification) {
        showToast(response.message, 'warning');
        showVerificationNotice(credentials.email);
        return;
      }
      
      currentUser = response.user;
      store.set('rg_user', currentUser);
      $('#currentUser').textContent = currentUser.displayName || currentUser.username;
      showToast('Welcome back!', 'success');
      authModal.close();
      loginFormEl.reset();
    } catch (error) {
      console.error('Login error:', error);
      showToast('Login failed. Please check your credentials.', 'error');
    }
  });
  
  // Resend verification
  $('#resendVerificationBtn').addEventListener('click', async () => {
    if (!pendingVerificationEmail) return;
    
    try {
      const response = await api.resendVerification(pendingVerificationEmail);
      showToast(response.message, 'success');
    } catch (error) {
      console.error('Resend verification error:', error);
      showToast('Failed to resend verification email', 'error');
    }
  });
  
  // Check for verification success from URL params
  window.addEventListener('load', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      showToast('Email verified successfully! You can now log in.', 'success');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });

  // ---------- Sample Data ----------
  const sampleUsers = [
    { id: 'u-jane', name: 'Jane' },
    { id: 'u-max', name: 'Max' },
    { id: 'u-lee', name: 'Lee' },
    { id: 'u-sara', name: 'Sara' },
    { id: 'u-nova', name: 'Nova' }
  ];

  // Public, stable CC0 sample videos (MDN)
  const reels = [
    {
      id: 'r1',
      userId: 'u-jane',
      caption: 'Night vibes ✨',
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      likes: 0
    },
    {
      id: 'r2',
      userId: 'u-max',
      caption: 'Close up 🐝',
      src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/bee.mp4',
      likes: 0
    },
    {
      id: 'r3',
      userId: 'u-lee',
      caption: 'Waves & chill 🌊',
      src: 'https://interactive-examples.mdn.mozilla.net/media/examples/flower.mp4'
    }
  ];

  // Load persisted interactions
  const persistedLikes = store.get('rg_likes', {});
  const persistedComments = store.get('rg_comments', {}); // { reelId: [{user, text, ts}] }
  const chats = store.get('rg_chats', {}); // { userId: [{fromId, text, ts}] }

  // ---------- UI: Suggested users ----------
  function renderSuggested(){
    const ul = $('#suggestedList');
    ul.innerHTML = '';
    sampleUsers.forEach(u => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="pill">@${u.name}</div>
        <button class="btn" data-chat="${u.id}">Message</button>
      `;
      ul.appendChild(li);
    });
    ul.addEventListener('click', (e) => {
      const id = e.target.dataset.chat;
      if(id){ openInbox(); selectChatUser(id, true); }
    });
  }

  // ---------- UI: Inbox (compact list on right) ----------
  function renderInboxRight(){
    const ul = $('#inboxList');
    ul.innerHTML = '';
    Object.keys(chats).forEach(uidKey => {
      const u = sampleUsers.find(s => s.id === uidKey) || { id: uidKey, name: uidKey };
      const last = chats[uidKey][chats[uidKey].length-1];
      const preview = last ? (last.text.length>24 ? last.text.slice(0,24)+'…' : last.text) : 'No messages yet';
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" data-openchat="${u.id}"><b>${u.name}</b><br/><span class="muted small">${preview}</span></a>`;
      ul.appendChild(li);
    });
    ul.addEventListener('click', (e)=>{
      const id = e.target.closest('a')?.dataset.openchat;
      if(id){ openInbox(); selectChatUser(id); }
    });
  }

  // ---------- Reels Feed ----------
  const feed = $('#feed');
  let activeReelIndex = 0;

  function userById(id){ return sampleUsers.find(u => u.id === id) || { name: 'User' }; }

  function reelHtml(r){
    const liked = !!persistedLikes[r.id];
    const likeCount = (r.likes || 0) + (liked ? 1 : 0);
    return `
      <article class="reel" data-reel="${r.id}">
        <video src="${r.src}" preload="metadata" playsinline></video>
        <div class="overlay"></div>
        <div class="meta">
          <h4>@${userById(r.userId).name}</h4>
          <div class="desc">${r.caption}</div>
          <div class="pill small">#reels</div>
          <div class="pill small">#trending</div>
        </div>
        <div class="actions">
          <button class="icon-btn like-btn" title="Like">${liked ? '❤️' : '🤍'}</button>
          <div class="count" data-likecount>${likeCount}</div>
          <button class="icon-btn comment-btn" title="Comments">💬</button>
          <div class="count" data-commentcount>${(persistedComments[r.id]?.length || 0)}</div>
          <button class="icon-btn share-btn" title="Share">📤</button>
        </div>
      </article>
    `;
  }

  function renderFeed(){
    feed.innerHTML = reels.map(reelHtml).join('');
    setupReelBehaviors();
  }

  function setupReelBehaviors(){
    const reelEls = $$('.reel', feed);
    const videos = reelEls.map(el => $('video', el));
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const vid = $('video', entry.target);
        if(entry.isIntersecting){
          vid.play().catch(()=>{});
          activeReelIndex = reelEls.indexOf(entry.target);
        } else {
          vid.pause();
        }
      });
    }, { threshold: 0.65 });
    reelEls.forEach(el => io.observe(el));

    // Buttons
    feed.addEventListener('click', (e) => {
      const reelEl = e.target.closest('.reel');
      if(!reelEl) return;
      const rid = reelEl.dataset.reel;

      if(e.target.classList.contains('like-btn')){
        const liked = !!persistedLikes[rid];
        if(liked){ delete persistedLikes[rid]; }
        else { persistedLikes[rid] = true; }
        store.set('rg_likes', persistedLikes);
        // Update UI
        e.target.textContent = persistedLikes[rid] ? '❤️' : '🤍';
        const baseLikes = (reels.find(r => r.id===rid).likes || 0);
        $('[data-likecount]', reelEl).textContent = baseLikes + (persistedLikes[rid] ? 1 : 0);
      }

      if(e.target.classList.contains('comment-btn')){
        openComments(rid);
      }

      if(e.target.classList.contains('share-btn')){
        const url = location.href.split('#')[0] + `#reel=${rid}`;
        navigator.clipboard?.writeText(url);
        e.target.textContent = '✅';
        setTimeout(()=> e.target.textContent = '📤', 900);
      }
    });

    // Keyboard navigation
    window.addEventListener('keydown', (e)=>{
      if(['ArrowDown','ArrowUp','j','k'].includes(e.key)){
        e.preventDefault();
        if(e.key==='ArrowDown' || e.key==='j') scrollToReel(activeReelIndex+1);
        if(e.key==='ArrowUp'   || e.key==='k') scrollToReel(activeReelIndex-1);
      }
    }, { passive:false });

    // Basic swipe
    let touchY = null;
    window.addEventListener('touchstart', (e)=>{ touchY = e.touches[0].clientY; }, {passive:true});
    window.addEventListener('touchend', (e)=>{
      if(touchY == null) return;
      const dy = e.changedTouches[0].clientY - touchY;
      if(dy < -40) scrollToReel(activeReelIndex+1);
      if(dy >  40) scrollToReel(activeReelIndex-1);
      touchY = null;
    });
  }

  function scrollToReel(idx){
    const reelEls = $$('.reel', feed);
    idx = Math.max(0, Math.min(reelEls.length-1, idx));
    reelEls[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------- Comments ----------
  const commentsModal = $('#commentsModal');
  const commentsList  = $('#commentsList');
  const commentForm   = $('#commentForm');
  const commentInput  = $('#commentInput');
  $('#closeComments').addEventListener('click', ()=>commentsModal.close());
  let currentReelForComments = null;

  function openComments(reelId){
    currentReelForComments = reelId;
    renderComments(reelId);
    commentsModal.showModal();
  }
  function renderComments(reelId){
    const list = persistedComments[reelId] || [];
    commentsList.innerHTML = list.map(c => `
      <div class="comment">
        <div class="who">${c.user} <span class="muted small">· ${new Date(c.ts).toLocaleString()}</span></div>
        <div class="text">${escapeHtml(c.text)}</div>
      </div>
    `).join('') || `<p class="muted">No comments yet. Be the first!</p>`;
    // update count on reel card
    const reelEl = $(`.reel[data-reel="${reelId}"]`);
    if(reelEl) $('[data-commentcount]', reelEl).textContent = (persistedComments[reelId]?.length || 0);
  }
  commentForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!currentUser) return ensureAuth();
    const text = commentInput.value.trim();
    if(!text) return;
    const reelId = currentReelForComments;
    if(!persistedComments[reelId]) persistedComments[reelId] = [];
    persistedComments[reelId].push({ user: currentUser.displayName, text, ts: now() });
    store.set('rg_comments', persistedComments);
    commentInput.value = '';
    renderComments(reelId);
  });

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
  }

  // ---------- Inbox / Chat ----------
  const inboxModal = $('#inboxModal');
  const openInboxBtn = $('#openInboxBtn');
  const closeInboxBtn = $('#closeInbox');
  const openFullInbox = $('#openFullInbox');

  document.addEventListener("DOMContentLoaded", () => {
  if (openInboxBtn) {
    openInboxBtn.addEventListener("click", openInbox);
  }

  if (openFullInbox) {
    openFullInbox.addEventListener("click", openInbox);
  }

  if (closeInboxBtn) {
    closeInboxBtn.addEventListener("click", () => inboxModal.close());
  }
});


  const chatUsersEl = $('#chatUsers');
  const chatLogEl   = $('#chatLog');
  const chatHeader  = $('#chatHeader');
  const chatForm    = $('#chatForm');
  const chatMessage = $('#chatMessage');
  const newChatUserInput = $('#newChatUserInput');
  const startChatBtn = $('#startChatBtn');

  let activeChatUserId = null;

  function openInbox(){
    renderChatUsers();
    renderInboxRight();
    inboxModal.showModal();
  }

  startChatBtn.addEventListener('click', ()=>{
    const name = newChatUserInput.value.trim();
    if(!name) return;
    const user = sampleUsers.find(u => u.name.toLowerCase() === name.toLowerCase()) || { id: 'u-'+name.toLowerCase(), name };
    if(!chats[user.id]) chats[user.id] = [];
    store.set('rg_chats', chats);
    renderChatUsers();
    selectChatUser(user.id, true);
    newChatUserInput.value = '';
  });

  function renderChatUsers(){
    chatUsersEl.innerHTML = '';
    const ids = Object.keys(chats);
    if(ids.length === 0){
      chatUsersEl.innerHTML = `<li class="muted small padded">No conversations yet.</li>`;
      return;
    }
    ids.forEach(uidKey => {
      const u = sampleUsers.find(s => s.id === uidKey) || { id: uidKey, name: uidKey.replace(/^u-/, '') };
      const li = document.createElement('li');
      li.innerHTML = `<a href="#" data-chatuser="${u.id}" class="nav">${u.name}</a>`;
      chatUsersEl.appendChild(li);
    });
    chatUsersEl.addEventListener('click', (e)=>{
      const id = e.target.dataset.chatuser;
      if(id){ selectChatUser(id); }
    }, { once: true });
  }

  function selectChatUser(userId, focusInput=false){
    activeChatUserId = userId;
    const u = sampleUsers.find(s => s.id === userId) || { id: userId, name: userId.replace(/^u-/, '') };
    chatHeader.textContent = `Chat with ${u.name}`;
    if(!chats[userId]) chats[userId] = [];
    store.set('rg_chats', chats);
    renderChatLog();
    if(focusInput) chatMessage.focus();
  }

  function renderChatLog(){
    const arr = chats[activeChatUserId] || [];
    chatLogEl.innerHTML = arr.map(m => `
      <div class="msg ${m.fromId==='me' ? 'me' : 'them'}">${escapeHtml(m.text)}</div>
    `).join('');
    chatLogEl.scrollTop = chatLogEl.scrollHeight;
  }

  chatForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!currentUser) return ensureAuth();
    const text = chatMessage.value.trim();
    if(!text || !activeChatUserId) return;
    chats[activeChatUserId].push({ fromId: 'me', text, ts: now() });
    store.set('rg_chats', chats);
    chatMessage.value = '';
    renderChatLog();
    renderInboxRight();
    // Auto-reply (demo)
    setTimeout(()=>{
      chats[activeChatUserId].push({ fromId: 'them', text: '👍', ts: now() });
      store.set('rg_chats', chats);
      renderChatLog(); renderInboxRight();
    }, 500);
  });

  // ---------- Calls (WebRTC P2P across two tabs) ----------
  const callModal = $('#callModal');
  $('#openCallPanelBtn').addEventListener('click', ()=>callModal.showModal());
  $('#closeCall').addEventListener('click', ()=>callModal.close());

  const roomCodeEl = $('#roomCode');
  const joinRoomBtn = $('#joinRoom');
  const leaveRoomBtn = $('#leaveRoom');
  const startCallBtn = $('#startCall');
  const hangupBtn = $('#hangup');
  const toggleMicBtn = $('#toggleMic');
  const toggleCamBtn = $('#toggleCam');
  const callStatus = $('#callStatus');

  // Quick panel on right
  $('#joinRoomQuick').addEventListener('click', ()=>{
    $('#openCallPanelBtn').click();
    $('#roomCode').value = $('#roomCodeQuick').value;
    joinRoom();
  });
  $('#startCallQuick').addEventListener('click', ()=>{
    $('#openCallPanelBtn').click();
    $('#roomCode').value = $('#roomCodeQuick').value;
    joinRoom().then(startCall);
  });

  const localVideo = $('#localVideo');
  const remoteVideo = $('#remoteVideo');

  let pc = null;
  let localStream = null;
  let room = null; // signaling room
  let micEnabled = true;
  let camEnabled = true;

  // signaling via BroadcastChannel (best) + localStorage fallback
  let bc = null;

  function setStatus(text){ callStatus.textContent = text; }

  async function getMedia(){
    if(localStream) return localStream;
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    localVideo.srcObject = localStream;
    return localStream;
  }

  function createPeer(){
    pc = new RTCPeerConnection({
      iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
    });
    pc.ontrack = (e)=>{ remoteVideo.srcObject = e.streams[0]; };
    pc.oniceconnectionstatechange = ()=>{ setStatus(`ICE: ${pc.iceConnectionState}`); };
    pc.onicecandidate = (e)=>{
      if(e.candidate) sendSignal({ type:'candidate', candidate: e.candidate });
    };
  }

  function openBroadcastChannel(roomCode){
    try{
      bc?.close?.();
      bc = new BroadcastChannel('reelgram-'+roomCode);
      bc.onmessage = (ev)=> handleSignal(ev.data, false);
      return true;
    }catch{ return false; }
  }

  function lsKey(roomCode){ return 'reelgram_signal_'+roomCode; }

  function sendSignal(msg){
    if(!room) return;
    // BroadcastChannel
    try{ bc?.postMessage?.(msg); }catch{}
    // localStorage fallback (append queue)
    const key = lsKey(room);
    const arr = store.get(key, []);
    arr.push({ ...msg, _ts: Date.now() });
    store.set(key, arr);
    // Trigger storage event for other tabs
    localStorage.setItem(key+'_last', String(Date.now()));
  }

  window.addEventListener('storage', (e)=>{
    if(!room) return;
    if(e.key === lsKey(room) || e.key === lsKey(room)+'_last'){
      const arr = store.get(lsKey(room), []);
      arr.forEach(m => handleSignal(m, true));
      // Keep only the latest 20 to avoid growth
      if(arr.length > 20) store.set(lsKey(room), arr.slice(-20));
    }
  });

  async function handleSignal(data, fromLocalStorage){
    if(!pc) return;
    if(data.type === 'offer'){
      await getMedia();
      localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal({ type:'answer', sdp: pc.localDescription });
      setStatus('Answer sent');
    } else if(data.type === 'answer'){
      if(!pc.currentRemoteDescription){
        await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        setStatus('Connected (answer set)');
      }
    } else if(data.type === 'candidate' && data.candidate){
      try{ await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); }catch{}
    }
  }

  async function joinRoom(){
    const code = roomCodeEl.value.trim();
    if(!code) { alert('Enter a room code'); return; }
    room = code;
    const opened = openBroadcastChannel(code);
    setStatus(`Joined "${code}" ${opened ? '(BC)' : '(fallback)'}`);
  }

  async function leaveRoom(){
    room = null;
    try{ bc?.close?.(); }catch{}
    bc = null;
    setStatus('Left room');
  }

  async function startCall(){
    if(!room){ await joinRoom(); if(!room) return; }
    await getMedia();
    createPeer();
    localStream.getTracks().forEach(t => pc.addTrack(t, localStream));
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal({ type:'offer', sdp: pc.localDescription });
    setStatus('Offer sent — waiting for answer…');
  }

  function hangup(){
    pc?.getSenders()?.forEach(s => s.track?.stop?.());
    pc?.close?.();
    pc = null;
    // Keep local preview alive
    setStatus('Call ended');
  }

  function toggleMic(){
    micEnabled = !micEnabled;
    localStream?.getAudioTracks()?.forEach(t => t.enabled = micEnabled);
    $('#toggleMic').textContent = micEnabled ? 'Mute' : 'Unmute';
  }
  function toggleCam(){
    camEnabled = !camEnabled;
    localStream?.getVideoTracks()?.forEach(t => t.enabled = camEnabled);
    $('#toggleCam').textContent = camEnabled ? 'Camera Off' : 'Camera On';
  }

  joinRoomBtn.addEventListener('click', joinRoom);
  leaveRoomBtn.addEventListener('click', leaveRoom);
  startCallBtn.addEventListener('click', startCall);
  hangupBtn.addEventListener('click', hangup);
  toggleMicBtn.addEventListener('click', toggleMic);
  toggleCamBtn.addEventListener('click', toggleCam);

  // ---------- Misc UI ----------
  $('#clearDataBtn').addEventListener('click', ()=>{
    if(confirm('This will clear likes, comments, and chats. Continue?')){
      ['rg_likes','rg_comments','rg_chats'].forEach(k => store.del(k));
      location.reload();
    }
  });

  $('#openProfileBtn').addEventListener('click', ()=>{
    alert('Profile page is not included in this minimal demo. (Friends, followers, etc.)');
  });

  $('#openInboxBtn').addEventListener('click', openInbox);

  // Header search (client-side filter by caption or user)
  $('#searchInput').addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase();
    const filtered = reels.filter(r => r.caption.toLowerCase().includes(q) || userById(r.userId).name.toLowerCase().includes(q));
    feed.innerHTML = filtered.map(reelHtml).join('') || `<p class="muted">No matches.</p>`;
    setupReelBehaviors();
  });

  // Right panel "Open Inbox" button
  $('#openFullInbox').addEventListener('click', openInbox);

  // Quick call panel buttons are wired earlier.

  // ---------- Modern Features ----------
  
  // Theme Toggle
  const themeToggle = $('#themeToggle');
  let currentTheme = store.get('rg_theme', 'light');
  
  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    currentTheme = theme;
    store.set('rg_theme', theme);
    
    const sunIcon = $('.sun-icon', themeToggle);
    const moonIcon = $('.moon-icon', themeToggle);
    
    if (theme === 'dark') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }
  
  themeToggle?.addEventListener('click', () => {
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });
  
  // Initialize theme
  setTheme(currentTheme);
  
  // Modern Reels Feed
  function createModernReel(reel, index) {
    const user = userById(reel.userId);
    const liked = !!persistedLikes[reel.id];
    const likeCount = formatCount((reel.likes || 0) + (liked ? 1 : 0));
    const commentCount = formatCount(persistedComments[reel.id]?.length || 0);
    
    return `
      <div class="reel-item animate-fadeIn" data-reel-id="${reel.id}" style="animation-delay: ${index * 0.1}s">
        <video class="reel-video" 
               src="${reel.src}" 
               preload="metadata" 
               playsinline 
               loop 
               muted="true"
               data-reel="${reel.id}">
        </video>
        
        <div class="reel-overlay">
          <div class="reel-info">
            <div class="reel-user">
              <img class="user-avatar-sm" src="https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=32&h=32&fit=crop&crop=face" alt="${user.name}">
              <span class="username">@${user.name}</span>
              <button class="follow-btn">Follow</button>
            </div>
            
            <div class="reel-caption">${reel.caption}</div>
            
            <div class="reel-tags">
              <a href="#" class="hashtag">#reels</a>
              <a href="#" class="hashtag">#viral</a>
              <a href="#" class="hashtag">#trending</a>
            </div>
          </div>
        </div>
        
        <div class="reel-actions">
          <button class="action-btn like-btn" data-reel="${reel.id}">
            <svg viewBox="0 0 24 24" fill="${liked ? 'currentColor' : 'none'}" stroke="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span class="action-count">${likeCount}</span>
          </button>
          
          <button class="action-btn comment-btn" data-reel="${reel.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15c0 1-1 2-2 2H7l-4 4V5c0-1 1-2 2-2h14c1 0 2 1 2 2z"/>
            </svg>
            <span class="action-count">${commentCount}</span>
          </button>
          
          <button class="action-btn share-btn" data-reel="${reel.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span class="action-count">Share</span>
          </button>
          
          <button class="action-btn video-call-btn" data-user="${user.name}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="23,7 16,12 23,17 23,7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            <span class="action-count">Call</span>
          </button>
        </div>
        
        <div class="reel-controls">
          <button class="control-btn mute-btn" data-reel="${reel.id}">
            <svg class="volume-on" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
              <path d="M19.07 4.93c0 0 0 0 0 0 3.12 3.12 3.12 8.19 0 11.31C19.07 19.07 19.07 19.07 19.07 19.07"/>
              <path d="M15.54 8.46c0 0 0 0 0 0 1.56 1.56 1.56 4.09 0 5.66c0 0 0 0 0 0"/>
            </svg>
            <svg class="volume-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display: none;">
              <polygon points="11,5 6,9 2,9 2,15 6,15 11,19 11,5"/>
              <line x1="23" y1="9" x2="17" y2="15"/>
              <line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }
  
  // Render modern reels feed
  function renderModernReelsFeed() {
    const reelsFeed = $('#reelsFeed');
    if (!reelsFeed) return;
    
    reelsFeed.innerHTML = reels.map((reel, index) => createModernReel(reel, index)).join('');
    setupModernReelBehaviors();
  }
  
  // Modern reel behaviors
  function setupModernReelBehaviors() {
    const reelItems = $$('.reel-item');
    const videos = $$('.reel-video');
    
    // Intersection observer for autoplay
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const video = $('.reel-video', entry.target);
        const muteBtn = $('.mute-btn', entry.target);
        
        if (entry.isIntersecting) {
          video.play().catch(() => {});
          entry.target.classList.add('active');
        } else {
          video.pause();
          entry.target.classList.remove('active');
        }
      });
    }, { threshold: 0.7 });
    
    reelItems.forEach(item => io.observe(item));
    
    // Action buttons
    document.addEventListener('click', handleReelActions);
  }
  
  function handleReelActions(e) {
    const target = e.target.closest('button');
    if (!target) return;
    
    const reelId = target.dataset.reel;
    const userName = target.dataset.user;
    
    if (target.classList.contains('like-btn') && reelId) {
      toggleLike(reelId, target);
    } else if (target.classList.contains('comment-btn') && reelId) {
      openComments(reelId);
    } else if (target.classList.contains('share-btn') && reelId) {
      shareReel(reelId, target);
    } else if (target.classList.contains('video-call-btn') && userName) {
      initiateVideoCall(userName);
    } else if (target.classList.contains('mute-btn') && reelId) {
      toggleMute(reelId, target);
    }
  }
  
  function toggleLike(reelId, button) {
    const liked = !!persistedLikes[reelId];
    const svg = $('svg', button);
    const countEl = $('.action-count', button);
    
    if (liked) {
      delete persistedLikes[reelId];
      svg.setAttribute('fill', 'none');
      button.classList.remove('liked');
    } else {
      persistedLikes[reelId] = true;
      svg.setAttribute('fill', 'currentColor');
      button.classList.add('liked');
      
      // Animate like
      button.style.transform = 'scale(1.2)';
      setTimeout(() => {
        button.style.transform = '';
      }, 200);
    }
    
    store.set('rg_likes', persistedLikes);
    
    const reel = reels.find(r => r.id === reelId);
    const newCount = (reel.likes || 0) + (persistedLikes[reelId] ? 1 : 0);
    countEl.textContent = formatCount(newCount);
  }
  
  function shareReel(reelId, button) {
    const url = `${window.location.origin}${window.location.pathname}#reel=${reelId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Check out this reel on Reelgram!',
        url: url
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard?.writeText(url);
        showToast('Link copied to clipboard!', 'success');
      });
    } else {
      navigator.clipboard?.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    }
    
    // Animate share button
    const countEl = $('.action-count', button);
    countEl.textContent = '✓';
    setTimeout(() => {
      countEl.textContent = 'Share';
    }, 1000);
  }
  
  function toggleMute(reelId, button) {
    const reelItem = button.closest('.reel-item');
    const video = $('.reel-video', reelItem);
    const volumeOn = $('.volume-on', button);
    const volumeOff = $('.volume-off', button);
    
    if (video.muted) {
      video.muted = false;
      volumeOn.style.display = 'block';
      volumeOff.style.display = 'none';
    } else {
      video.muted = true;
      volumeOn.style.display = 'none';
      volumeOff.style.display = 'block';
    }
  }
  
  function initiateVideoCall(userName) {
    showToast(`Starting video call with @${userName}...`, 'info');
    // Generate a room code based on users
    const roomCode = `call-${currentUser.username}-${userName}-${Date.now()}`;
    $('#roomCode').value = roomCode;
    $('#callModal').showModal();
    setTimeout(() => {
      joinRoom().then(() => {
        startCall();
      });
    }, 1000);
  }
  
  // Stories functionality
  function renderStories() {
    const storiesContainer = $('#storiesContainer');
    if (!storiesContainer) return;
    
    const stories = [
      { user: 'Jane', avatar: 'https://images.unsplash.com/photo-1494790108755-2616da8c8ddd?w=64&h=64&fit=crop&crop=face' },
      { user: 'Max', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face' },
      { user: 'Sara', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=64&h=64&fit=crop&crop=face' },
      { user: 'Lee', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop&crop=face' },
    ];
    
    storiesContainer.innerHTML = stories.map(story => `
      <div class="story" data-user="${story.user}">
        <div class="story-avatar">
          <img src="${story.avatar}" alt="${story.user}">
        </div>
        <span class="story-label">${story.user}</span>
      </div>
    `).join('');
    
    // Story click handlers
    storiesContainer.addEventListener('click', (e) => {
      const story = e.target.closest('.story');
      if (story) {
        const user = story.dataset.user;
        showToast(`Viewing @${user}'s story`, 'info');
        // Here you would implement story viewing
      }
    });
  }
  
  // Navigation handlers
  function setupNavigation() {
    // Bottom navigation
    $$('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const page = btn.dataset.page;
        if (page) {
          switchPage(page);
          updateActiveNav(btn);
        }
      });
    });
    
    // Desktop navigation
    $$('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = item.dataset.page;
        if (page) {
          switchPage(page);
          updateActiveNavItem(item);
        }
      });
    });
    
    // Create button handlers
    $('#mobileCreateBtn')?.addEventListener('click', openCreateModal);
    $('#createReelBtn')?.addEventListener('click', openCreateModal);
  }
  
  function switchPage(page) {
    // Hide all content
    $$('.page-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // Show selected page content
    const pageContent = $(`#${page}Content`);
    if (pageContent) {
      pageContent.style.display = 'block';
    }
    
    // Handle specific page logic
    switch (page) {
      case 'home':
        renderModernReelsFeed();
        break;
      case 'explore':
        showToast('Explore page - Coming soon!', 'info');
        break;
      case 'messages':
        openInbox();
        break;
      case 'profile':
        showToast('Profile page - Coming soon!', 'info');
        break;
    }
  }
  
  function updateActiveNav(activeBtn) {
    $$('.nav-btn').forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
  }
  
  function updateActiveNavItem(activeItem) {
    $$('.nav-item').forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
  }
  
  function openCreateModal() {
    showToast('Create reel feature - Coming soon!', 'info');
    // Here you would open a create reel modal with camera access
  }
  
  // Search functionality
  function setupSearch() {
    const searchInput = $('#searchInput');
    if (!searchInput) return;
    
    const debouncedSearch = debounce((query) => {
      performSearch(query);
    }, 300);
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query) {
        debouncedSearch(query);
      } else {
        renderModernReelsFeed(); // Show all reels
      }
    });
  }
  
  function performSearch(query) {
    const filtered = reels.filter(reel => 
      reel.caption.toLowerCase().includes(query.toLowerCase()) ||
      userById(reel.userId).name.toLowerCase().includes(query.toLowerCase())
    );
    
    const reelsFeed = $('#reelsFeed');
    if (filtered.length > 0) {
      reelsFeed.innerHTML = filtered.map((reel, index) => createModernReel(reel, index)).join('');
      setupModernReelBehaviors();
    } else {
      reelsFeed.innerHTML = `
        <div class="no-results">
          <h3>No results found</h3>
          <p>Try searching for something else</p>
        </div>
      `;
    }
  }

  // ---------- Init ----------
  setTheme(currentTheme);
  renderStories();
  renderModernReelsFeed();
  setupNavigation();
  setupSearch();
  renderSuggested();
  renderInboxRight();
  ensureAuth();

  // Deep linking to reel
  if (location.hash.startsWith('#reel=')) {
    const rid = location.hash.split('=')[1];
    setTimeout(() => {
      const el = $(`.reel-item[data-reel-id="${rid}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }
})();
