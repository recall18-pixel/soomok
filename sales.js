const salesDataApi = window.SalesCardData;

salesDataApi.registerServiceWorker();

const salesYearSelector = document.getElementById('year-selector');
const salesMonthSelector = document.getElementById('month-selector');
const salesClientSelector = document.getElementById('sales-client-selector');
const salesCalendar = document.getElementById('calendar');
const salesForm = document.getElementById('sales-form');

const salesState = {
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  selectedSalesClientName: '',
};

function syncSalesViewToDate(date) {
  const [year, month] = date.split('-').map(Number);
  salesState.selectedYear = year;
  salesState.selectedMonth = month;
  renderSalesYearSelector();
  renderSalesMonthSelector();
  renderSalesCalendar();
}

function removeSalesEntry(salesData, date, index) {
  if (!salesData[date]) {
    return;
  }

  salesData[date].splice(index, 1);
  if (salesData[date].length === 0) {
    delete salesData[date];
  }
}

function renderSalesYearSelector() {
  const years = salesDataApi.getYearOptions();
  salesYearSelector.innerHTML = `<section class="card"><div class="selector-row"><label>연도 선택
    <select id="year-select">${years.map((year) => `<option value="${year}"${year === salesState.selectedYear ? ' selected' : ''}>${year}</option>`).join('')}</select>
  </label></div></section>`;

  document.getElementById('year-select').addEventListener('change', (event) => {
    salesState.selectedYear = Number(event.target.value);
    salesState.selectedMonth = new Date().getFullYear() === salesState.selectedYear
      ? new Date().getMonth() + 1
      : 1;
    salesForm.innerHTML = '';
    renderSalesMonthSelector();
    renderSalesCalendar();
  });
}

function renderSalesMonthSelector() {
  salesMonthSelector.innerHTML = `<section class="card"><div class="selector-row"><label>월 선택
    <select id="month-select">${Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return `<option value="${month}"${month === salesState.selectedMonth ? ' selected' : ''}>${month}월</option>`;
    }).join('')}</select>
  </label></div></section>`;

  document.getElementById('month-select').addEventListener('change', (event) => {
    salesState.selectedMonth = Number(event.target.value);
    salesForm.innerHTML = '';
    renderSalesCalendar();
  });
}

function renderSalesClientSelector() {
  const records = salesDataApi.getSortedBusinessRecords();

  if (records.length === 0) {
    salesClientSelector.innerHTML = `<section class="compact-card">
      <h2>거래처 선택</h2>
      <p class="empty-text">거래처가 아직 없습니다. 거래처관리 페이지에서 먼저 등록해 주세요.</p>
    </section>`;
    return;
  }

  const activeText = salesState.selectedSalesClientName ?
    `현재 선택된 거래처: <b>${salesDataApi.escapeHtml(salesState.selectedSalesClientName)}</b>` :
    '거래처를 먼저 선택하거나 날짜 클릭 후 폼에서 선택할 수 있습니다.';

  salesClientSelector.innerHTML = `<section class="compact-card">
    <h2>거래처 선택</h2>
    <p class="selected-client-banner">${activeText}</p>
    <div class="button-row">
      <button type="button" id="clear-client" class="secondary-button">선택 해제</button>
      <button type="button" id="move-clients" class="secondary-button">거래처관리 이동</button>
    </div>
    <div class="client-choice-list">
      ${records.map((record) => `<button type="button" class="client-choice-button${record.name === salesState.selectedSalesClientName ? ' is-active' : ''}" data-client-name="${salesDataApi.escapeHtml(record.name)}">
        <strong>${salesDataApi.escapeHtml(record.name)}</strong>
        <span>${salesDataApi.escapeHtml(salesDataApi.formatBusinessNumber(record.businessNumber) || '사업자등록번호 없음')}</span>
      </button>`).join('')}
    </div>
  </section>`;

  document.getElementById('clear-client').addEventListener('click', () => {
    salesState.selectedSalesClientName = '';
    renderSalesClientSelector();
  });

  document.getElementById('move-clients').addEventListener('click', () => {
    window.location.href = 'clients.html';
  });

  document.querySelectorAll('[data-client-name]').forEach((button) => {
    button.addEventListener('click', () => {
      salesState.selectedSalesClientName = button.dataset.clientName;
      renderSalesClientSelector();
    });
  });
}

function buildSalesList(entries) {
  if (entries.length === 0) {
    return '';
  }

  return '<div><h3>저장된 매출 내역</h3><ul class="report-list">' +
    entries.map((entry, index) => `<li class="sales-item" data-entry-index="${index}">
      <b>${salesDataApi.formatCurrency(entry.amount)}</b> (${salesDataApi.escapeHtml(entry.client)})<br>
      사업자등록번호: ${salesDataApi.escapeHtml(salesDataApi.formatBusinessNumber(entry.businessNumber) || '-')}<br>
      원가: ${salesDataApi.formatCurrency(entry.order)}<br>
      담당자: ${salesDataApi.escapeHtml(entry.contactPerson) || '-'}<br>
      메모: ${salesDataApi.escapeHtml(entry.memo) || '-'}
    </li>`).join('') +
    '</ul></div>';
}

function renderSalesCalendar() {
  const year = salesState.selectedYear;
  const month = salesState.selectedMonth;
  const salesData = salesDataApi.getSalesData();
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const days = ['일', '월', '화', '수', '목', '금', '토'];

  let html = '<section class="card"><table><tr>';
  html += days.map((day) => `<th>${day}</th>`).join('');
  html += '</tr><tr>';

  for (let blank = 0; blank < firstDay.getDay(); blank += 1) {
    html += '<td></td>';
  }

  for (let date = 1; date <= lastDay.getDate(); date += 1) {
    const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    const dayOfWeek = (firstDay.getDay() + date - 1) % 7;
    const dayEntries = salesData[fullDate] || [];
    const dayTotal = dayEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0);
    const hasEntries = dayEntries.length > 0;
    html += `<td class="calendar-day${hasEntries ? ' has-entry' : ''}" data-date="${fullDate}">
      <span class="calendar-date-number">${date}</span>
      ${hasEntries ? `<span class="calendar-day-total">${dayTotal.toLocaleString()}원</span>` : ''}
    </td>`;
    if (dayOfWeek === 6 && date !== lastDay.getDate()) {
      html += '</tr><tr>';
    }
  }

  html += '</tr></table></section>';
  salesCalendar.innerHTML = html;

  document.querySelectorAll('.calendar-day').forEach((cell) => {
    cell.addEventListener('click', () => {
      showSalesForm(cell.dataset.date);
    });
  });
}

function attachSalesFormEvents(date) {
  const form = document.getElementById('sales-entry-form');
  const clientSelect = form.querySelector('select[name="client"]');
  const clientInput = form.querySelector('input[name="client"]');
  const memoInput = form.querySelector('input[name="memo"]');

  if (clientInput) {
    salesDataApi.setKoreanInput(clientInput);
  }
  salesDataApi.setKoreanInput(memoInput);

  if (clientSelect) {
    clientSelect.addEventListener('change', () => {
      salesState.selectedSalesClientName = clientSelect.value;
      renderSalesClientSelector();
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const salesData = salesDataApi.getSalesData();
    const clientValue = clientSelect ? clientSelect.value : form.client.value.trim();
    const clientRecord = salesDataApi.getBusinessRecordByName(clientValue);

    if (!clientValue) {
      window.alert('거래처를 선택해 주세요.');
      return;
    }

    const entry = {
      amount: Number(form.amount.value),
      order: Number(form.order.value),
      client: clientValue,
      businessNumber: clientRecord?.businessNumber || '',
      contactPerson: clientRecord?.contactPerson || '',
      memo: form.memo.value.trim(),
    };

    if (!salesData[date]) {
      salesData[date] = [];
    }

    salesState.selectedSalesClientName = clientValue;
    salesData[date].push(entry);
    salesDataApi.saveSalesData(salesData);
    renderSalesClientSelector();
    showSalesForm(date);
  });

  document.querySelectorAll('.sales-item').forEach((item) => {
    item.addEventListener('click', () => {
      showEditForm(date, Number(item.dataset.entryIndex));
    });
  });
}

function showSalesForm(date) {
  const entries = salesDataApi.getSalesData()[date] || [];
  const listHtml = buildSalesList(entries);
  const businessRecords = salesDataApi.getSortedBusinessRecords();
  const selectedClientName = salesState.selectedSalesClientName && businessRecords.some((record) => record.name === salesState.selectedSalesClientName)
    ? salesState.selectedSalesClientName
    : '';
  const selectedClientRecord = salesDataApi.getBusinessRecordByName(selectedClientName);
  const clientFieldHtml = businessRecords.length > 0
    ? `<select name="client" required>
        <option value="">거래처 선택</option>
        ${businessRecords.map((record) => `<option value="${salesDataApi.escapeHtml(record.name)}"${record.name === selectedClientName ? ' selected' : ''}>${salesDataApi.escapeHtml(record.name)}</option>`).join('')}
      </select>`
    : '<input type="text" name="client" placeholder="매출처" required autocomplete="off">';

  salesForm.innerHTML = `<section class="card">
    <h2>${date} 매출 기록</h2>
    ${listHtml}
    <p class="sales-form-note">${businessRecords.length > 0 ? '등록된 거래처를 선택해 바로 기록할 수 있습니다.' : '거래처가 아직 없어 직접 입력 모드입니다.'}</p>
    ${selectedClientRecord ? `<p class="sales-form-note">사업자등록번호: ${salesDataApi.escapeHtml(salesDataApi.formatBusinessNumber(selectedClientRecord.businessNumber) || '-')} / 담당자: ${salesDataApi.escapeHtml(selectedClientRecord.contactPerson) || '-'}</p>` : ''}
    <form id="sales-entry-form" class="stack-form">
      <input type="number" name="amount" placeholder="매출 금액" required inputmode="numeric">
      <input type="number" name="order" placeholder="발주가(원가)" required inputmode="numeric">
      ${clientFieldHtml}
      <input type="text" name="memo" placeholder="메모" autocomplete="off">
      <button type="submit" class="primary-button">저장</button>
    </form>
  </section>`;

  attachSalesFormEvents(date);
}

function showEditForm(date, index) {
  const salesData = salesDataApi.getSalesData();
  const entry = salesData[date]?.[index];
  const businessRecords = salesDataApi.getSortedBusinessRecords();

  if (!entry) {
    showSalesForm(date);
    return;
  }

  const clientFieldHtml = businessRecords.length > 0
    ? `<select name="client" required>
        <option value="">거래처 선택</option>
        ${businessRecords.map((record) => `<option value="${salesDataApi.escapeHtml(record.name)}"${record.name === entry.client ? ' selected' : ''}>${salesDataApi.escapeHtml(record.name)}</option>`).join('')}
      </select>`
    : `<input type="text" name="client" placeholder="매출처" required autocomplete="off" value="${salesDataApi.escapeHtml(entry.client)}">`;

  salesForm.innerHTML = `<section class="card">
    <h2>${date} 매출 수정</h2>
    <form id="sales-edit-form" class="stack-form">
      <input type="date" name="entryDate" required value="${salesDataApi.escapeHtml(date)}">
      <input type="number" name="amount" placeholder="매출 금액" required inputmode="numeric" value="${salesDataApi.escapeHtml(entry.amount)}">
      <input type="number" name="order" placeholder="발주가(원가)" required inputmode="numeric" value="${salesDataApi.escapeHtml(entry.order)}">
      ${clientFieldHtml}
      <input type="text" name="memo" placeholder="메모" autocomplete="off" value="${salesDataApi.escapeHtml(entry.memo)}">
      <div class="button-row">
        <button type="submit" class="primary-button">수정 저장</button>
        <button type="button" id="sales-edit-cancel" class="secondary-button">취소</button>
      </div>
      <button type="button" id="sales-entry-delete" class="danger-button">기록 삭제</button>
    </form>
  </section>`;

  const form = document.getElementById('sales-edit-form');
  const clientSelect = form.querySelector('select[name="client"]');
  const clientInput = form.querySelector('input[name="client"]');
  const memoInput = form.querySelector('input[name="memo"]');

  if (clientInput) {
    salesDataApi.setKoreanInput(clientInput);
  }
  salesDataApi.setKoreanInput(memoInput);

  if (clientSelect) {
    clientSelect.addEventListener('change', () => {
      salesState.selectedSalesClientName = clientSelect.value;
      renderSalesClientSelector();
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nextDate = form.entryDate.value;
    const clientValue = clientSelect ? clientSelect.value : form.client.value.trim();
    const clientRecord = salesDataApi.getBusinessRecordByName(clientValue);

    if (!nextDate) {
      window.alert('날짜를 선택해 주세요.');
      return;
    }

    if (!clientValue) {
      window.alert('거래처를 선택해 주세요.');
      return;
    }

    const updatedEntry = {
      amount: Number(form.amount.value),
      order: Number(form.order.value),
      client: clientValue,
      businessNumber: clientRecord?.businessNumber || salesData[date][index].businessNumber || '',
      contactPerson: clientRecord?.contactPerson || salesData[date][index].contactPerson || '',
      memo: form.memo.value.trim(),
    };

    if (nextDate === date) {
      salesData[date][index] = updatedEntry;
    } else {
      removeSalesEntry(salesData, date, index);
      if (!salesData[nextDate]) {
        salesData[nextDate] = [];
      }
      salesData[nextDate].push(updatedEntry);
      syncSalesViewToDate(nextDate);
    }

    salesState.selectedSalesClientName = clientValue;
    salesDataApi.saveSalesData(salesData);
    renderSalesClientSelector();
    showSalesForm(nextDate);
  });

  document.getElementById('sales-edit-cancel').addEventListener('click', () => {
    showSalesForm(date);
  });

  document.getElementById('sales-entry-delete').addEventListener('click', () => {
    const confirmed = window.confirm('이 매출 기록을 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    removeSalesEntry(salesData, date, index);
    salesDataApi.saveSalesData(salesData);
    renderSalesClientSelector();
    renderSalesCalendar();
    showSalesForm(date);
  });
}

renderSalesYearSelector();
renderSalesMonthSelector();
renderSalesClientSelector();
renderSalesCalendar();