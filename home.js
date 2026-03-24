const homeData = window.SalesCardData;

homeData.registerServiceWorker();

function renderHomeSummary() {
  const container = document.getElementById('home-summary');
  const today = new Date();
  const monthSummary = homeData.calculateMonthSummary(today.getFullYear(), today.getMonth() + 1);
  const salesData = homeData.getSalesData();
  const businessRecords = homeData.getBusinessRecords();
  const recentDates = Object.keys(salesData).sort().reverse().slice(0, 3);

  container.innerHTML = `<p class="summary-copy">이번 달 흐름과 현재 등록된 데이터 상태를 홈에서 빠르게 확인할 수 있습니다.</p>
    <div class="summary-grid">
      <div class="summary-tile">
        <strong>${homeData.formatCurrency(monthSummary.amountTotal)}</strong>
        <span class="muted">이번 달 매출</span>
      </div>
      <div class="summary-tile">
        <strong>${homeData.formatCurrency(monthSummary.profitTotal)}</strong>
        <span class="muted">이번 달 수익</span>
      </div>
      <div class="summary-tile">
        <strong>${businessRecords.length}곳</strong>
        <span class="muted">등록 거래처</span>
      </div>
      <div class="summary-tile">
        <strong>${Object.keys(salesData).length}일</strong>
        <span class="muted">기록된 날짜</span>
      </div>
    </div>
    <div class="settings-box">
      <h3>최근 기록일</h3>
      ${recentDates.length === 0 ? '<p class="empty-text">아직 저장된 매출 기록이 없습니다.</p>' : `<ul class="report-list">${recentDates.map((date) => `<li>${date}</li>`).join('')}</ul>`}
    </div>`;
}

renderHomeSummary();