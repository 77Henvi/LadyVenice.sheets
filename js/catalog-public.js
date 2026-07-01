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

  // 🔴 1. กรองคำว่า 'EMPTY' ออกจาก Preloader
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

  // ส่ง data และ container ไปเรนเดอร์
  renderFlipbook(data, container);
}

function renderFlipbook(items, container) {
  // 🔴 2. ถ้าสินค้ามีหน้าเดียว (คี่) ต้องเติมหน้าว่างให้ PageFlip ไม่พัง!
  if (items.length % 2 !== 0) {
    items.push({ 
      name: 'Coming Soon', 
      price: '', 
      desc: 'รอพบกับคอลเล็กชันใหม่เร็วๆ นี้', 
      image: 'EMPTY',
      isPlaceholder: true 
    });
  }

  // 🔴 3. เช็กคำว่า EMPTY เพื่อสลับไปใช้ Placeholder
  const pagesHtml = items.map(item => {
    const imgSrc = (item.image && item.image !== 'EMPTY') 
      ? item.image 
      : 'https://via.placeholder.com/400x500?text=LadyVenice';
      
    const descHtml = (item.desc && item.desc !== 'EMPTY') 
      ? `<p class="product-desc">${item.desc}</p>` 
      : '';

    return `
      <div class="page product-card">
        <div class="product-image-wrap">
          <img src="${imgSrc}" alt="${item.name}">
        </div>
        <div class="product-info">
          <h3 class="product-name">${item.name}</h3>
          <p class="product-price">${item.price}</p>
          ${descHtml}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = pagesHtml;

  const pageFlip = new St.PageFlip(container, {
    width: 400,
    height: 500,
    size: "stretch",
    minWidth: 315,
    maxWidth: 1000,
    minHeight: 420,
    maxHeight: 1350,
    maxShadowOpacity: 0.5,
    showCover: true,
    mobileScrollSupport: false,
    useMouseEvents: true,
    swipeDistance: 30,
    clickEventForward: true
  });

  pageFlip.loadFromHTML(document.querySelectorAll('.page'));

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


loadCatalog();