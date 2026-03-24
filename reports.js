const reportDataApi = window.SalesCardData;

reportDataApi.registerServiceWorker();

const reportYearSelector = document.getElementById('year-selector');
const reportMonthSelector = document.getElementById('month-selector');
const reportMonthPanel = document.getElementById('month-report');
const reportYearPanel = document.getElementById('year-report');
const reportBusinessSelector = document.getElementById('business-selector');
const reportBusinessPanel = document.getElementById('business-report');

const reportState = {
  selectedYear: new Date().getFullYear(),
  selectedMonth: 1,
  selectedBusinessName: '',
};

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
    <h2 class="report-title">${reportState.selectedYear}년 ${reportState.selectedMonth}월 리포트</h2>
    <div class="report-summary">
      <span><b>매출합계:</b> ${reportDataApi.formatCurrency(summary.amountTotal)}</span>
      <span><b>원가:</b> ${reportDataApi.formatCurrency(summary.orderTotal)}</span>
      <span class="profit"><b>수익:</b> ${reportDataApi.formatCurrency(summary.profitTotal)}</span>
    </div>
    ${groups.length === 0 ? '<p class="report-empty">선택한 월의 매출 내역이 없습니다.</p>' : groups.map((group) => `<div class="report-group"><h3 class="report-group-title">${group.date}</h3>${reportDataApi.renderEntryItems(group.entries)}</div>`).join('')}
  </section>`;
}

function renderYearReport() {
  const summary = reportDataApi.calculateYearSummary(reportState.selectedYear);
  const groups = reportDataApi.getYearlyEntries(reportState.selectedYear);

  reportYearPanel.innerHTML = `<section class="report-panel">
    <h2 class="report-title">${reportState.selectedYear}년 연간 리포트</h2>
    <div class="report-summary">
      <span><b>연매출:</b> ${reportDataApi.formatCurrency(summary.amountTotal)}</span>
      <span><b>원가:</b> ${reportDataApi.formatCurrency(summary.orderTotal)}</span>
      <span class="profit"><b>수익:</b> ${reportDataApi.formatCurrency(summary.profitTotal)}</span>
    </div>
    ${groups.length === 0 ? '<p class="report-empty">선택한 연도의 매출 내역이 없습니다.</p>' : groups.map((group) => `<div class="report-group"><h3 class="report-group-title">${group.month}월</h3>${group.dates.map((dateGroup) => `<div class="report-group"><h4 class="report-group-title">${dateGroup.date}</h4>${reportDataApi.renderEntryItems(dateGroup.entries)}</div>`).join('')}</div>`).join('')}
  </section>`;
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
  reportBusinessPanel.innerHTML = `<section class="report-panel">
    <h2 class="report-title">사업자번호별 리포트</h2>
    <p class="muted">거래처: ${reportDataApi.escapeHtml(record.name)} / 사업자등록번호: ${reportDataApi.escapeHtml(reportDataApi.formatBusinessNumber(record.businessNumber) || '-')} / 담당자: ${reportDataApi.escapeHtml(record.contactPerson) || '-'}</p>
    <div class="report-summary">
      <span><b>매출합계:</b> ${reportDataApi.formatCurrency(businessSales.amountTotal)}</span>
      <span><b>원가:</b> ${reportDataApi.formatCurrency(businessSales.orderTotal)}</span>
      <span class="profit"><b>수익:</b> ${reportDataApi.formatCurrency(businessSales.profitTotal)}</span>
    </div>
    ${businessSales.groupedEntries.length === 0 ? '<p class="report-empty">이 사업자번호로 저장된 매출이 없습니다.</p>' : businessSales.groupedEntries.map((group) => `<div class="report-group"><h3 class="report-group-title">${group.date}</h3>${reportDataApi.renderEntryItems(group.entries)}</div>`).join('')}
  </section>`;
}

renderReportYearSelector();
renderReportMonthSelector();
renderMonthReport();
renderYearReport();
renderBusinessSelector();
renderBusinessReport();