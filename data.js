const SalesCardData = (() => {
  const SALES_KEY = 'salesData';
  const BUSINESS_KEY = 'businessRecords';

  function getSalesData() {
    return JSON.parse(localStorage.getItem(SALES_KEY) || '{}');
  }

  function saveSalesData(data) {
    localStorage.setItem(SALES_KEY, JSON.stringify(data));
  }

  function getBusinessRecords() {
    return JSON.parse(localStorage.getItem(BUSINESS_KEY) || '[]');
  }

  function saveBusinessRecords(records) {
    localStorage.setItem(BUSINESS_KEY, JSON.stringify(records));
  }

  function getSortedBusinessRecords() {
    return getBusinessRecords().sort((left, right) => left.name.localeCompare(right.name, 'ko'));
  }

  function getBusinessRecordByName(name) {
    return getBusinessRecords().find((record) => record.name === name) || null;
  }

  function normalizeBusinessNumber(value) {
    return String(value ?? '').replace(/\D/g, '').slice(0, 10);
  }

  function formatBusinessNumber(value) {
    const digits = normalizeBusinessNumber(value);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 10)}`;
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

  function formatCurrency(value) {
    return `${(Number(value) || 0).toLocaleString()}원`;
  }

  function getYearOptions() {
    const currentYear = new Date().getFullYear();
    const years = [];

    for (let year = currentYear - 3; year <= currentYear + 1; year += 1) {
      years.push(year);
    }

    return years;
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

  function buildBusinessSalesReport(record) {
    const businessNumber = normalizeBusinessNumber(record.businessNumber);
    if (!businessNumber) {
      return {
        amountTotal: 0,
        orderTotal: 0,
        profitTotal: 0,
        groupedEntries: [],
      };
    }

    const salesData = getSalesData();
    const groupedEntries = [];
    let amountTotal = 0;
    let orderTotal = 0;

    Object.keys(salesData).sort().forEach((date) => {
      const entries = salesData[date].filter((entry) => {
        const entryBusinessNumber = normalizeBusinessNumber(entry.businessNumber);
        if (entryBusinessNumber) {
          return entryBusinessNumber === businessNumber;
        }

        const mappedRecord = getBusinessRecordByName(entry.client);
        return normalizeBusinessNumber(mappedRecord?.businessNumber) === businessNumber;
      });

      if (entries.length === 0) {
        return;
      }

      entries.forEach((entry) => {
        amountTotal += Number(entry.amount) || 0;
        orderTotal += Number(entry.order) || 0;
      });

      groupedEntries.push({ date, entries });
    });

    return {
      amountTotal,
      orderTotal,
      profitTotal: amountTotal - orderTotal,
      groupedEntries,
    };
  }

  function renderEntryItems(entries) {
    return '<ul class="report-list">' +
      entries.map((entry) => `<li>
        <b>${formatCurrency(entry.amount)}</b> (${escapeHtml(entry.client)})<br>
        사업자등록번호: ${escapeHtml(formatBusinessNumber(entry.businessNumber) || '-')}<br>
        원가: ${formatCurrency(entry.order)}<br>
        담당자: ${escapeHtml(entry.contactPerson) || '-'}<br>
        메모: ${escapeHtml(entry.memo) || '-'}
      </li>`).join('') +
      '</ul>';
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

  function exportAllData() {
    return {
      salesData: getSalesData(),
      businessRecords: getBusinessRecords(),
      exportedAt: new Date().toISOString(),
    };
  }

  function importAllData(payload) {
    const salesData = payload && typeof payload.salesData === 'object' ? payload.salesData : {};
    const businessRecords = Array.isArray(payload?.businessRecords) ? payload.businessRecords : [];
    saveSalesData(salesData);
    saveBusinessRecords(businessRecords);
  }

  function resetAllData() {
    localStorage.removeItem(SALES_KEY);
    localStorage.removeItem(BUSINESS_KEY);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    });
  }

  return {
    getSalesData,
    saveSalesData,
    getBusinessRecords,
    saveBusinessRecords,
    getSortedBusinessRecords,
    getBusinessRecordByName,
    normalizeBusinessNumber,
    formatBusinessNumber,
    setKoreanInput,
    escapeHtml,
    formatCurrency,
    getYearOptions,
    calculateMonthSummary,
    calculateYearSummary,
    getMonthlyEntries,
    getYearlyEntries,
    buildBusinessSalesReport,
    renderEntryItems,
    compressImageFile,
    exportAllData,
    importAllData,
    resetAllData,
    registerServiceWorker,
  };
})();

window.SalesCardData = SalesCardData;