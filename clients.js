const clientDataApi = window.SalesCardData;

clientDataApi.registerServiceWorker();

const businessRegistry = document.getElementById('business-registry');
const clientState = {
  selectedBusinessName: '',
};

function renderBusinessRegistry() {
  const records = clientDataApi.getSortedBusinessRecords();
  const selectedRecord = records.find((record) => record.name === clientState.selectedBusinessName) || null;
  const isEditMode = Boolean(selectedRecord);
  const businessSales = selectedRecord ? clientDataApi.buildBusinessSalesReport(selectedRecord) : null;

  let listHtml = '<p class="empty-text">저장된 거래처가 없습니다.</p>';
  if (records.length > 0) {
    listHtml = '<ul class="client-list">' +
      records.map((record) => `<li>
        <button type="button" class="client-button${selectedRecord && selectedRecord.name === record.name ? ' is-active' : ''}" data-client-name="${clientDataApi.escapeHtml(record.name)}">
          <strong>${clientDataApi.escapeHtml(record.name)}</strong>
          <span class="client-meta">${clientDataApi.escapeHtml(clientDataApi.formatBusinessNumber(record.businessNumber) || '사업자등록번호 없음')} · ${clientDataApi.escapeHtml(record.contactPerson) || '담당자 없음'}</span>
        </button>
      </li>`).join('') +
      '</ul>';
  }

  let viewerHtml = '<p class="empty-text">거래처 이름을 누르면 등록증과 사업자번호별 매출을 확인할 수 있습니다.</p>';
  if (selectedRecord) {
    viewerHtml = `<div class="certificate-viewer">
      <h3>${clientDataApi.escapeHtml(selectedRecord.name)}</h3>
      <p>사업자등록번호: ${clientDataApi.escapeHtml(clientDataApi.formatBusinessNumber(selectedRecord.businessNumber) || '-')}</p>
      <p>담당자: ${clientDataApi.escapeHtml(selectedRecord.contactPerson) || '-'}</p>
      <p>이메일: ${clientDataApi.escapeHtml(selectedRecord.email) || '-'}</p>
      <div class="certificate-actions">
        <button type="button" id="new-client" class="secondary-button">새 거래처 등록</button>
        <button type="button" id="delete-client" class="danger-button">삭제</button>
      </div>
      <img src="${selectedRecord.imageData}" alt="${clientDataApi.escapeHtml(selectedRecord.name)} 사업자등록증" class="certificate-image">
      <div class="report-panel embedded-report">
        <h3 class="report-title">사업자번호별 매출</h3>
        <div class="report-summary">
          <span><b>매출합계:</b> ${clientDataApi.formatCurrency(businessSales.amountTotal)}</span>
          <span><b>원가:</b> ${clientDataApi.formatCurrency(businessSales.orderTotal)}</span>
          <span class="profit"><b>수익:</b> ${clientDataApi.formatCurrency(businessSales.profitTotal)}</span>
        </div>
        ${businessSales.groupedEntries.length === 0 ? '<p class="report-empty">이 사업자번호로 저장된 매출이 없습니다.</p>' : businessSales.groupedEntries.map((group) => `<div class="report-group"><h4 class="report-group-title">${group.date}</h4>${clientDataApi.renderEntryItems(group.entries)}</div>`).join('')}
      </div>
    </div>`;
  }

  businessRegistry.innerHTML = `<section class="section-card">
    <h2>거래처 등록</h2>
    <form id="business-record-form" class="stack-form">
      <input type="text" name="name" placeholder="거래처 이름" required autocomplete="off" value="${selectedRecord ? clientDataApi.escapeHtml(selectedRecord.name) : ''}">
      <input type="text" name="businessNumber" placeholder="사업자등록번호" autocomplete="off" value="${selectedRecord ? clientDataApi.escapeHtml(selectedRecord.businessNumber) : ''}">
      <input type="text" name="contactPerson" placeholder="담당자" autocomplete="off" value="${selectedRecord ? clientDataApi.escapeHtml(selectedRecord.contactPerson) : ''}">
      <input type="email" name="email" placeholder="이메일" autocomplete="off" value="${selectedRecord ? clientDataApi.escapeHtml(selectedRecord.email) : ''}">
      <input type="file" name="certificate" accept="image/*" ${isEditMode ? '' : 'required'}>
      <p class="file-hint">이미지는 저장 전에 자동으로 축소/압축됩니다. ${isEditMode ? '새 이미지를 올리지 않으면 기존 파일을 유지합니다.' : ''}</p>
      <div class="button-row${isEditMode ? '' : ' single'}">
        <button type="submit" class="primary-button">${isEditMode ? '거래처 수정 저장' : '거래처 저장'}</button>
        ${isEditMode ? '<button type="button" id="cancel-edit" class="secondary-button">수정 취소</button>' : ''}
      </div>
    </form>
    ${listHtml}
    ${viewerHtml}
  </section>`;

  const form = document.getElementById('business-record-form');
  const nameInput = form.querySelector('input[name="name"]');
  const businessNumberInput = form.querySelector('input[name="businessNumber"]');
  const contactPersonInput = form.querySelector('input[name="contactPerson"]');
  const emailInput = form.querySelector('input[name="email"]');
  const fileInput = form.querySelector('input[name="certificate"]');

  clientDataApi.setKoreanInput(nameInput);
  clientDataApi.setKoreanInput(contactPersonInput);
  businessNumberInput.setAttribute('inputmode', 'numeric');
  emailInput.setAttribute('autocapitalize', 'off');
  emailInput.setAttribute('autocorrect', 'off');
  emailInput.setAttribute('spellcheck', 'false');

  businessNumberInput.addEventListener('input', () => {
    businessNumberInput.value = clientDataApi.formatBusinessNumber(businessNumberInput.value);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const trimmedName = form.name.value.trim();
    if (!trimmedName) {
      return;
    }

    try {
      const file = fileInput.files[0];
      const recordsData = clientDataApi.getBusinessRecords();
      const editingName = selectedRecord ? selectedRecord.name : null;
      const existingIndex = recordsData.findIndex((record) => record.name === editingName);
      const duplicateIndex = recordsData.findIndex((record) => record.name === trimmedName);
      const imageData = file ? await clientDataApi.compressImageFile(file) : selectedRecord?.imageData;

      if (!imageData) {
        window.alert('사업자등록증 이미지를 선택해 주세요.');
        return;
      }

      if (duplicateIndex >= 0 && recordsData[duplicateIndex].name !== editingName) {
        window.alert('같은 거래처 이름이 이미 있습니다. 다른 이름을 사용해 주세요.');
        return;
      }

      const nextRecord = {
        name: trimmedName,
        businessNumber: clientDataApi.formatBusinessNumber(form.businessNumber.value),
        contactPerson: form.contactPerson.value.trim(),
        email: form.email.value.trim(),
        imageData,
      };

      if (existingIndex >= 0) {
        recordsData.splice(existingIndex, 1, nextRecord);
      } else {
        recordsData.push(nextRecord);
      }

      clientDataApi.saveBusinessRecords(recordsData);
      clientState.selectedBusinessName = nextRecord.name;
      renderBusinessRegistry();
    } catch (error) {
      window.alert('이미지 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  });

  document.querySelectorAll('[data-client-name]').forEach((button) => {
    button.addEventListener('click', () => {
      clientState.selectedBusinessName = button.dataset.clientName;
      renderBusinessRegistry();
    });
  });

  if (isEditMode) {
    document.getElementById('cancel-edit').addEventListener('click', () => {
      clientState.selectedBusinessName = '';
      renderBusinessRegistry();
    });

    document.getElementById('new-client').addEventListener('click', () => {
      clientState.selectedBusinessName = '';
      renderBusinessRegistry();
    });

    document.getElementById('delete-client').addEventListener('click', () => {
      const nextRecords = clientDataApi.getBusinessRecords().filter((record) => record.name !== selectedRecord.name);
      clientDataApi.saveBusinessRecords(nextRecords);
      clientState.selectedBusinessName = '';
      renderBusinessRegistry();
    });
  }
}

renderBusinessRegistry();