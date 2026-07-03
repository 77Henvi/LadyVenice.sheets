import { supabase } from "./supabase-config.js";

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
    container.innerHTML = '<div class="empty-state" style="text-align:center; padding:40px;">ยังไม่มีสินค้าใน Catalog</div>';
    return;
  }

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

// ... (โค้ด loadCatalog บนสุดเหมือนเดิม) ...

function renderFlipbook(items, container) {
  if (items.length % 2 !== 0) {
    items.push({ 
      name: 'Coming Soon', 
      price: '', 
      desc: 'รอพบกับคอลเล็กชันใหม่เร็วๆ นี้', 
      image: 'https://placehold.co/400x500/fcfbf9/8a9e8c?font=playfair-display&text=Coming+Soon', 
      isPlaceholder: true 
    });
  }

  const pagesHtml = items.map(item => {
    const imgSrc = (item.image && item.image !== 'EMPTY') 
      ? item.image 
      : 'https://placehold.co/400x500/fcfbf9/c9897a?font=playfair-display&text=LadyVenice'; 
      
    const descHtml = (item.desc && item.desc !== 'EMPTY') 
      ? `<p class="product-desc">${item.desc}</p>` 
      : '';
      
    const tagsHtml = (item.flowers && item.flowers.length) 
      ? `<div class="flower-list-italic">
          ${item.flowers.join(', ')}
         </div>`
      : '';
    return `
      <div class="page product-card">
        <div class="product-image-wrap">
          <img src="${imgSrc}" alt="${item.name}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${item.name}</h3>
          <p class="product-price">${item.price}</p>
          ${tagsHtml}
          ${descHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = pagesHtml;

  const isMobile = window.innerWidth < 768;

  // 🔴 2. อัปเดต swipeDistance เป็น 15
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

  // 🔴 3. ผูกคำสั่งให้ Swipe Zones
  document.getElementById('swipe-left')?.addEventListener('click', () => pageFlip.flipPrev());
  document.getElementById('swipe-right')?.addEventListener('click', () => pageFlip.flipNext());

  // 🔴 4. Mobile Bottom Nav & Page Indicator Logic
  const indicator = document.querySelector('.flipbook-page-indicator');
  
  // อัปเดตเลขหน้าตอนเริ่มต้น (ต้องรอให้ load จบก่อน 1 จังหวะ)
  setTimeout(() => {
    if (indicator) indicator.textContent = `1 / ${pageFlip.getPageCount()}`;
  }, 100);

  // อัปเดตเลขหน้าตอนกำลังพลิก
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

  // Scroll Animation Stagger
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


// ================= PHASE 2: HERO, PARALLAX & SNAP LOGIC (v3.0) =================
document.addEventListener('DOMContentLoaded', () => {
  const heroContent = document.querySelector('.hero-content');
  const introScreen = document.getElementById('introScreen');
  
  // 1. Event-driven Fade-in
  if (sessionStorage.getItem('introPlayed')) {
    setTimeout(() => heroContent.classList.add('-entered'), 100);
  } else if (introScreen) {
    introScreen.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'opacity') {
        heroContent.classList.add('-entered');
      }
    }, { once: true });
  }

  // 2. Parallax (Desktop Only)
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const heroBg = document.querySelector('.hero-bg img');
  let ticking = false;

  if (isDesktop && !prefersReduced && heroBg) {
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          heroBg.style.transform = `scale(1.1) translateY(${scrollY * 0.35}px)`;
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // 3. Scroll Indicator (Fade Out & Smooth Scroll)
  const scrollIndicator = document.getElementById('scrollIndicator');
  const flipbookSection = document.querySelector('.flipbook-section');

  if (scrollIndicator) {
    // Fade out
    window.addEventListener('scroll', () => {
      scrollIndicator.style.opacity = Math.max(0, 1 - window.scrollY / 80);
      scrollIndicator.style.pointerEvents = window.scrollY > 40 ? 'none' : 'auto';
    });

    // Click to scroll
    if (flipbookSection) {
      scrollIndicator.addEventListener('click', () => {
        flipbookSection.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }
});

// เริ่มโหลด Catalog
loadCatalog();