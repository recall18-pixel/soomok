const reportDataApi = window.SalesCardData;

reportDataApi.registerServiceWorker();

const reportYearSelector = document.getElementById('year-selector');
const reportMonthSelector = document.getElementById('month-selector');
const reportMonthPanel = document.getElementById('month-report');
const reportYearPanel = document.getElementById('year-report');
const reportEditPanel = document.getElementById('report-edit-panel');
const reportBusinessSelector = document.getElementById('business-selector');
const reportBusinessPanel = document.getElementById('business-report');

const reportState = {
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  selectedBusinessName: '',
  isMonthOpen: false,
  isYearOpen: false,
};

function removeSalesEntry(salesData, date, index) {
  if (!salesData[date]) {
    return;
  }

  salesData[date].splice(index, 1);
  if (salesData[date].length === 0) {
    delete salesData[date];
  }
}

function renderEditableEntryList(date, entriesWithIndex) {
  return '<ul class="report-list">' +
    entriesWithIndex.map(({ entry, index }) => `<li>
      <button type="button" class="report-entry-button" data-entry-date="${date}" data-entry-index="${index}">
        <b>${reportDataApi.formatCurrency(entry.amount)}</b> (${reportDataApi.escapeHtml(entry.client)})<br>
        사업자등록번호: ${reportDataApi.escapeHtml(reportDataApi.formatBusinessNumber(entry.businessNumber) || '-')}<br>
        원가: ${reportDataApi.formatCurrency(entry.order)}<br>
        담당자: ${reportDataApi.escapeHtml(entry.contactPerson) || '-'}<br>
        메모: ${reportDataApi.escapeHtml(entry.memo) || '-'}
      </button>
    </li>`).join('') +
    '</ul>';
}

function attachReportEntryEvents() {
  document.querySelectorAll('.report-entry-button').forEach((button) => {
    button.addEventListener('click', () => {
      showReportEditForm(button.dataset.entryDate, Number(button.dataset.entryIndex));
    });
  });
}

function rerenderAllReports() {
  renderMonthReport();
  renderYearReport();
  renderBusinessSelector();
  renderBusinessReport();
}

function renderReportYearSelector() {
  const years = reportDataApi.getYearOptions();
  reportYearSelector.innerHTML = `<section class="card"><div class="selector-row"><label>연도 선택
    <select id="report-year-select">${years.map((year) => `<option value="${year}"${year === reportState.selectedYear ? ' selected' : ''}>${year}</option>`).join('')}</select>
  </label></div></section>`;

  document.getElementById('report-year-select').addEventListener('change', (event) => {
    reportState.selectedYear = Number(event.target.value);
    reportState.selectedMonth = 1;
    renderReportMonthSelector();
    renderMonthReport();
    renderYearReport();
  });
}

function renderReportMonthSelector() {
  reportMonthSelector.innerHTML = `<section class="card"><div class="selector-row"><label>월 선택
    <select id="report-month-select">${Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      return `<option value="${month}"${month === reportState.selectedMonth ? ' selected' : ''}>${month}월</option>`;
    }).join('')}</select>
  </label></div></section>`;

  document.getElementById('report-month-select').addEventListener('change', (event) => {
    reportState.selectedMonth = Number(event.target.value);
    renderMonthReport();
  });
}

function renderMonthReport() {
  const summary = reportDataApi.calculateMonthSummary(reportState.selectedYear, reportState.selectedMonth);
  const groups = reportDataApi.getMonthlyEntries(reportState.selectedYear, reportState.selectedMonth);

  reportMonthPanel.innerHTML = `<section class="report-panel">
    <div class="report-header">
      <h2 class="report-title">${reportState.selectedYear}년 ${reportState.selectedMonth}월 리포트</h2>
      <button type="button" id="toggle-month-report" class="toggle-report-button${reportState.isMonthOpen ? ' is-open' : ''}">${reportState.isMonthOpen ? '닫기' : '열기'}</button>
    </div>
    ${reportState.isMonthOpen ? `<div class="report-summary">
      <span><b>매출합계:</b> ${reportDataApi.formatCurrency(summary.amountTotal)}</span>
      <span><b>원가:</b> ${reportDataApi.formatCurrency(summary.orderTotal)}</span>
      <span class="profit"><b>수익:</b> ${reportDataApi.formatCurrency(summary.profitTotal)}</span>
    </div>
    ${groups.length === 0 ? '<p class="report-empty">선택한 월의 매출 내역이 없습니다.</p>' : groups.map((group) => {
      const salesData = reportDataApi.getSalesData();
      const entriesWithIndex = (salesData[group.date] || []).map((entry, index) => ({ entry, index }));
      return `<div class="report-group"><h3 class="report-group-title">${group.date}</h3>${renderEditableEntryList(group.date, entriesWithIndex)}</div>`;
    }).join('')}` : ''}
  </section>`;

  document.getElementById('toggle-month-report').addEventListener('click', () => {
    reportState.isMonthOpen = !reportState.isMonthOpen;
    renderMonthReport();
    attachReportEntryEvents();
  });

  if (reportState.isMonthOpen) {
    attachReportEntryEvents();
  }
}

function renderYearReport() {
  const summary = reportDataApi.calculateYearSummary(reportState.selectedYear);
  const groups = reportDataApi.getYearlyEntries(reportState.selectedYear);

  reportYearPanel.innerHTML = `<section class="report-panel">
    <div class="report-header">
      <h2 class="report-title">${reportState.selectedYear}년 연간 리포트</h2>
      <button type="button" id="toggle-year-report" class="toggle-report-button${reportState.isYearOpen ? ' is-open' : ''}">${reportState.isYearOpen ? '닫기' : '열기'}</button>
    </div>
    ${reportState.isYearOpen ? `<div class="report-summary">
      <span><b>연매출:</b> ${reportDataApi.formatCurrency(summary.amountTotal)}</span>
      <span><b>원가:</b> ${reportDataApi.formatCurrency(summary.orderTotal)}</span>
      <span class="profit"><b>수익:</b> ${reportDataApi.formatCurrency(summary.profitTotal)}</span>
    </div>
    ${groups.length === 0 ? '<p class="report-empty">선택한 연도의 매출 내역이 없습니다.</p>' : groups.map((group) => `<div class="report-group"><h3 class="report-group-title">${group.month}월</h3>${group.dates.map((dateGroup) => {
      const salesData = reportDataApi.getSalesData();
      const entriesWithIndex = (salesData[dateGroup.date] || []).map((entry, index) => ({ entry, index }));
      return `<div class="report-group"><h4 class="report-group-title">${dateGroup.date}</h4>${renderEditableEntryList(dateGroup.date, entriesWithIndex)}</div>`;
    }).join('')}</div>`).join('')}` : ''}
  </section>`;

  document.getElementById('toggle-year-report').addEventListener('click', () => {
    reportState.isYearOpen = !reportState.isYearOpen;
    renderYearReport();
    attachReportEntryEvents();
  });

  if (reportState.isYearOpen) {
    attachReportEntryEvents();
  }
}

function renderBusinessSelector() {
  const records = reportDataApi.getSortedBusinessRecords();

  if (!reportState.selectedBusinessName && records.length > 0) {
    reportState.selectedBusinessName = records[0].name;
  }

  reportBusinessSelector.innerHTML = `<section class="card">
    <div class="selector-row"><label>거래처 선택
      <select id="business-select">
        ${records.length === 0 ? '<option value="">등록 거래처 없음</option>' : records.map((record) => `<option value="${reportDataApi.escapeHtml(record.name)}"${record.name === reportState.selectedBusinessName ? ' selected' : ''}>${reportDataApi.escapeHtml(record.name)}</option>`).join('')}
      </select>
    </label></div>
  </section>`;

  const select = document.getElementById('business-select');
  if (select) {
    select.addEventListener('change', (event) => {
      reportState.selectedBusinessName = event.target.value;
      renderBusinessReport();
    });
  }
}

function renderBusinessReport() {
  const record = reportDataApi.getBusinessRecordByName(reportState.selectedBusinessName);

  if (!record) {
    reportBusinessPanel.innerHTML = `<section class="report-panel"><h2 class="report-title">사업자번호별 리포트</h2><p class="report-empty">등록된 거래처가 없습니다.</p></section>`;
    return;
  }

  const businessSales = reportDataApi.buildBusinessSalesReport(record);
  const salesData = reportDataApi.getSalesData();
  reportBusinessPanel.innerHTML = `<section class="report-panel">
    <h2 class="report-title">사업자번호별 리포트</h2>
    <p class="muted">거래처: ${reportDataApi.escapeHtml(record.name)} / 사업자등록번호: ${reportDataApi.escapeHtml(reportDataApi.formatBusinessNumber(record.businessNumber) || '-')} / 담당자: ${reportDataApi.escapeHtml(record.contactPerson) || '-'}</p>
    <div class="report-summary">
      <span><b>매출합계:</b> ${reportDataApi.formatCurrency(businessSales.amountTotal)}</span>
      <span><b>원가:</b> ${reportDataApi.formatCurrency(businessSales.orderTotal)}</span>
      <span class="profit"><b>수익:</b> ${reportDataApi.formatCurrency(businessSales.profitTotal)}</span>
    </div>
    ${businessSales.groupedEntries.length === 0 ? '<p class="report-empty">이 사업자번호로 저장된 매출이 없습니다.</p>' : businessSales.groupedEntries.map((group) => {
      const entriesWithIndex = (salesData[group.date] || [])
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => reportDataApi.normalizeBusinessNumber(entry.businessNumber) === reportDataApi.normalizeBusinessNumber(record.businessNumber));
      return `<div class="report-group"><h3 class="report-group-title">${group.date}</h3>${renderEditableEntryList(group.date, entriesWithIndex)}</div>`;
    }).join('')}
  </section>`;

  attachReportEntryEvents();
}

function showReportEditForm(date, index) {
  const salesData = reportDataApi.getSalesData();
  const entry = salesData[date]?.[index];
  const businessRecords = reportDataApi.getSortedBusinessRecords();

  if (!entry) {
    reportEditPanel.innerHTML = '';
    return;
  }

  const clientFieldHtml = businessRecords.length > 0
    ? `<select name="client" required>
        <option value="">거래처 선택</option>
        ${businessRecords.map((record) => `<option value="${reportDataApi.escapeHtml(record.name)}"${record.name === entry.client ? ' selected' : ''}>${reportDataApi.escapeHtml(record.name)}</option>`).join('')}
      </select>`
    : `<input type="text" name="client" placeholder="매출처" required autocomplete="off" value="${reportDataApi.escapeHtml(entry.client)}">`;

  reportEditPanel.innerHTML = `<section class="card">
    <h2>리포트에서 매출 수정</h2>
    <form id="report-edit-form" class="stack-form">
      <input type="date" name="entryDate" required value="${reportDataApi.escapeHtml(date)}">
      <input type="number" name="amount" placeholder="매출 금액" required inputmode="numeric" value="${reportDataApi.escapeHtml(entry.amount)}">
      <input type="number" name="order" placeholder="발주가(원가)" required inputmode="numeric" value="${reportDataApi.escapeHtml(entry.order)}">
      ${clientFieldHtml}
      <input type="text" name="memo" placeholder="메모" autocomplete="off" value="${reportDataApi.escapeHtml(entry.memo)}">
      <div class="button-row">
        <button type="submit" class="primary-button">수정 저장</button>
        <button type="button" id="report-edit-cancel" class="secondary-button">취소</button>
      </div>
      <button type="button" id="report-entry-delete" class="danger-button">기록 삭제</button>
    </form>
  </section>`;

  const form = document.getElementById('report-edit-form');
  const clientSelect = form.querySelector('select[name="client"]');
  const clientInput = form.querySelector('input[name="client"]');
  const memoInput = form.querySelector('input[name="memo"]');

  if (clientInput) {
    reportDataApi.setKoreanInput(clientInput);
  }
  reportDataApi.setKoreanInput(memoInput);

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const nextDate = form.entryDate.value;
    const clientValue = clientSelect ? clientSelect.value : form.client.value.trim();
    const clientRecord = reportDataApi.getBusinessRecordByName(clientValue);

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
    }

    reportDataApi.saveSalesData(salesData);
    reportEditPanel.innerHTML = '';
    rerenderAllReports();
  });

  document.getElementById('report-edit-cancel').addEventListener('click', () => {
    reportEditPanel.innerHTML = '';
  });

  document.getElementById('report-entry-delete').addEventListener('click', () => {
    const confirmed = window.confirm('이 매출 기록을 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    removeSalesEntry(salesData, date, index);
    reportDataApi.saveSalesData(salesData);
    reportEditPanel.innerHTML = '';
    rerenderAllReports();
  });
}

renderReportYearSelector();
renderReportMonthSelector();
renderMonthReport();
renderYearReport();
renderBusinessSelector();
renderBusinessReport();