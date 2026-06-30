// auth.js
import { supabase } from "./supabase-config.js";

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

  // แปลง username → fake email สำหรับ Supabase
  const email = `${username}@ladyvenice.app`;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    showLoginError('username หรือรหัสผ่านไม่ถูกต้อง');
    btn.textContent = 'เข้าสู่ระบบ';
    btn.disabled    = false;
  } else {
    // ล็อกอินสำเร็จ (app.js จะตรวจเจอ session และเปลี่ยนหน้าเอง)
  }
};

window.handleGithubLogin = async function() {
  const btn = document.getElementById('github-btn');
  btn.disabled = true;
  document.getElementById('login-error').style.display = 'none';

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
  });

  if (error) {
    showLoginError('GitHub login ไม่สำเร็จ');
    btn.disabled = false;
  }
};

window.handleLogout = async function() {
  if (!confirm('ต้องการออกจากระบบ?')) return;
  await supabase.auth.signOut();
  window.location.reload(); // รีเฟรชหน้าเพื่อกลับไปหน้า Login
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