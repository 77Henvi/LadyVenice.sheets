import { supabase } from "./supabase-config.js";
async function loadCatalog() {
  const container = document.getElementById('catalog-container'); 
  
  if (!container) {
      console.error("❌ หา 'catalog-container' ไม่เจอ รบกวนเช็ก ID ในหน้า HTML ครับ!");
      return; 
  }

  const { data, error } = await supabase
    .from('catalog')
    .select('*')
    .order('order', { ascending: true }); 

  if (error) {
    container.innerHTML = '<div class="loading-text" style="text-align:center; padding:40px;">ไม่สามารถโหลดสินค้าได้ในขณะนี้</div>';
    console.error('Supabase error:', error);
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<div class="empty-state" style="text-align:center; padding:40px;">ยังไม่มีสินค้าใน Catalog</div>';
    return;
  }

  const images = data.map(item => item.image).filter(Boolean);
  
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

  await Promise.allSettled(images.map(loadWithTimeout));


  renderFlipbook(data);
}

function renderFlipbook(items) {
  container.innerHTML = ''; 
  
  const pagesHtml = items.map(item => `
    <div class="page product-card">
      <div class="product-image-wrap">
        <img src="${item.image || 'https://via.placeholder.com/400x500?text=No+Image'}" alt="${item.name}">
      </div>
      <div class="product-info">
        <h3 class="product-name">${item.name}</h3>
        <p class="product-price">${item.price}</p>
        ${item.desc ? `<p class="product-desc">${item.desc}</p>` : ''}
      </div>
    </div>
  `).join('');

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


  const cards = document.querySelectorAll('.product-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  cards.forEach((card, index) => {
    card.style.transitionDelay = `${(index % 10) * 60}ms`; // ใช้ modulo กัน delay นานเกินถ้าหน้าเยอะ
    observer.observe(card);
  });
}


loadCatalog();