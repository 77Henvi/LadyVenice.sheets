import { supabase } from "./supabase-config.js";

// ================= I18N HELPERS (ระบบ 2 ภาษา) =================
window.globalCatalogData = [];

// 🔴 1. Fallback เผื่อกรณี i18n.js โหลดไม่ทัน/ไม่ถูกโหลด: ให้ยังมี preset เป็น 'dual' อยู่ดี
// (ปกติ window.currentLang จะถูกกำหนดโดย i18n.js ไปแล้วก่อนไฟล์นี้รันเสมอ)
if (!window.currentLang) {
  const savedLang = localStorage.getItem('lang');
  window.currentLang = savedLang || 'dual';
}

// 🔴 2. ฟังก์ชันดึงชื่อ (ห้ามลบฟังก์ชันนี้เด็ดขาด)
function getItemName(item) {
  // 🔴 ถ้าเลือกภาษาไทยล้วน ให้โชว์ไทยล้วน นอกนั้น (dual = preset ต้อนรับ, หรือ en) ให้บังคับเป็น EN ล้วน
  if (window.currentLang === 'th') {
    return item.name;
  }
  return (item.name_en && item.name_en.trim()) ? item.name_en : (item.name || '');
}

// 🔴 3. ฟังก์ชันดึงรายละเอียด
function getItemDesc(item) {
  // 🔴 ถ้าเลือกภาษาไทยล้วน ให้โชว์ไทยล้วน นอกนั้น (dual = preset ต้อนรับ, หรือ en) ให้บังคับเป็น EN ล้วน
  if (window.currentLang === 'th') {
    return item.desc;
  }
  return (item.desc_en && item.desc_en.trim()) ? item.desc_en : (item.desc || '');
}

const FLOWER_TRANSLATIONS = {
  "ลิลลี่": "Lily",
  "ลิลลี่วินเทจ": "Vintage Lily",
  "Lily of the valley": "Lily of the Valley",
  "กุหลาบโลลิต้า": "Lolita Rose",
  "กุหลาบกำมะหยี่": "Velvet Rose",
  "กุหลาบปารีส": "Paris Rose",
  "กุหลาบขอบเผา (vintage Rose)": "Vintage Rose",
  "กุหลาบเรนัน": "Ranunculus",
  "กุหลาบ": "Rose",
  "Snow flake hibiscus rose": "Snowflake Hibiscus",
  "ฟาแลน": "Phalaenopsis",
  "ฟาแลนผีเสื้อ": "Butterfly Phalaenopsis",
  "ฟาแลนวินเทจ": "Vintage Phalaenopsis",
  "ผีเสื้อคอสมอส": "Cosmos",
  "คอสมอส": "Cosmos",
  "สไปเดอร์ มัม": "Spider Mum",
  "คาเนชั่น": "Carnation",
  "คาร์เนชั่น": "Carnation", 
  "ดาเรีย สเปรย์": "Spray Dahlia",
  "ดาเรีย": "Dahlia",
  "ก้านยูคาแอปเปิ้ล": "Apple Eucalyptus",
  "เดลฟีเนียม": "Delphinium", 
  "เดลฟีเนี่ยม": "Delphinium", 
  "เยอบีร่า": "Gerbera",
  "ดอกหน้าวัว": "Anthurium",
  "พีโอนี่": "Peony",
  "พีโอนี่แฟนซี": "Fancy Peony",
  "ทิวลิป": "Tulip",
  "ดอกผักโขม": "Amaranthus",
  "ไฮเดรนเยีย": "Hydrangea",
  "ไฮเดรนเยียวินเทจ": "Vintage Hydrangea",
  "สน": "Pine",
  "เบญจมาศ": "Chrysanthemum",
  "ปอม": "Pom Pom"
};

function getFlowerString(item) {
  if (!item.flowers) return '';
  
  let flowerArray = Array.isArray(item.flowers) ? item.flowers : item.flowers.split(',');
  if (!flowerArray.length) return '';

  if (window.currentLang === 'th') {
    return flowerArray.map(f => f.trim()).join(', ');
  }
  
  return flowerArray.map(f => {
    const cleanName = f.trim(); 
    return FLOWER_TRANSLATIONS[cleanName] || cleanName;
  }).join(', ');
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
    container.innerHTML = '<div class="empty-state" style="text-align:center; padding:40px;">ยังไม่มีสินค้าใน Catalog</div>';
    return;
  }

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

// ================= RENDER FLIPBOOK  =================
function renderFlipbook(items, container) {
  const flipbookItems = [{ isCover: true, realIndex: -1 }];
  
  items.forEach((item, i) => {
    flipbookItems.push({ ...item, realIndex: i });
  });

  if (flipbookItems.length % 2 !== 0) {
    flipbookItems.push({ 
      name: 'Coming Soon',
      name_en: 'Coming Soon', 
      price: '', 
      desc: 'รอพบกับคอลเล็กชันใหม่เร็วๆ นี้', 
      desc_en: 'Stay tuned for our new collection.',
      image: 'https://placehold.co/400x500/fcfbf9/8a9e8c?font=playfair-display&text=Coming+Soon', 
      isPlaceholder: true,
      realIndex: -1
    });
  }

  const pagesHtml = flipbookItems.map((item) => {
    if (item.isCover) {
      return `
        <div class="page cover-page" data-index="cover">
          <div class="cover-inner-border">
            <h1 class="cover-title">LadyVenice</h1>
          </div>
        </div>
      `;
    }

    const imgSrc = (item.image && item.image !== 'EMPTY') 
      ? item.image 
      : 'https://placehold.co/400x500/fcfbf9/c9897a?font=playfair-display&text=LadyVenice'; 
      
    const descHtml = (item.desc && item.desc !== 'EMPTY') 
      ? `<p class="product-desc dynamic-desc">${getItemDesc(item)}</p>` 
      : '';
      
    const tagsHtml = (item.flowers && item.flowers.length) 
      ? `<div class="flower-list-italic dynamic-flowers">
          ${getFlowerString(item)}
         </div>`
      : '';
      
    return `
      <div class="page product-card" data-index="${item.realIndex}">
        <div class="product-image-wrap">
          <img src="${imgSrc}" alt="" class="zoomable-img" style="cursor: pointer;">
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

  // 🟢 ผูก Event ให้รูปคลิกแล้วเด้งป๊อปอัป (อัปเดตแก้บั๊ก Desktop ทะลุ / Mobile กดไม่ติด)
  // 🟢 ผูก Event ให้รูปคลิกแล้วเด้งป๊อปอัป (แก้บั๊กคลิกรูปแล้วหน้าพลิกเด็ดขาด 100%)
  setTimeout(() => {
    const zoomableImages = container.querySelectorAll('.zoomable-img');
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    zoomableImages.forEach(img => {
      // 1. สกัดกั้นไม่ให้ PageFlip รับรู้การเริ่มกด/สัมผัสบนรูปภาพ
      const blockFlip = (e) => {
        e.stopPropagation(); 
      };
      
      // ดักจับทุกรูปแบบการกด (เมาส์, นิ้ว, การทัชบนมือถือ)
      img.addEventListener('mousedown', blockFlip);
      img.addEventListener('pointerdown', blockFlip);
      img.addEventListener('touchstart', blockFlip, { passive: true });

      // 2. เมื่อคลิก/แตะที่รูปเสร็จ ให้เปิดป๊อปอัปอย่างเดียว
      img.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        if (modal && modalImage) {
          modalImage.src = this.src; 
          modal.classList.add('open');
        }
      });
    });
  }, 100);

  const isMobile = window.innerWidth < 768;

  const pageWidth  = isMobile ? window.innerWidth - 40 : 400;
  const pageHeight = isMobile
    ? Math.min(pageWidth * 1.25, window.innerHeight * 0.65)
    : 500;

  const pageFlip = new St.PageFlip(container, {
    width: pageWidth,
    height: pageHeight,
    useMouseEvents: true,
    swipeDistance: 15,
    clickEventForward: true,
    showCover: true, 
    mobileScrollSupport: false,
    drawShadow: false,          
    maxShadowOpacity: 0.5,     
    showPageCorners: true,     
    flippingTime: 1200         
  });

  pageFlip.loadFromHTML(document.querySelectorAll('.page'));

  // 🔧 บั๊ก: resize ยิงซ้ำ (เช่น ตอนเปิด/ปิด dropdown ภาษาแล้ว viewport ขยับ) ทำให้
  // updateFromHtml ถูกเรียกซ้อนและหน้าการ์ดถูกเพิ่มสะสมทีละใบ (22 -> 23 -> ...)
  // แก้ด้วย debounce + เช็คจำนวนหน้าก่อนค่อย update จริง
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const pages = document.querySelectorAll('.page');
      if (pages.length === pageFlip.getPageCount()) {
        pageFlip.updateFromHtml(pages);
      }
    }, 200);
  });

  document.getElementById('btn-prev')?.addEventListener('click', () => pageFlip.flipPrev('bottom'));
  document.getElementById('btn-next')?.addEventListener('click', () => pageFlip.flipNext('bottom'));
  document.getElementById('swipe-left')?.addEventListener('click', () => pageFlip.flipPrev('bottom'));
  document.getElementById('swipe-right')?.addEventListener('click', () => pageFlip.flipNext('bottom'));
  document.querySelector('.flipbook-prev')?.addEventListener('click', () => pageFlip.flipPrev('bottom'));
  document.querySelector('.flipbook-next')?.addEventListener('click', () => pageFlip.flipNext('bottom'));

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

  const cards = document.querySelectorAll('.page');
  cards.forEach((card, index) => {
    card.style.transitionDelay = `${(index % 10) * 60}ms`; 
    setTimeout(() => {
      card.classList.add('visible');
    }, 150);
  });
}

// ================= ฟังก์ชันถูกเรียกจาก i18n.js เมื่อกดสลับภาษา =================
window.updateCatalogLanguage = function() {
  const cards = document.querySelectorAll('.product-card[data-index]');
  
  cards.forEach(card => {
    const idx = card.getAttribute('data-index');
    
    if (!idx || idx === 'cover' || idx === '-1') return; 
    
    const item = window.globalCatalogData[idx];
    
    if (item) {
      const nameEl = card.querySelector('.dynamic-name');
      const descEl = card.querySelector('.dynamic-desc');
      const flowersEl = card.querySelector('.dynamic-flowers'); 
      
      if (nameEl) nameEl.innerHTML = getItemName(item);
      if (descEl) descEl.innerHTML = getItemDesc(item);
      if (flowersEl) flowersEl.innerHTML = getFlowerString(item); 
    }
  });
};

// ================= MAIN ANIMATIONS & INTERACTIONS =================
document.addEventListener("DOMContentLoaded", () => {
  const introScreen = document.querySelector('.intro-screen');
  const heroBg = document.querySelector('.hero-bg');
  const publicHeader = document.querySelector('.public-header');
  const heroContent = document.querySelector('.hero-content');

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

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('-entered');
        revealObserver.unobserve(entry.target); 
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.scroll-reveal').forEach(el => revealObserver.observe(el));

  const scrollIndicator = document.querySelector('.scroll-indicator');
  const flipbookSection = document.querySelector('.flipbook-section');
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        
        if (isDesktop && !prefersReduced && heroBg) {
          const heroHeight = window.innerHeight;
          const progress = Math.min(scrollY / heroHeight, 1);
          heroBg.style.transform = `scale(1.1) translateY(${scrollY * 0.35}px)`;
          heroBg.style.opacity = 1 - progress * 0.4; 
        }

        if (scrollIndicator) {
          scrollIndicator.style.opacity = Math.max(0, 1 - scrollY / 80);
          scrollIndicator.style.pointerEvents = scrollY > 40 ? 'none' : 'auto';
        }
        
        ticking = false;
      });
      ticking = true;
    }
  });

  if (scrollIndicator && flipbookSection) {
    scrollIndicator.addEventListener('click', () => {
      flipbookSection.scrollIntoView({ behavior: 'smooth' });
    });
  }
});

loadCatalog();

// 🟢 ================= IMAGE MODAL (ป๊อปอัปดูรูปเต็ม) ================= 🟢
function createModal() {
  if (document.getElementById('imageModal')) return; // กันสร้างซ้ำ
  const modalHtml = `
    <div class="public-modal-overlay" id="imageModal">
      <div class="public-modal-content">
        <button class="btn-close-modal" id="closeModalBtn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
        <div class="modal-image-wrap">
          <img src="" alt="Full Image" id="modalImage">
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const modal = document.getElementById('imageModal');
  const closeBtn = document.getElementById('closeModalBtn');

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
}
createModal();