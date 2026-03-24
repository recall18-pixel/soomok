const yearSelector = document.getElementById('year-selector');
const yearReport = document.getElementById('year-report');
const monthSelector = document.getElementById('month-selector');
const monthReport = document.getElementById('month-report');
const calendar = document.getElementById('calendar');
const salesForm = document.getElementById('sales-form');
const businessRegistry = document.getElementById('business-registry');

const now = new Date();
const years = [];

for (let year = now.getFullYear() - 3; year <= now.getFullYear() + 1; year += 1) {
  years.push(year);
}

const state = {
  selectedYear: now.getFullYear(),
  selectedMonth: 1,
  isYearReportOpen: false,
  isMonthReportOpen: false,
  selectedBusinessName: '',
};

function getSalesData() {
  return JSON.parse(localStorage.getItem('salesData') || '{}');
}

function saveSalesData(data) {
  localStorage.setItem('salesData', JSON.stringify(data));
}

function getBusinessRecords() {
  return JSON.parse(localStorage.getItem('businessRecords') || '[]');
}

function saveBusinessRecords(records) {
  localStorage.setItem('businessRecords', JSON.stringify(records));
}

function setKoreanInput(target) {
  if (!target) {
    return;
  }

  target.setAttribute('lang', 'ko');
  target.setAttribute('autocapitalize', 'off');
  target.setAttribute('autocorrect', 'off');
  target.setAttribute('spellcheck', 'false');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
    image.src = dataUrl;
  });
}

async function compressImageFile(file) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(originalDataUrl);
  const maxWidth = 1400;
  const maxHeight = 1400;
  let { width, height } = image;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL('image/jpeg', 0.78);
}

function renderYearSelector() {
  yearSelector.innerHTML = '<div class="selector-row">' +
    '<label>연도 선택: <select id="year-select">' +
    years.map((year) => `<option value="${year}"${year === state.selectedYear ? ' selected' : ''}>${year}</option>`).join('') +
    '</select></label>' +
    `<button type="button" id="year-report-toggle" class="toggle-report-button${state.isYearReportOpen ? ' is-open' : ''}">연매출</button>` +
    '</div>';

  const yearSelect = document.getElementById('year-select');
  yearSelect.addEventListener('change', (event) => {
    state.selectedYear = Number(event.target.value);
    state.selectedMonth = 1;
    salesForm.style.display = 'none';
    renderMonthSelector();
    renderCalendar();
    renderYearReport();
    renderMonthReport();
  });

  document.getElementById('year-report-toggle').addEventListener('click', () => {
    state.isYearReportOpen = !state.isYearReportOpen;
    renderYearSelector();
    renderYearReport();
  });
}

function renderMonthSelector() {
  monthSelector.style.display = '';
  monthSelector.innerHTML = '<div class="selector-row">' +
    '<label>월 선택: <select id="month-select">' +
    Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return `<option value="${month}"${month === state.selectedMonth ? ' selected' : ''}>${month}월</option>`;
    }).join('') +
    '</select></label>' +
    `<button type="button" id="month-report-toggle" class="toggle-report-button${state.isMonthReportOpen ? ' is-open' : ''}">월매출</button>` +
    '</div>';

  const monthSelect = document.getElementById('month-select');
  monthSelect.addEventListener('change', (event) => {
    state.selectedMonth = Number(event.target.value);
    salesForm.style.display = 'none';
    renderCalendar();
    renderMonthReport();
  });

  document.getElementById('month-report-toggle').addEventListener('click', () => {
    state.isMonthReportOpen = !state.isMonthReportOpen;
    renderMonthSelector();
    renderMonthReport();
  });
}

function calculateMonthSummary(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const salesData = getSalesData();
  let amountTotal = 0;
  let orderTotal = 0;

  Object.entries(salesData).forEach(([date, entries]) => {
    if (!date.startsWith(prefix)) {
      return;
    }

    entries.forEach((entry) => {
      amountTotal += Number(entry.amount) || 0;
      orderTotal += Number(entry.order) || 0;
    });
  });

  return {
    amountTotal,
    orderTotal,
    profitTotal: amountTotal - orderTotal,
  };
}

function calculateYearSummary(year) {
  const prefix = `${year}-`;
  const salesData = getSalesData();
  let amountTotal = 0;
  let orderTotal = 0;

  Object.entries(salesData).forEach(([date, entries]) => {
    if (!date.startsWith(prefix)) {
      return;
    }

    entries.forEach((entry) => {
      amountTotal += Number(entry.amount) || 0;
      orderTotal += Number(entry.order) || 0;
    });
  });

  return {
    amountTotal,
    orderTotal,
    profitTotal: amountTotal - orderTotal,
  };
}

function getMonthlyEntries(year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const salesData = getSalesData();

  return Object.keys(salesData)
    .filter((date) => date.startsWith(prefix))
    .sort()
    .map((date) => ({
      date,
      entries: salesData[date],
    }));
}

function getYearlyEntries(year) {
  const prefix = `${year}-`;
  const salesData = getSalesData();
  const grouped = {};

  Object.keys(salesData)
    .filter((date) => date.startsWith(prefix))
    .sort()
    .forEach((date) => {
      const month = Number(date.split('-')[1]);
      if (!grouped[month]) {
        grouped[month] = [];
      }

      grouped[month].push({
        date,
        entries: salesData[date],
      });
    });

  return Object.keys(grouped)
    .map((month) => ({
      month: Number(month),
      dates: grouped[month],
    }))
    .sort((left, right) => left.month - right.month);
}

function renderEntryItems(entries) {
  return '<ul class="report-list">' +
    entries.map((entry) => `<li>
      <b>${(Number(entry.amount) || 0).toLocaleString()}원</b> (${escapeHtml(entry.client)})<br>
      원가: ${(Number(entry.order) || 0).toLocaleString()}원<br>
      메모: ${escapeHtml(entry.memo) || '-'}
    </li>`).join('') +
    '</ul>';
}

function renderMonthReport() {
  if (!state.isMonthReportOpen) {
    monthReport.style.display = 'none';
    monthReport.innerHTML = '';
    return;
  }

  const year = state.selectedYear;
  const month = state.selectedMonth;
  const summary = calculateMonthSummary(year, month);
  const groups = getMonthlyEntries(year, month);

  let html = `<div class="report-panel">
    <h3 class="report-title">${year}년 ${month}월 전체 내역</h3>
    <div class="report-summary">
      <span><b>매출합계:</b> ${summary.amountTotal.toLocaleString()}원</span>
      <span><b>원가:</b> ${summary.orderTotal.toLocaleString()}원</span>
      <span class="profit"><b>수익:</b> ${summary.profitTotal.toLocaleString()}원</span>
    </div>`;

  if (groups.length === 0) {
    html += '<p class="report-empty">등록된 매출 내역이 없습니다.</p>';
  } else {
    html += groups.map((group) => `<div class="report-group">
      <h4 class="report-group-title">${group.date}</h4>
      ${renderEntryItems(group.entries)}
    </div>`).join('');
  }

  html += '</div>';
  monthReport.style.display = '';
  monthReport.innerHTML = html;
}

function renderYearReport() {
  if (!state.isYearReportOpen) {
    yearReport.style.display = 'none';
    yearReport.innerHTML = '';
    return;
  }

  const year = state.selectedYear;
  const summary = calculateYearSummary(year);
  const groups = getYearlyEntries(year);

  let html = `<div class="report-panel">
    <h3 class="report-title">${year}년 연간 매출 내역</h3>
    <div class="report-summary">
      <span><b>연매출:</b> ${summary.amountTotal.toLocaleString()}원</span>
      <span><b>원가:</b> ${summary.orderTotal.toLocaleString()}원</span>
      <span class="profit"><b>수익:</b> ${summary.profitTotal.toLocaleString()}원</span>
    </div>`;

  if (groups.length === 0) {
    html += '<p class="report-empty">등록된 매출 내역이 없습니다.</p>';
  } else {
    html += groups.map((group) => `<div class="report-group">
      <h4 class="report-group-title">${group.month}월</h4>
      ${group.dates.map((dateGroup) => `<div class="report-group">
        <h4 class="report-group-title">${dateGroup.date}</h4>
        ${renderEntryItems(dateGroup.entries)}
      </div>`).join('')}
    </div>`).join('');
  }

  html += '</div>';
  yearReport.style.display = '';
  yearReport.innerHTML = html;
}

function renderCalendar() {
  const year = state.selectedYear;
  const month = state.selectedMonth;
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const days = ['일', '월', '화', '수', '목', '금', '토'];

  let html = '<table><tr>';
  html += days.map((day) => `<th>${day}</th>`).join('');
  html += '</tr><tr>';

  for (let blank = 0; blank < firstDay.getDay(); blank += 1) {
    html += '<td></td>';
  }

  for (let date = 1; date <= lastDay.getDate(); date += 1) {
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const dayOfWeek = (firstDay.getDay() + date - 1) % 7;
    html += `<td class="calendar-day" data-date="${fullDate}">${date}</td>`;

    if (dayOfWeek === 6 && date !== lastDay.getDate()) {
      html += '</tr><tr>';
    }
  }

  html += '</tr></table>';
  calendar.style.display = '';
  calendar.innerHTML = html;

  document.querySelectorAll('.calendar-day').forEach((cell) => {
    cell.addEventListener('click', () => {
      showSalesForm(cell.dataset.date);
    });
  });
}

function renderBusinessRegistry() {
  const records = getBusinessRecords().sort((left, right) => left.name.localeCompare(right.name, 'ko'));
  const selectedRecord = records.find((record) => record.name === state.selectedBusinessName) || null;
  const isEditMode = Boolean(selectedRecord);

  let listHtml = '<p class="empty-text">저장된 거래처가 없습니다.</p>';
  if (records.length > 0) {
    listHtml = '<ul class="client-list">' +
      records.map((record) => `<li>
        <button type="button" class="client-button${selectedRecord && selectedRecord.name === record.name ? ' is-active' : ''}" data-name="${escapeHtml(record.name)}">
          <strong>${escapeHtml(record.name)}</strong>
          <span class="client-meta">${escapeHtml(record.email) || '이메일 없음'}</span>
        </button>
      </li>`).join('') +
      '</ul>';
  }

  let viewerHtml = '<p class="empty-text">거래처 이름을 누르면 사업자등록증을 확인할 수 있습니다.</p>';
  if (selectedRecord) {
    viewerHtml = `<div class="certificate-viewer">
      <h3>${escapeHtml(selectedRecord.name)}</h3>
      <p>이메일: ${escapeHtml(selectedRecord.email) || '-'}</p>
      <div class="certificate-actions">
        <button type="button" id="business-edit-reset" class="secondary-button">새 거래처 등록</button>
        <button type="button" id="business-delete" class="danger-button">삭제</button>
      </div>
      <img src="${selectedRecord.imageData}" alt="${escapeHtml(selectedRecord.name)} 사업자등록증" class="certificate-image">
    </div>`;
  }

  businessRegistry.innerHTML = `<section class="section-card">
    <h2>사업자등록증 보관</h2>
    <form id="business-record-form" class="stack-form">
      <input type="text" name="name" placeholder="거래처 이름" required autocomplete="off" value="${selectedRecord ? escapeHtml(selectedRecord.name) : ''}">
      <input type="email" name="email" placeholder="이메일" autocomplete="off" value="${selectedRecord ? escapeHtml(selectedRecord.email) : ''}">
      <input type="file" name="certificate" accept="image/*" ${isEditMode ? '' : 'required'}>
      <p class="file-hint">이미지는 저장 전에 자동으로 축소/압축됩니다. ${isEditMode ? '새 이미지를 올리지 않으면 기존 파일을 유지합니다.' : ''}</p>
      <div class="button-row${isEditMode ? '' : ' single'}">
        <button type="submit" class="primary-button">${isEditMode ? '사업자등록증 수정 저장' : '사업자등록증 저장'}</button>
        ${isEditMode ? '<button type="button" id="business-cancel-edit" class="secondary-button">수정 취소</button>' : ''}
      </div>
    </form>
    ${listHtml}
    ${viewerHtml}
  </section>`;

  const form = document.getElementById('business-record-form');
  const nameInput = form.querySelector('input[name="name"]');
  const emailInput = form.querySelector('input[name="email"]');
  const fileInput = form.querySelector('input[name="certificate"]');

  setKoreanInput(nameInput);
  emailInput.setAttribute('autocapitalize', 'off');
  emailInput.setAttribute('autocorrect', 'off');
  emailInput.setAttribute('spellcheck', 'false');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const trimmedName = form.name.value.trim();
    if (!trimmedName) {
      return;
    }

    try {
      const file = fileInput.files[0];
      const recordsData = getBusinessRecords();
      const editingName = selectedRecord ? selectedRecord.name : null;
      const existingIndex = recordsData.findIndex((record) => record.name === editingName);
      const duplicateIndex = recordsData.findIndex((record) => record.name === trimmedName);
      const imageData = file ? await compressImageFile(file) : selectedRecord?.imageData;

      if (!imageData) {
        window.alert('사업자등록증 이미지를 선택해 주세요.');
        return;
      }

      if (duplicateIndex >= 0 && recordsData[duplicateIndex].name !== editingName) {
        window.alert('같은 거래처 이름이 이미 있습니다. 기존 거래처를 수정하거나 다른 이름을 사용해 주세요.');
        return;
      }

      const nextRecord = {
        name: trimmedName,
        email: form.email.value.trim(),
        imageData,
      };

      if (existingIndex >= 0) {
        recordsData.splice(existingIndex, 1, nextRecord);
      } else {
        recordsData.push(nextRecord);
      }

      state.selectedBusinessName = nextRecord.name;
      saveBusinessRecords(recordsData);
      renderBusinessRegistry();
    } catch (error) {
      window.alert('이미지 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  });

  if (isEditMode) {
    document.getElementById('business-cancel-edit').addEventListener('click', () => {
      state.selectedBusinessName = '';
      renderBusinessRegistry();
    });
  }

  document.querySelectorAll('.client-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedBusinessName = button.dataset.name;
      renderBusinessRegistry();
    });
  });

  if (selectedRecord) {
    document.getElementById('business-edit-reset').addEventListener('click', () => {
      state.selectedBusinessName = '';
      renderBusinessRegistry();
    });

    document.getElementById('business-delete').addEventListener('click', () => {
      const nextRecords = getBusinessRecords().filter((record) => record.name !== selectedRecord.name);
      state.selectedBusinessName = '';
      saveBusinessRecords(nextRecords);
      renderBusinessRegistry();
    });
  }
}

function buildSalesList(entries) {
  if (entries.length === 0) {
    return '';
  }

  return '<div style="margin-bottom:12px;"><b>저장된 매출 내역</b><ul style="padding-left:18px;">' +
    entries.map((entry, index) => `
      <li class="sales-item" data-idx="${index}" style="cursor:pointer; margin-bottom:8px;">
        <b>${(Number(entry.amount) || 0).toLocaleString()}원</b> (${escapeHtml(entry.client)})<br>
        <span style="color:#888;font-size:0.95em;">발주가: ${(Number(entry.order) || 0).toLocaleString()}원<br>${escapeHtml(entry.memo)}</span>
      </li>`).join('') +
    '</ul></div>';
}

function attachCreateFormEvents(date) {
  const form = document.getElementById('sales-entry-form');
  const clientInput = form.querySelector('input[name="client"]');
  const memoInput = form.querySelector('input[name="memo"]');

  setKoreanInput(clientInput);
  setKoreanInput(memoInput);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const salesData = getSalesData();
    const entry = {
      amount: Number(form.amount.value),
      order: Number(form.order.value),
      client: form.client.value.trim(),
      memo: form.memo.value.trim(),
    };

    if (!salesData[date]) {
      salesData[date] = [];
    }

    salesData[date].push(entry);
    saveSalesData(salesData);
    showSalesForm(date);
    renderCalendar();
    renderMonthReport();
    renderYearReport();
  });

  document.querySelectorAll('.sales-item').forEach((item) => {
    item.addEventListener('click', () => {
      showEditForm(date, Number(item.dataset.idx));
    });
  });
}

function showSalesForm(date) {
  const entries = getSalesData()[date] || [];
  const listHtml = buildSalesList(entries);

  salesForm.style.display = '';
  salesForm.innerHTML = `<h3>${date} 매출 기록</h3>
    ${listHtml}
    <form id="sales-entry-form">
      <input type="number" name="amount" placeholder="매출 금액" required style="width:100%;margin-bottom:8px;" inputmode="numeric">
      <input type="number" name="order" placeholder="발주가(원가)" required style="width:100%;margin-bottom:8px;" inputmode="numeric">
      <input type="text" name="client" placeholder="매출처" required style="width:100%;margin-bottom:8px;" autocomplete="off">
      <input type="text" name="memo" placeholder="메모" style="width:100%;margin-bottom:8px;" autocomplete="off">
      <button type="submit">저장</button>
    </form>`;

  attachCreateFormEvents(date);
}

function showEditForm(date, index) {
  const salesData = getSalesData();
  const entry = salesData[date]?.[index];

  if (!entry) {
    showSalesForm(date);
    return;
  }

  salesForm.style.display = '';
  salesForm.innerHTML = `<h3>${date} 매출 수정</h3>
    <form id="sales-edit-form">
      <input type="number" name="amount" placeholder="매출 금액" required style="width:100%;margin-bottom:8px;" inputmode="numeric" value="${escapeHtml(entry.amount)}">
      <input type="number" name="order" placeholder="발주가(원가)" required style="width:100%;margin-bottom:8px;" inputmode="numeric" value="${escapeHtml(entry.order)}">
      <input type="text" name="client" placeholder="매출처" required style="width:100%;margin-bottom:8px;" autocomplete="off" value="${escapeHtml(entry.client)}">
      <input type="text" name="memo" placeholder="메모" style="width:100%;margin-bottom:8px;" autocomplete="off" value="${escapeHtml(entry.memo)}">
      <button type="submit">수정 저장</button>
      <button type="button" id="edit-cancel" style="margin-left:8px;">취소</button>
    </form>`;

  const form = document.getElementById('sales-edit-form');
  const clientInput = form.querySelector('input[name="client"]');
  const memoInput = form.querySelector('input[name="memo"]');

  setKoreanInput(clientInput);
  setKoreanInput(memoInput);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    salesData[date][index] = {
      amount: Number(form.amount.value),
      order: Number(form.order.value),
      client: form.client.value.trim(),
      memo: form.memo.value.trim(),
    };

    saveSalesData(salesData);
    showSalesForm(date);
    renderCalendar();
    renderMonthReport();
    renderYearReport();
  });

  document.getElementById('edit-cancel').addEventListener('click', () => {
    showSalesForm(date);
  });
}

renderYearSelector();
renderMonthSelector();
renderCalendar();
renderYearReport();
renderMonthReport();
renderBusinessRegistry();
