// 연도 선택
const yearSelector = document.getElementById('year-selector');
const monthSelector = document.getElementById('month-selector');
const calendar = document.getElementById('calendar');
const salesForm = document.getElementById('sales-form');

const now = new Date();
const years = [];
for (let y = now.getFullYear() - 3; y <= now.getFullYear() + 1; y++) {
  years.push(y);
}

function renderYearSelector() {
  yearSelector.innerHTML = '<label>연도 선택: <select id="year-select">' +
    years.map(y => `<option value="${y}">${y}</option>`).join('') +
    '</select></label>';
  document.getElementById('year-select').addEventListener('change', (e) => {
    renderMonthSelector(Number(e.target.value), 1);
    monthSelector.style.display = '';
    calendar.style.display = '';
    renderCalendar(Number(e.target.value), 1);
    salesForm.style.display = 'none';
  });
  // 최초 진입 시 현재 연도, 1월 표시
  const initialYear = Number(document.getElementById('year-select').value);
  renderMonthSelector(initialYear, 1);
  monthSelector.style.display = '';
  calendar.style.display = '';
  renderCalendar(initialYear, 1);
}

function renderMonthSelector(year, selectedMonth = 1) {
  monthSelector.innerHTML = '<label>월 선택: <select id="month-select">' +
    Array.from({length:12}, (_,i) => `<option value="${i+1}"${selectedMonth === i+1 ? ' selected' : ''}>${i+1}월</option>`).join('') +
    '</select></label>';
  document.getElementById('month-select').addEventListener('change', (e) => {
    renderCalendar(year, Number(e.target.value));
    calendar.style.display = '';
    salesForm.style.display = 'none';
  });
}

function renderCalendar(year, month) {
  const firstDay = new Date(year, month-1, 1);
  const lastDay = new Date(year, month, 0);
  let html = `<table><tr>`;
  const days = ['일','월','화','수','목','금','토'];
  html += days.map(d=>`<th>${d}</th>`).join('') + '</tr><tr>';
  for(let i=0;i<firstDay.getDay();i++) html += '<td></td>';
  for(let d=1;d<=lastDay.getDate();d++) {
    const dayOfWeek = (firstDay.getDay() + d - 1) % 7;
    html += `<td class="calendar-day" data-date="${year}-${month.toString().padStart(2,'0')}-${d.toString().padStart(2,'0')}">${d}</td>`;
    if(dayOfWeek === 6 && d !== lastDay.getDate()) html += '</tr><tr>';
  }
  html += '</tr></table>';
  calendar.innerHTML = html;
  document.querySelectorAll('.calendar-day').forEach(td => {
    td.addEventListener('click', (e) => {
      showSalesForm(td.dataset.date);
    });
  });
}

function showSalesForm(date) {
  salesForm.style.display = '';
  // 저장된 데이터 불러오기
  const salesData = JSON.parse(localStorage.getItem('salesData') || '{}');
  const daySales = salesData[date] || [];

  let listHtml = '';
  if (daySales.length > 0) {
    listHtml = '<div style="margin-bottom:12px;"><b>저장된 매출 내역</b><ul style="padding-left:18px;">' +
      daySales.map((item, idx) => `<li><b>${item.amount.toLocaleString()}원</b> (${item.client})<br><span style='color:#888;font-size:0.95em;'>${item.memo ? item.memo : ''}</span></li>`).join('') +
      '</ul></div>';
  }

  salesForm.innerHTML = `<h3>${date} 매출 기록</h3>
    ${listHtml}
    <form id="sales-entry-form">
      <input type="number" name="amount" placeholder="매출 금액" required style="width:100%;margin-bottom:8px;">
      <input type="text" name="client" placeholder="매출처" required style="width:100%;margin-bottom:8px;">
      <input type="text" name="memo" placeholder="메모" style="width:100%;margin-bottom:8px;">
      <button type="submit">저장</button>
    </form>`;
  document.getElementById('sales-entry-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    const amount = Number(form.amount.value);
    const client = form.client.value;
    const memo = form.memo.value;
    const newEntry = { amount, client, memo };
    const salesData = JSON.parse(localStorage.getItem('salesData') || '{}');
    if (!salesData[date]) salesData[date] = [];
    salesData[date].push(newEntry);
    localStorage.setItem('salesData', JSON.stringify(salesData));
    showSalesForm(date); // 저장 후 다시 보여주기
  });
}

renderYearSelector();
