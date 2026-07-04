// js/i18n.js

const TRANSLATIONS = {
  th: {
    'header.subtitle': 'COLLECTION',
    'hero.subtitle': 'MADE FOR YOU',
    'hero.scroll': 'เลื่อนดู',
    'info.delivery.title': 'รายละเอียดการจัดส่ง',
    'info.delivery.ems': 'EMS: 130 บาท',
    'info.delivery.grab': 'Grab / LINE MAN / Bolt / Lalamove',
    'info.delivery.grab.sub': '(ค่าส่งตามระยะทาง)',
    'info.pricing.title': 'ราคา & ขนาด',
    'info.pricing.desc': 'ราคาที่แสดงในแคตตาล็อกเป็น <strong>ขนาด L (ช่อใหญ่)</strong><br>สามารถปรับขนาดได้ S / M / L',
    'info.custom': '* ราคาอาจแตกต่างตามขนาดและชนิดดอกไม้<br>(สามารถ Custom ได้)',
    'collection.title': 'OUR COLLECTION',
    'modal.close': 'ปิด',
    'modal.size': 'ขนาด: S / M / L',
    'modal.custom': 'สั่งแบบ Custom',
    'footer.rights': '© 2026 LADYVENICE. ALL RIGHTS RESERVED.',
    'flipbook.empty': 'ยังไม่มีสินค้าใน Catalog',
    'flipbook.prev': 'ก่อนหน้า',
    'flipbook.next': 'ถัดไป',
  },
  en: {
    'header.subtitle': 'COLLECTION',
    'hero.subtitle': 'MADE FOR YOU',
    'hero.scroll': 'Scroll',
    'info.delivery.title': 'Delivery Information',
    'info.delivery.ems': 'EMS: 130 THB',
    'info.delivery.grab': 'Grab / LINE MAN / Bolt / Lalamove',
    'info.delivery.grab.sub': '(Distance-based pricing)',
    'info.pricing.title': 'Pricing & Customization',
    'info.pricing.desc': 'Displayed prices are based on <strong>L size (Large)</strong>.<br>Available in S / M / L sizes.',
    'info.custom': '* Prices may vary by size and flower selection.<br>(Custom orders available)',
    'collection.title': 'OUR COLLECTION',
    'modal.close': 'Close',
    'modal.size': 'Size: S / M / L',
    'modal.custom': 'Order Custom',
    'footer.rights': '© 2026 LADYVENICE. ALL RIGHTS RESERVED.',
    'flipbook.empty': 'No items in Catalog yet',
    'flipbook.prev': 'Previous',
    'flipbook.next': 'Next',
  }
};

window.currentLang = 'th'; // Default

window.setLang = function(lang) {
  window.currentLang = lang;

  // 1. Update text based on data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = TRANSLATIONS[lang][key];
    if (text) {
      el.innerHTML = text; // ใช้ innerHTML เพื่อรองรับ <strong>, <br> ตามดีไซน์
    }
  });

  // 2. Update toggle button label
  const langLabel = document.getElementById('langLabel');
  if (langLabel) langLabel.textContent = lang === 'th' ? 'EN' : 'TH';
  
  const langToggle = document.getElementById('langToggle');
  if (langToggle) langToggle.classList.toggle('-active', lang === 'en');

  // 3. Update HTML lang attribute
  document.documentElement.lang = lang === 'th' ? 'th' : 'en';

  // 4. Update Catalog Items (ถ้าโหลดข้อมูลเสร็จแล้ว)
  if (typeof window.updateCatalogLanguage === 'function') {
    window.updateCatalogLanguage();
  }
};

window.toggleLang = function() {
  window.setLang(window.currentLang === 'th' ? 'en' : 'th');
};

document.addEventListener('DOMContentLoaded', () => {
  window.setLang('th');
});