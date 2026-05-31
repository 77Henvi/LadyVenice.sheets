import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  GithubAuthProvider, signInWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const githubProvider = new GithubAuthProvider();

// ===== LOGIN =====
window.handleLogin = async function() {
  const username = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const btn      = document.getElementById('login-btn');

  if (!username || !password) {
    showLoginError('กรุณากรอก username และรหัสผ่าน');
    return;
  }

  btn.textContent = 'กำลังเข้าสู่ระบบ...';
  btn.disabled    = true;
  document.getElementById('login-error').style.display = 'none';

  const email = `${username}@ladyvenice.app`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    showLoginError('username หรือรหัสผ่านไม่ถูกต้อง');
    btn.textContent = 'เข้าสู่ระบบ';
    btn.disabled    = false;
  }
};

window.handleGithubLogin = async function() {
  const btn = document.getElementById('github-btn');
  btn.disabled = true;
  document.getElementById('login-error').style.display = 'none';

  try {
    await signInWithPopup(auth, githubProvider);
  } catch (e) {
    if (e.code !== 'auth/popup-closed-by-user') {
      showLoginError('GitHub login ไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
    btn.disabled = false;
  }
};

window.handleLogout = async function() {
  if (!confirm('ต้องการออกจากระบบ?')) return;
  await signOut(auth);
};

window.toggleLoginPass = function() {
  const input = document.getElementById('login-password');
  const icon  = document.getElementById('login-eye-btn').querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.setAttribute('data-lucide', 'eye-off');
  } else {
    input.type = 'password';
    icon.setAttribute('data-lucide', 'eye');
  }
  lucide.createIcons();
};

// ===== HELPERS =====
function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent   = msg;
  el.style.display = 'block';
}

function showApp() {
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('main-app').style.display   = 'block';
}

function showLogin() {
  document.getElementById('login-page').style.display = 'flex';
  document.getElementById('main-app').style.display   = 'none';
}

// ===== AUTH STATE LISTENER =====
let appInited = false;
onAuthStateChanged(auth, async user => {
  if (user) {
    showApp();
    if (!appInited) {
      appInited = true;
      const { init } = await import('./main.js');
      init();
    }
  } else {
    showLogin();
    appInited = false;
    lucide.createIcons();
  }
});

// ===== BIND EVENTS (แทน onclick ใน HTML) =====
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('login-btn')?.addEventListener('click', window.handleLogin);
  document.getElementById('github-btn')?.addEventListener('click', window.handleGithubLogin);
  document.getElementById('login-eye-btn')?.addEventListener('click', window.toggleLoginPass);
  document.getElementById('login-password')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') window.handleLogin();
  });
});