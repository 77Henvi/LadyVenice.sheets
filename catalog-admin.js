// catalog-admin.js
import { addDoc, deleteDoc, doc, updateDoc, onSnapshot, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { db, storage, colCatalog } from "./firebase-config.js";

let catalogData = [];

// ===== 1. ดึงข้อมูลมาโชว์ในหน้า ADMIN =====
const qCatalog = query(colCatalog, orderBy("order", "asc"));
onSnapshot(qCatalog, snap => {
  catalogData = [];
  snap.forEach(d => catalogData.push({ id: d.id, ...d.data() }));
  renderCatalog();
});

function renderCatalog() {
  const el = document.getElementById('catalog-list');
  if (!el) return;

  if (!catalogData.length) {
    el.innerHTML = '<div class="empty-state"><div class="empty-icon">🌸</div><div class="empty-text">ยังไม่มีสินค้าใน Catalog</div></div>';
    return;
  }

  el.innerHTML = catalogData.map((c, index) => `
    <div class="item-card catalog-item" draggable="true" data-id="${c.id}" data-index="${index}" ondragstart="handleDragStart(event)" ondragover="handleDragOver(event)" ondrop="handleDrop(event)">
      <div class="item-card-left" style="align-items: center; gap: 12px; cursor: grab;">
        <div style="font-size: 20px; color: #ccc;">⋮⋮</div>
        <img src="${c.image || 'https://via.placeholder.com/60'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
        <div>
          <div class="item-name">${c.name}</div>
          <div class="item-sub">${c.price}</div>
        </div>
      </div>
      <div class="item-actions">
        <button class="btn-icon" onclick="editCatalog('${c.id}')">✏️</button>
        <button class="btn-icon danger" onclick="deleteCatalog('${c.id}')">🗑</button>
      </div>
    </div>`).join('');
}

// ===== 2. จัดการหน้าต่าง MODAL =====
window.openCatalogModal = function() {
  document.getElementById('catalog-edit-id').value = '';
  document.getElementById('catalog-modal-title').textContent = 'เพิ่มสินค้า Catalog';
  document.getElementById('catalog-name').value = '';
  document.getElementById('catalog-price').value = '';
  document.getElementById('catalog-desc').value = '';
  document.getElementById('catalog-image').value = '';
  document.getElementById('catalog-image-preview').style.display = 'none';
  document.getElementById('btn-save-catalog').textContent = 'บันทึก';
  document.getElementById('btn-save-catalog').disabled = false;
  openModal('modal-catalog');
};

window.editCatalog = function(id) {
  const c = catalogData.find(x => x.id === id);
  if (!c) return;

  document.getElementById('catalog-edit-id').value = id;
  document.getElementById('catalog-modal-title').textContent = 'แก้ไขสินค้า Catalog';
  document.getElementById('catalog-name').value = c.name;
  document.getElementById('catalog-price').value = c.price;
  document.getElementById('catalog-desc').value = c.desc || '';
  document.getElementById('catalog-image').value = '';
  
  const preview = document.getElementById('catalog-image-preview');
  if (c.image) {
    preview.src = c.image;
    preview.style.display = 'block';
  } else {
    preview.style.display = 'none';
  }

  document.getElementById('btn-save-catalog').textContent = 'บันทึก';
  document.getElementById('btn-save-catalog').disabled = false;
  openModal('modal-catalog');
};

// ===== 3. บันทึกข้อมูล (UPLOAD รูป + SAVE) =====
window.saveCatalog = async function() {
  const name = document.getElementById('catalog-name').value.trim();
  const price = document.getElementById('catalog-price').value.trim();
  const desc = document.getElementById('catalog-desc').value.trim();
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
    
    if (id) {
      // โหมดแก้ไข
      const updateData = { name, price, desc };
      if (file) {
        const storageRef = ref(storage, `catalog-images/${id}/image`);
        await uploadBytes(storageRef, file);
        updateData.image = await getDownloadURL(storageRef);
      }
      await updateDoc(doc(db, "catalog", id), updateData);
    } else {
      // โหมดเพิ่มใหม่
      const maxOrder = catalogData.length > 0 ? Math.max(...catalogData.map(c => c.order || 0)) : 0;
      const docRef = await addDoc(colCatalog, { name, price, desc, order: maxOrder + 1, image: '' });
      
      const storageRef = ref(storage, `catalog-images/${docRef.id}/image`);
      await uploadBytes(storageRef, file);
      imageUrl = await getDownloadURL(storageRef);
      
      await updateDoc(docRef, { image: imageUrl });
    }
    
    closeModal('modal-catalog');
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
    const storageRef = ref(storage, `catalog-images/${id}/image`);
    await deleteObject(storageRef).catch(e => console.log('No image to delete or error:', e));
    await deleteDoc(doc(db, "catalog", id));
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
    const batch = writeBatch(db);
    newArray.forEach((item, index) => {
      const itemRef = doc(db, "catalog", item.id);
      batch.update(itemRef, { order: index + 1 });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error updating order: ", error);
  }
};