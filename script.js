// Ganti URL ini dengan URL Web App Google Apps Script milikmu.
const API_URL = 'https://script.google.com/macros/s/AKfycbws-etqWoHeDORb-WylxRwTqWfaMtPsaWidGcQ1BAA2hHBpj_HIumjfC2BrqiUhSD-j/exec';

const form = document.getElementById('formData');
const table = document.getElementById('tableData');
const statusMessage = document.getElementById('statusMessage');

document.addEventListener('DOMContentLoaded', loadData);
form.addEventListener('submit', saveData);
document.getElementById('resetButton').addEventListener('click', resetForm);
document.getElementById('refreshButton').addEventListener('click', loadData);

// Mengirim POST sebagai text/plain agar tidak memicu preflight CORS.
async function postData(payload) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return response.json();
}

async function loadData() {
  table.innerHTML = '<tr><td colspan="5" class="empty-state">Memuat data...</td></tr>';
  showStatus('');
  try {
    const response = await fetch(`${API_URL}?action=read`);
    const result = await response.json();

    if (!result.success) throw new Error(result.message || 'Gagal mengambil data.');
    renderTable(result.data || []);
  } catch (error) {
    console.error(error);
    table.innerHTML = '<tr><td colspan="5" class="empty-state">Data tidak dapat dimuat. Periksa URL dan deployment Apps Script.</td></tr>';
    showStatus(error.message, true);
  }
}

function renderTable(data) {
  table.replaceChildren();

  if (!data.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 5;
    cell.className = 'empty-state';
    cell.textContent = 'Belum ada data roti.';
    row.appendChild(cell);
    table.appendChild(row);
    return;
  }

  data.forEach((item, index) => {
    const row = document.createElement('tr');
    addCell(row, String(index + 1));
    addCell(row, item.NAMA || '');
    addCell(row, item.KATEGORI || '');
    addCell(row, formatRupiah(item.HARGA));

    const actionCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'btn-warning';
    editButton.textContent = 'Edit';
    editButton.addEventListener('click', () => editData(item.ID));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'btn-danger';
    deleteButton.textContent = 'Hapus';
    deleteButton.addEventListener('click', () => deleteData(item.ID));

    actions.append(editButton, deleteButton);
    actionCell.appendChild(actions);
    row.appendChild(actionCell);
    table.appendChild(row);
  });
}

function addCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value;
  row.appendChild(cell);
}

function formatRupiah(value) {
  return 'Rp ' + Number(value || 0).toLocaleString('id-ID');
}

async function saveData(event) {
  event.preventDefault();

  const id = document.getElementById('id').value;
  const data = {
    NAMA: document.getElementById('nama').value.trim(),
    HARGA: document.getElementById('harga').value,
    KATEGORI: document.getElementById('kategori').value
  };

  if (!data.NAMA || !data.HARGA || !data.KATEGORI) {
    showStatus('Lengkapi semua data terlebih dahulu.', true);
    return;
  }

  const submitButton = document.getElementById('submitButton');
  submitButton.disabled = true;

  try {
    const result = await postData({
      action: id ? 'update' : 'create',
      id: id,
      data: data
    });

    if (!result.success) throw new Error(result.message || 'Data gagal disimpan.');
    showStatus(result.message || 'Data berhasil disimpan.');
    resetForm();
    await loadData();
  } catch (error) {
    console.error(error);
    showStatus(error.message || 'Gagal menyimpan data.', true);
  } finally {
    submitButton.disabled = false;
  }
}

async function editData(id) {
  try {
    const response = await fetch(`${API_URL}?action=get&id=${encodeURIComponent(id)}`);
    const result = await response.json();

    if (!result.success) throw new Error(result.message || 'Data tidak ditemukan.');

    const item = result.data;
    document.getElementById('id').value = item.ID || '';
    document.getElementById('nama').value = item.NAMA || '';
    document.getElementById('harga').value = item.HARGA || '';
    document.getElementById('kategori').value = item.KATEGORI || '';

    document.getElementById('formTitle').textContent = 'Edit Data Roti';
    document.getElementById('submitButton').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Simpan Perubahan';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    console.error(error);
    showStatus(error.message || 'Gagal mengambil data.', true);
  }
}

async function deleteData(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus data roti ini?')) return;

  try {
    const result = await postData({ action: 'delete', id: id });
    if (!result.success) throw new Error(result.message || 'Data gagal dihapus.');
    showStatus(result.message || 'Data berhasil dihapus.');
    await loadData();
  } catch (error) {
    console.error(error);
    showStatus(error.message || 'Gagal menghapus data.', true);
  }
}

function resetForm() {
  form.reset();
  document.getElementById('id').value = '';
  document.getElementById('formTitle').textContent = 'Tambah Data Roti';
  document.getElementById('submitButton').innerHTML = '<i class="fa-solid fa-plus"></i> Tambahkan ke Stok';
  showStatus('');
}

function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}
