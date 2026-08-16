/**
 * glowbeast × othership 설문 응답 수집기
 *
 * 설치 방법 (SETUP.md 참고):
 *   응답 시트를 열고 확장 프로그램 → Apps Script → 이 코드를 붙여넣고 → 배포 → 새 배포 → 웹 앱
 *
 * 시트에 바인딩된(container-bound) 스크립트라서 시트 ID를 따로 적을 필요가 없습니다.
 */

// 응답이 쌓일 스프레드시트 ID.
// https://docs.google.com/spreadsheets/d/★이부분★/edit
// 비워두면 이 스크립트가 붙어 있는 시트를 사용합니다.
var SPREADSHEET_ID = '1W1hzXZn8-q-MXDK3sPQbPsaYIedVEbBdhBRDBTKelo0';

var SHEET_NAME = 'responses';

// 'sauna events' 열에 자동으로 채워 넣을 값. 행사가 바뀌면 여기만 바꾸세요.
// 비워두면(''), 원본 러닝 설문처럼 나중에 손으로 태깅하는 열이 됩니다.
var EVENT_TAG = 'othership';

// 열 순서 = 설문 문항 순서. 첫 항목은 폼의 data-key(없으면 null), 둘째는 시트 1행 헤더.
// 헤더는 "문항키 — 실제 질문" 형태라서, 어느 답이 어느 질문의 답인지 1행만 봐도 구분됩니다.
var COLUMNS = [
  ['submittedAt', 'Submitted at'],
  [null,          'Sauna event'],

  ['q1a', 'q1a — What was your first impression of the spray?'],
  ['q1b', 'q1b — First impression of the spray (other)'],
  ['q2a', 'q2a — How did your skin feel in the sauna after spraying?'],
  ['q2b', 'q2b — Skin feel after spraying (other)'],
  ['q5a', 'q5a — Will you reach for the spray on regular sauna sessions?'],

  ['c1a', 'c1a — What was your first impression of the cleanser?'],
  ['c1b', 'c1b — First impression of the cleanser (other)'],
  ['c2a', 'c2a — How did your skin feel after cleansing?'],
  ['c2b', 'c2b — Skin feel after cleansing (other)'],
  ['c5a', 'c5a — Will you reach for the cleanser on regular sauna sessions?'],

  ['q6',  'q6 — First word that comes to mind for “glowbeast”'],
  ['q7',  'q7 — Which brands give off the same vibe/energy?'],
  ['q8a', 'q8a — Would you recommend us to a friend?'],
  ['q8b', 'q8b — Why, or why not?'],

  ['userAgent', 'Device / browser']
];

/**
 * 시트를 가져오고, 없으면 만들고, 1행 헤더를 항상 최신 문구로 맞춥니다.
 */
function getSheet_() {
  var ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  ensureHeaders_(sheet);
  return sheet;
}

/**
 * 1행을 COLUMNS 의 문구로 맞춰 둡니다.
 * 빈 시트면 헤더를 깔고, 문구가 바뀌었으면 1행만 덮어씁니다. 아래 응답 줄은 건드리지 않습니다.
 */
function ensureHeaders_(sheet) {
  var headers = COLUMNS.map(function (c) { return c[1]; });
  var width = headers.length;

  if (sheet.getMaxColumns() < width) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), width - sheet.getMaxColumns());
  }

  // 문항이 줄어든 경우, 예전 헤더가 오른쪽에 남지 않도록 지웁니다.
  var extra = sheet.getMaxColumns() - width;
  if (extra > 0) {
    sheet.getRange(1, width + 1, 1, extra).clearContent().clearFormat();
  }

  var range = sheet.getRange(1, 1, 1, width);
  var current = range.getValues()[0];
  var same = headers.every(function (h, i) { return String(current[i]) === h; });
  if (same) return;

  range.setValues([headers]);
  range.setFontWeight('bold').setBackground('#ffff00').setVerticalAlignment('middle');
  sheet.setFrozenRows(1);
}

/**
 * 폼에서 POST 로 넘어온 JSON 을 한 줄로 기록합니다.
 * 폼은 Content-Type 을 text/plain 으로 보내기 때문에 e.postData.contents 를 직접 파싱합니다.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();

  try {
    // 동시에 여러 명이 제출해도 줄이 겹치지 않도록 잠급니다.
    lock.waitLock(20000);

    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents) || {};
    }

    var row = COLUMNS.map(function (c) {
      var key = c[0];

      // 폼에서 안 오는 열(행사 태그)은 상수로 채웁니다.
      if (key === null) return EVENT_TAG;

      var v = data[key];

      // submittedAt 은 기존 시트와 똑같이 ISO 문자열 그대로 둡니다.
      if (key === 'submittedAt') {
        return v ? String(v) : new Date().toISOString();
      }
      if (Array.isArray(v)) return v.join(', ');
      return v === undefined || v === null ? '' : String(v);
    });

    getSheet_().appendRow(row);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

/**
 * 배포가 살아있는지 브라우저에서 바로 확인하는 용도.
 */
function doGet() {
  // 방문할 때마다 1행 헤더가 최신 문구인지 맞춰 둡니다(같으면 아무것도 하지 않음).
  try {
    getSheet_();
  } catch (err) {
    return json_({ ok: false, message: 'sheet not reachable', error: String(err) });
  }
  return json_({ ok: true, message: 'glowbeast survey collector is live' });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Apps Script 편집기에서 직접 실행해 보는 테스트용 함수.
 * 실행하면 시트에 더미 응답 한 줄이 들어갑니다. 확인 후 그 줄은 지우세요.
 */
function testAppend() {
  doPost({
    postData: {
      contents: JSON.stringify({
        submittedAt: new Date().toISOString(),
        q1a: 'Refreshing',
        c1a: 'Cleansing power',
        q6: 'test',
        userAgent: 'manual test'
      })
    }
  });
}
