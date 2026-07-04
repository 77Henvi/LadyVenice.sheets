// catalog-admin.js
import { supabase } from "./supabase-config.js";

let catalogData = [];

// ==========================================
// FLOWER TAGS SYSTEM
// ==========================================
const FLOWER_LIST = [
  "ลิลลี่", "ลิลลี่วินเทจ", "Lily of the valley", "กุหลาบโลลิต้า",
  "กุหลาบกำมะหยี่", "กุหลาบปารีส", "กุหลาบขอบเผา (vintage Rose)",
  "กุหลาบเรนัน", "กุหลาบ", "Snow flake hibiscus rose", "ฟาแลน",
  "ฟาแลนผีเสื้อ", "ฟาแลนวินเทจ", "ผีเสื้อคอสมอส", "คอสมอส",
  "สไปเดอร์ มัม", "คาเนชั่น", "ดาเรีย สเปรย์", "ดาเรีย",
  "ก้านยูคาแอปเปิ้ล", "เดลฟีเนี่ยม", "เยอบีร่า", "ดอกหน้าวัว",
  "พีโอนี่", "พีโอนี่แฟนซี", "ทิวลิป", "ดอกผักโขม", "ไฮเดรนเยีย",
  "ไฮเดรนเยียวินเทจ", "สน", "เบญจมาศ", "ปอม"
];

function renderFlowerCheckboxes(selectedFlowers = []) {
  const list = document.getElementById('flower-checkbox-list');
  if (!list) return;
  list.innerHTML = FLOWER_LIST.map(flower => `
    <label class="flower-checkbox-item">
      <input type="checkbox"
        value="${flower}"
        ${selectedFlowers.includes(flower) ? 'checked' : ''}
        onchange="updateFlowerTags()">
      <label>${flower}</label>
    </label>
  `).join('');
}

window.updateFlowerTags = function() {
  const checked = [...document.querySelectorAll('#flower-checkbox-list input:checked')]
    .map(cb => cb.value);

  const preview = document.getElementById('flower-tags-preview');
  if (!preview) return;
  preview.innerHTML = checked.length
    ? checked.map(flower => `
        <span class="flower-tag">
          ${flower}
          <span class="flower-tag-remove"
            onclick="uncheckFlower('${flower}')">×</span>
        </span>
      `).join('')
    : '';
};

window.uncheckFlower = function(flower) {
  const cb = document.querySelector(`#flower-checkbox-list input[value="${flower}"]`);
  if (cb) { 
    cb.checked = false; 
    updateFlowerTags(); 
  }
};

// Search filter logic
document.addEventListener('DOMContentLoaded', () => {
  const flowerSearchInput = document.getElementById('flower-search');
  if (flowerSearchInput) {
    flowerSearchInput.addEventListener('input', function() {
      const q = this.value.toLowerCase();
      document.querySelectorAll('.flower-checkbox-item').forEach(item => {
        const name = item.querySelector('label').textContent.toLowerCase();
        item.style.display = name.includes(q) ? '' : 'none';
      });
    });
  }
});

function getSelectedFlowers() {
  return [...document.querySelectorAll('#flower-checkbox-list input:checked')]
    .map(cb => cb.value);
}

function resetFlowerCheckboxes() {
  renderFlowerCheckboxes([]);
  const preview = document.getElementById('flower-tags-preview');
  if (preview) preview.innerHTML = '';
  const search = document.getElementById('flower-search');
  if (search) search.value = '';
}

function loadFlowerCheckboxes(existingFlowers = []) {
  renderFlowerCheckboxes(existingFlowers || []);
  updateFlowerTags();
}


// ==========================================
// MAIN ADMIN SYSTEM
// ==========================================

// ===== 1. ดึงข้อมูลมาโชว์ในหน้า ADMIN =====
async function loadCatalog() {
  const { data, error } = await supabase.from('catalog').select('*').order('order', { ascending: true });
  if (!error && data) {
    catalogData = data;
    renderCatalog();
  }
}
loadCatalog(); // โหลดข้อมูลทันทีเมื่อเปิดหน้า

function renderCatalog() {
  const el = document.getElementById('catalog-list');
  if (!el) return;

  if (!catalogData.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🌸</div><div class="empty-text">ยังไม่มีสินค้าใน Catalog</div></div>';
    return;
  }

  el.innerHTML = catalogData.map((c, index) => {
    const imgSrc = (c.image && c.image !== 'EMPTY') ? c.image : 'https://placehold.co/60x60/f0eee9/8a9e8c?text=No+Img';
    
    return `
    <div class="item-card catalog-item" draggable="true" data-id="${c.id}" data-index="${index}" ondragstart="handleDragStart(event)" ondragover="handleDragOver(event)" ondrop="handleDrop(event)">
      <div class="item-card-left" style="align-items: center; gap: 12px; cursor: grab;">
        <div style="font-size: 20px; color: #ccc;">⋮⋮</div>
        <img src="${imgSrc}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
        <div>
          <div class="item-name">${c.name}</div>
          <div class="item-sub">${c.price}</div>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn-icon" onclick="editCatalog('${c.id}')">✏️</button>
        <button class="btn-icon danger" onclick="deleteCatalog('${c.id}')">🗑</button>
      </div>
    </div>`
  }).join('');
}

// ===== 2. จัดการหน้าต่าง MODAL =====
window.openCatalogModal = function() {
  document.getElementById('catalog-edit-id').value = '';
  document.getElementById('catalog-modal-title').textContent = 'เพิ่มสินค้า Catalog';
  
  // Clear ข้อมูลเดิมออกทั้งหมด
  document.getElementById('catalog-name').value = '';
  document.getElementById('catalog-name-en').value = ''; // 🔴 เคลียร์ค่า EN
  document.getElementById('catalog-price').value = '';
  document.getElementById('catalog-desc').value = '';
  document.getElementById('catalog-desc-en').value = ''; // 🔴 เคลียร์ค่า EN
  
  document.getElementById('catalog-image').value = '';
  document.getElementById('catalog-image-preview').style.display = 'none';
  
  resetFlowerCheckboxes();
  
  const btn = document.getElementById('btn-save-catalog');
  btn.textContent = 'บันทึก';
  btn.disabled = false;
  openModal('modal-catalog');
};

window.editCatalog = function(id) {
  const c = catalogData.find(x => x.id === id);
  if (!c) return;

  document.getElementById('catalog-edit-id').value = id;
  document.getElementById('catalog-modal-title').textContent = 'แก้ไขสินค้า Catalog';
  
  // ดึงข้อมูลเดิมมาแสดงใน Modal
  document.getElementById('catalog-name').value = c.name;
  document.getElementById('catalog-name-en').value = c.name_en || ''; // 🔴 ดึงค่า EN
  document.getElementById('catalog-price').value = c.price;
  document.getElementById('catalog-desc').value = c.desc || '';
  document.getElementById('catalog-desc-en').value = c.desc_en || ''; // 🔴 ดึงค่า EN
  
  document.getElementById('catalog-image').value = '';
  
  const preview = document.getElementById('catalog-image-preview');
  if (c.image && c.image !== 'EMPTY') {
    preview.src = c.image;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }

  loadFlowerCheckboxes(c.flowers);

  const btn = document.getElementById('btn-save-catalog');
  btn.textContent = 'บันทึก';
  btn.disabled = false;
  openModal('modal-catalog');
};

// ===== 3. บันทึกข้อมูล (UPLOAD รูปเข้า SUPABASE + SAVE) =====
window.saveCatalog = async function() {
  // ดึงค่าจาก Input ทั้งหมด
  const name = document.getElementById('catalog-name').value.trim();
  const name_en = document.getElementById('catalog-name-en').value.trim(); // 🔴 รับค่า EN
  const price = document.getElementById('catalog-price').value.trim();
  const desc = document.getElementById('catalog-desc').value.trim();
  const desc_en = document.getElementById('catalog-desc-en').value.trim(); // 🔴 รับค่า EN
  
  const fileInput = document.getElementById('catalog-image');
  const file = fileInput.files[0];
  const id = document.getElementById('catalog-edit-id').value;

  if (!name || !price) return alert('กรุณากรอกชื่อสินค้าและราคา');
  if (!id && !file) return alert('กรุณาอัปโหลดรูปภาพสำหรับสินค้าใหม่');

  const btn = document.getElementById('btn-save-catalog');
  btn.textContent = 'กำลังบันทึก...';
  btn.disabled = true;

  try {
    let imageUrl = '';
    
    // ถ้ามีการเลือกไฟล์รูปใหม่ ให้อัปโหลดขึ้น Supabase Storage ก่อน
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
          .from('catalog-images')
          .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('catalog-images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;
    }
    
    const selectedFlowers = getSelectedFlowers();

    if (id) {
      // โหมดแก้ไข: เพิ่ม name_en, desc_en เข้าไปใน updateData
      const updateData = { 
        name, 
        name_en, 
        price, 
        desc, 
        desc_en, 
        flowers: selectedFlowers 
      }; 
      if (imageUrl) updateData.image = imageUrl;
      
      await supabase.from('catalog').update(updateData).eq('id', id);
    } else {
      // โหมดเพิ่มใหม่: เพิ่ม name_en, desc_en เข้าไปตอน insert
      const maxOrder = catalogData.length > 0 ? Math.max(...catalogData.map(c => c.order || 0)) : 0;
      await supabase.from('catalog').insert([{ 
        name, 
        name_en,
        price, 
        desc, 
        desc_en,
        "order": maxOrder + 1, 
        image: imageUrl || 'EMPTY',
        flowers: selectedFlowers
      }]);
    }
    
    closeModal('modal-catalog');
    loadCatalog(); 
  } catch (error) {
    console.error("Error saving catalog: ", error);
    alert('เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
  } finally {
    btn.textContent = 'บันทึก';
    btn.disabled = false;
  }
};



// ===== 4. ลบข้อมูล =====
window.deleteCatalog = async function(id) {
  if (!confirm('ยืนยันการลบสินค้านี้ออกจาก Catalog สาธารณะ?')) return;
  try {
    await supabase.from('catalog').delete().eq('id', id);
    loadCatalog();
  } catch (error) {
    console.error("Error deleting: ", error);
  }
};

// ===== 5. ระบบลาก-วาง (DRAG & DROP) เพื่อสลับตำแหน่ง =====
let draggedItemIndex = null;
window.handleDragStart = function(e) {
  draggedItemIndex = parseInt(e.currentTarget.dataset.index);
  e.dataTransfer.effectAllowed = 'move';
  e.currentTarget.style.opacity = '0.5';
};
window.handleDragOver = function(e) {
  e.preventDefault(); 
  e.dataTransfer.dropEffect = 'move';
};
window.handleDrop = async function(e) {
  e.preventDefault();
  const dropTarget = e.currentTarget;
  dropTarget.style.opacity = '1';
  document.querySelectorAll('.catalog-item').forEach(item => item.style.opacity = '1');
  
  const targetIndex = parseInt(dropTarget.dataset.index);
  if (draggedItemIndex === null || draggedItemIndex === targetIndex) return;

  const newArray = [...catalogData];
  const [removed] = newArray.splice(draggedItemIndex, 1);
  newArray.splice(targetIndex, 0, removed);

  try {
    for (let i = 0; i < newArray.length; i++) {
      await supabase.from('catalog').update({ "order": i + 1 }).eq('id', newArray[i].id);
    }
    loadCatalog();
  } catch (error) {
    console.error("Error updating order: ", error);
  }
};