const settingsDataApi = window.SalesCardData;

settingsDataApi.registerServiceWorker();

const settingsPanel = document.getElementById('settings-panel');

function downloadJsonFile(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderSettings() {
  const salesData = settingsDataApi.getSalesData();
  const businessRecords = settingsDataApi.getBusinessRecords();

  settingsPanel.innerHTML = `<section class="settings-panel">
    <h2>데이터 관리</h2>
    <div class="settings-grid">
      <div class="settings-tile">
        <strong>${Object.keys(salesData).length}일</strong>
        <span class="muted">기록된 매출 날짜</span>
      </div>
      <div class="settings-tile">
        <strong>${businessRecords.length}곳</strong>
        <span class="muted">등록된 거래처</span>
      </div>
    </div>

    <div class="settings-box">
      <h3>백업 내보내기</h3>
      <p class="settings-note">현재 매출 데이터와 거래처 정보를 JSON 파일로 다운로드합니다.</p>
      <button type="button" id="export-data" class="primary-button">백업 파일 다운로드</button>
    </div>

    <div class="settings-box">
      <h3>백업 가져오기</h3>
      <p class="settings-note">기존 데이터를 덮어쓰므로, 가져오기 전에 현재 데이터를 먼저 백업하는 편이 안전합니다.</p>
      <div class="stack-form">
        <input type="file" id="import-file" accept="application/json">
        <button type="button" id="import-data" class="secondary-button">백업 파일 가져오기</button>
      </div>
    </div>

    <div class="settings-box">
      <h3>전체 초기화</h3>
      <p class="settings-note">매출 데이터와 거래처 정보를 모두 삭제합니다. 되돌릴 수 없습니다.</p>
      <button type="button" id="reset-data" class="danger-button">전체 데이터 초기화</button>
    </div>
  </section>`;

  document.getElementById('export-data').addEventListener('click', () => {
    const payload = settingsDataApi.exportAllData();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJsonFile(`sales-card-backup-${stamp}.json`, payload);
  });

  document.getElementById('import-data').addEventListener('click', async () => {
    const fileInput = document.getElementById('import-file');
    const file = fileInput.files[0];

    if (!file) {
      window.alert('가져올 백업 파일을 선택해 주세요.');
      return;
    }

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      settingsDataApi.importAllData(payload);
      renderSettings();
      window.alert('백업 파일을 가져왔습니다.');
    } catch (error) {
      window.alert('백업 파일을 읽는 중 오류가 발생했습니다.');
    }
  });

  document.getElementById('reset-data').addEventListener('click', () => {
    const confirmed = window.confirm('모든 매출 데이터와 거래처 정보를 삭제하시겠습니까?');
    if (!confirmed) {
      return;
    }

    settingsDataApi.resetAllData();
    renderSettings();
  });
}

renderSettings();