// auth.js
import { signInWithEmailAndPassword, signOut, setPersistence, browserLocalPersistence, GithubAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase-config.js";

// session 7 วัน — Firebase จะจำ login ไว้ใน localStorage
setPersistence(auth, browserLocalPersistence);

const githubProvider = new GithubAuthProvider();

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

  // แปลง username → fake email สำหรับ Firebase
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

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
}