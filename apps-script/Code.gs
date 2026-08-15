/**
 * glowbeast × othership 설문 응답 수집기
 *
 * 설치 방법 (SETUP.md 참고):
 *   응답 시트를 열고 확장 프로그램 → Apps Script → 이 코드를 붙여넣고 → 배포 → 새 배포 → 웹 앱
 *
 * 시트에 바인딩된(container-bound) 스크립트라서 시트 ID를 따로 적을 필요가 없습니다.
 */

var SHEET_NAME = 'responses';

// 'sauna events' 열에 자동으로 채워 넣을 값. 행사가 바뀌면 여기만 바꾸세요.
// 비워두면(''), 원본 러닝 설문처럼 나중에 손으로 태깅하는 열이 됩니다.
var EVENT_TAG = 'othership';

// 열 순서 = 설문 문항 순서. 첫 항목은 폼의 data-key(없으면 null), 둘째는 시트 헤더.
// 헤더 표기는 기존 러닝 설문 응답 시트와 같은 스네이크케이스 키 형식을 따릅니다.
var COLUMNS = [
  ['submittedAt', 'submittedAt'],
  [null,          'sauna events'],

  ['q1a', 'q1a_spray_first_impression'],
  ['q1b', 'q1b_spray_first_impr_other'],
  ['q2a', 'q2a_spray_skin_feel'],
  ['q2b', 'q2b_spray_skin_feel_other'],
  ['q5a', 'q5a_spray_regular_sessions'],

  ['c1a', 'c1a_cleanser_first_impression'],
  ['c1b', 'c1b_cleanser_first_impr_other'],
  ['c2a', 'c2a_cleanser_skin_feel'],
  ['c2b', 'c2b_cleanser_skin_feel_other'],
  ['c5a', 'c5a_cleanser_regular_sessions'],

  ['q6',  'q6_first_word'],
  ['q7',  'q7_similar_brands'],
  ['q8a', 'q8a_recommend'],
  ['q8b', 'q8b_recommend_why'],
  ['q9a', 'q9a_next_session_invite'],
  ['q9b', 'q9b_insta_handle'],

  ['userAgent', 'userAgent']
];

/**
 * 시트를 가져오고, 없으면 만들고, 헤더가 없으면 첫 줄에 헤더를 깝니다.
 */
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    var headers = COLUMNS.map(function (c) { return c[1]; });
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
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
