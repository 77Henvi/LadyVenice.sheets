import { supabase } from "./supabase-config.js";

// ================= I18N HELPERS (ระบบ 2 ภาษา) =================
window.globalCatalogData = [];

function getItemName(item) {
  if (window.currentLang === 'en' && item.name_en && item.name_en.trim()) {
    return item.name_en;
  }
  return item.name; // Fallback กลับมาใช้ภาษาไทยถ้าไม่มี EN
}

function getItemDesc(item) {
  if (window.currentLang === 'en' && item.desc_en && item.desc_en.trim()) {
    return item.desc_en;
  }
  return item.desc;
}

// ================= LOAD DATA (ดึงข้อมูล) =================
async function loadCatalog() {
  const container = document.getElementById('catalog-container'); 
  if (!container) return;

  const { data, error } = await supabase
    .from('catalog')
    .select('*')
    .order('order', { ascending: true }); 

  if (error) {
    container.innerHTML = '<div class="loading-text" style="text-align:center; padding:40px;">ไม่สามารถโหลดสินค้าได้ในขณะนี้</div>';
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-state" data-i18n="flipbook.empty" style="text-align:center; padding:40px;">ยังไม่มีสินค้าใน Catalog</div>';
    return;
  }

  // 🔴 เก็บข้อมูลไว้ใช้ตอนกดสลับภาษา
  window.globalCatalogData = data; 

  const validImages = data
    .map(item => item.image)
    .filter(img => img && img !== 'EMPTY');

  container.innerHTML = '<div class="flipbook-loading">กำลังโหลดแคตตาล็อก...</div>';
  
  const TIMEOUT = 8000;
  const loadWithTimeout = (src) => Promise.race([
    new Promise(resolve => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = resolve; 
      img.src = src;
    }),
    new Promise(resolve => setTimeout(resolve, TIMEOUT))
  ]);

  await Promise.allSettled(validImages.map(loadWithTimeout));

  renderFlipbook(data, container);
}


// ================= RENDER FLIPBOOK =================
function renderFlipbook(items, container) {
  // จัดหน้าให้เป็นเลขคู่
  if (items.length % 2 !== 0) {
    items.push({ 
      name: 'Coming Soon',
      name_en: 'Coming Soon', 
      price: '', 
      desc: 'รอพบกับคอลเล็กชันใหม่เร็วๆ นี้', 
      desc_en: 'Stay tuned for our new collection.',
      image: 'https://placehold.co/400x500/fcfbf9/8a9e8c?font=playfair-display&text=Coming+Soon', 
      isPlaceholder: true 
    });
  }

  const pagesHtml = items.map((item, index) => {
    const imgSrc = (item.image && item.image !== 'EMPTY') 
      ? item.image 
      : 'https://placehold.co/400x500/fcfbf9/c9897a?font=playfair-display&text=LadyVenice'; 
      
    const descHtml = (item.desc && item.desc !== 'EMPTY') 
      ? `<p class="product-desc dynamic-desc">${getItemDesc(item)}</p>` 
      : '';
      
    const tagsHtml = (item.flowers && item.flowers.length) 
      ? `<div class="flower-list-italic">
          ${item.flowers.join(', ')}
         </div>`
      : '';
      
    // 🔴 แปะ data-index ไว้ที่ card เพื่อให้อัปเดตได้ตอนกดสลับภาษา
    return `
      <div class="page product-card" data-index="${index}">
        <div class="product-image-wrap">
          <img src="${imgSrc}" alt="">
        </div>
        <div class="product-info">
          <h3 class="product-name dynamic-name">${getItemName(item)}</h3>
          <p class="product-price">${item.price}</p>
          ${tagsHtml}
          ${descHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = pagesHtml;

  const isMobile = window.innerWidth < 768;

  const pageFlip = new St.PageFlip(container, {
    width: isMobile ? window.innerWidth - 40 : 400,
    height: isMobile ? (window.innerWidth - 40) * 1.25 : 500,
    useMouseEvents: true,
    swipeDistance: 15,
    clickEventForward: true,
    showCover: true,
    mobileScrollSupport: false,
    maxShadowOpacity: 0,
    drawShadow: false 
  });

  pageFlip.loadFromHTML(document.querySelectorAll('.page'));

  // ปุ่มบน Desktop
  document.getElementById('btn-prev')?.addEventListener('click', () => pageFlip.flipPrev());
  document.getElementById('btn-next')?.addEventListener('click', () => pageFlip.flipNext());

  // ผูกคำสั่งให้ Swipe Zones
  document.getElementById('swipe-left')?.addEventListener('click', () => pageFlip.flipPrev());
  document.getElementById('swipe-right')?.addEventListener('click', () => pageFlip.flipNext());

  // Mobile Bottom Nav & Page Indicator Logic
  const indicator = document.querySelector('.flipbook-page-indicator');
  
  setTimeout(() => {
    if (indicator) indicator.textContent = `1 / ${pageFlip.getPageCount()}`;
  }, 100);

  pageFlip.on('flip', (e) => {
    if (indicator) {
      const current = e.data + 1;
      const total = pageFlip.getPageCount();
      indicator.textContent = `${current} / ${total}`;
    }
  });

  // ปุ่ม Nav บนมือถือ
  document.querySelector('.flipbook-prev')?.addEventListener('click', () => pageFlip.flipPrev());
  document.querySelector('.flipbook-next')?.addEventListener('click', () => pageFlip.flipNext());

  // Scroll Animation Stagger (Flipbook cards)
  const cards = document.querySelectorAll('.product-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  cards.forEach((card, index) => {
    card.style.transitionDelay = `${(index % 10) * 60}ms`;
    observer.observe(card);
  });
}


// ================= ฟังก์ชันถูกเรียกจาก i18n.js เมื่อกดสลับภาษา =================
window.updateCatalogLanguage = function() {
  const cards = document.querySelectorAll('.product-card[data-index]');
  
  cards.forEach(card => {
    const idx = card.getAttribute('data-index');
    const item = window.globalCatalogData[idx];
    
    if (item) {
      const nameEl = card.querySelector('.dynamic-name');
      const descEl = card.querySelector('.dynamic-desc');
      
      if (nameEl) nameEl.textContent = getItemName(item);
      if (descEl) descEl.textContent = getItemDesc(item);
    }
  });
};


// ================= MAIN ANIMATIONS & INTERACTIONS =================
document.addEventListener("DOMContentLoaded", () => {
  
  // 1. Post-Splash Animations
  const introScreen = document.querySelector('.intro-screen');
  const heroBg = document.querySelector('.hero-bg');
  const publicHeader = document.querySelector('.public-header');
  const heroContent = document.querySelector('.hero-content');

  // ตรวจสอบว่าเคยดู Intro ไปแล้วหรือยัง
  if (sessionStorage.getItem('introPlayed')) {
    setTimeout(() => {
      if (heroContent) heroContent.classList.add('-entered');
      if (publicHeader) publicHeader.classList.add('-enter');
      if (heroBg) heroBg.classList.add('-mounted');
    }, 100);
  } else if (introScreen) {
    introScreen.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'opacity') {
        if (publicHeader) publicHeader.classList.add('-enter');
        if (heroContent) heroContent.classList.add('-entered');
        if (heroBg) heroBg.classList.add('-mounted');
      }
    }, { once: true });
  }

  // 2. Intersection Observer (Scroll Reveal)
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('-entered');
        revealObserver.unobserve(entry.target); 
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));

  // 3. Parallax Hero Effect & Scroll Indicator
  const scrollIndicator = document.querySelector('.scroll-indicator');
  const flipbookSection = document.querySelector('.flipbook-section');
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        // Parallax สำหรับ Desktop
        if (isDesktop && !prefersReduced && heroBg) {
          const heroHeight = window.innerHeight;
          const progress = Math.min(scrollY / heroHeight, 1);
          
          heroBg.style.transform = `scale(1.1) translateY(${scrollY * 0.35}px)`;
          heroBg.style.opacity = 1 - progress * 0.4; 
        }

        // การจัดการลูกศรชี้ลง (Fade out & Disable click)
        if (scrollIndicator) {
          scrollIndicator.style.opacity = Math.max(0, 1 - scrollY / 80);
          scrollIndicator.style.pointerEvents = scrollY > 40 ? 'none' : 'auto';
        }
        
        ticking = false;
      });
      ticking = true;
    }
  });

  // 4. Click to scroll (ลูกศรชี้ลง)
  if (scrollIndicator && flipbookSection) {
    scrollIndicator.addEventListener('click', () => {
      flipbookSection.scrollIntoView({ behavior: 'smooth' });
    });
  }

});

// เริ่มโหลด Catalog ทันทีที่อ่านไฟล์
loadCatalog();