const yearSelector = document.getElementById('year-selector');
const yearReport = document.getElementById('year-report');
const monthSelector = document.getElementById('month-selector');
const monthReport = document.getElementById('month-report');
const calendar = document.getElementById('calendar');
const salesForm = document.getElementById('sales-form');

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
};

function getSalesData() {
  return JSON.parse(localStorage.getItem('salesData') || '{}');
}

function saveSalesData(data) {
  localStorage.setItem('salesData', JSON.stringify(data));
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
  const summary = calculateMonthSummary(year, month);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const days = ['일', '월', '화', '수', '목', '금', '토'];

  let html = `<div class="calendar-summary">
    <span><b>매출합계:</b> ${summary.amountTotal.toLocaleString()}원</span>
    <span><b>원가(발주가):</b> ${summary.orderTotal.toLocaleString()}원</span>
    <span class="profit"><b>수익:</b> ${summary.profitTotal.toLocaleString()}원</span>
  </div>`;

  html += '<table><tr>';
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
