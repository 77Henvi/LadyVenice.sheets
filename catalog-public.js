// catalog-public.js
import { onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { colCatalog } from "./firebase-config.js";

let publicData = [];
let bookInstance = null; 

// 1. ดึงข้อมูลจาก Firestore แบบ Realtime
const qCatalog = query(colCatalog, orderBy("order", "asc"));

onSnapshot(qCatalog, snap => {
  publicData = [];
  snap.forEach(d => publicData.push({ id: d.id, ...d.data() }));
  renderFlipbook(); 
});

// 2. ฟังก์ชันสร้าง Flipbook
function renderFlipbook() {
  const container = document.getElementById('public-catalog-list') || document.getElementById('flipbook-container');
  if (!container) return;

  if (!publicData.length) {
    container.innerHTML = '<div class="loading-text" style="text-align:center; padding: 40px;">No items available at the moment.</div>';
    return;
  }

  // หั่นสินค้าออกเป็นกองๆ กองละ 4 ชิ้น
  const itemsPerPage = 4;
  const pages = [];
  for (let i = 0; i < publicData.length; i += itemsPerPage) {
    pages.push(publicData.slice(i, i + itemsPerPage));
  }

  // เริ่มสร้าง HTML ของหน้าหนังสือ
  let html = `
    <div class="page page-cover" style="background: #FDFCFB; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px solid #EBEBEB;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; margin-bottom: 8px;">LADY VENICE</h2>
      <div style="font-size: 10px; letter-spacing: 4px; color: #767676;">COLLECTION</div>
    </div>
  `;

  pages.forEach((pageItems, index) => {
    html += `
      <div class="page" style="background: #FFFFFF; border: 1px solid #EEEEEE; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.02);">
        <div class="page-content" style="padding: 24px; height: 100%; display: flex; flex-direction: column;">
          
          <div class="page-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; row-gap: 24px; flex-grow: 1;">
            ${pageItems.map(item => `
              <div class="product-card" onclick="openProductModal('${item.id}')" style="cursor: pointer;">
                <div class="product-image-wrap" style="aspect-ratio: 4/5; background: #F7F7F7; margin-bottom: 8px; overflow: hidden;">
                  <img src="${item.image || 'https://via.placeholder.com/400'}" alt="${item.name}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                </div>
                <div class="product-info" style="text-align: left;">
                  <div class="product-name" style="font-family: 'Playfair Display', serif; font-size: 12px; margin-bottom: 4px;">${item.name}</div>
                  <div class="product-price" style="font-size: 11px; color: #767676;">${item.price}</div>
                </div>
              </div>
            `).join('')}
          </div>
          
          <div class="page-footer" style="text-align: center; font-size: 10px; color: #999; margin-top: 16px; font-family: 'Playfair Display', serif;">
            - ${index + 1} -
          </div>
        </div>
      </div>
    `;
  });

  // ถ้าหน้าเนื้อหาเป็นเลขคี่ เติมกระดาษเปล่าให้ปกหลังปิดได้สวยๆ
  if (pages.length % 2 !== 0) {
    html += `<div class="page" style="background: #FFFFFF; border: 1px solid #EEEEEE;"></div>`;
  }

  html += `
    <div class="page page-cover" style="background: #FDFCFB; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px solid #EBEBEB;">
      <div style="font-size: 12px; letter-spacing: 2px; color: #767676;">WWW.LADYVENICE.APP</div>
    </div>
  `;

  container.innerHTML = html;
  container.className = ''; 

  // 3. ปลุกชีพ PageFlip 
  if (bookInstance) {
    bookInstance.destroy(); 
  }

  if (typeof St !== 'undefined' && St.PageFlip) {
    bookInstance = new St.PageFlip(container, {
      width: 350,       
      height: 520,      
      size: "stretch",  
      minWidth: 300,
      maxWidth: 500,
      minHeight: 400,
      maxHeight: 700,
      maxShadowOpacity: 0.3, 
      showCover: true,       
      mobileScrollSupport: false, 
      usePortrait: true      
    });

    bookInstance.loadFromHTML(container.querySelectorAll('.page'));
  } else {
    console.error("PageFlip library ไม่ทำงาน กรุณาเช็กว่าใส่ <script> ใน HTML แล้วหรือยัง");
  }
}

// 4. ฟังก์ชันจัดการ Modal ย่อขยายรายละเอียดสินค้า
window.openProductModal = function(id) {
  const item = publicData.find(x => x.id === id);
  if (!item) return;

  document.getElementById('modal-img').src = item.image || 'https://via.placeholder.com/400';
  document.getElementById('modal-title').textContent = item.name;
  document.getElementById('modal-price').textContent = item.price;
  
  const descEl = document.getElementById('modal-desc');
  if (item.desc) {
    descEl.textContent = item.desc;
    descEl.style.display = 'block';
  } else {
    descEl.style.display = 'none';
  }

  document.getElementById('public-product-modal').classList.add('open');
  if (typeof lucide !== 'undefined') lucide.createIcons(); 
};