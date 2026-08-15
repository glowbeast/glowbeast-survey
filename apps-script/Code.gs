/**
 * glowbeast × othership 설문 응답 수집기
 *
 * 설치 방법 (SETUP.md 참고):
 *   응답 시트를 열고 확장 프로그램 → Apps Script → 이 코드를 붙여넣고 → 배포 → 새 배포 → 웹 앱
 *
 * 시트에 바인딩된(container-bound) 스크립트라서 시트 ID를 따로 적을 필요가 없습니다.
 */

var SHEET_NAME = 'responses';

// 열 순서 = 설문 문항 순서. 폼의 data-key 와 정확히 일치해야 합니다.
var COLUMNS = [
  ['submittedAt', 'Submitted at'],
  ['q1a', 'Spray — first impression'],
  ['q1b', 'Spray — first impression (other)'],
  ['q2a', 'Spray — skin feel in sauna'],
  ['q2b', 'Spray — skin feel (other)'],
  ['q5a', 'Spray — reach for it regularly?'],
  ['c1a', 'Cleanser — first impression'],
  ['c1b', 'Cleanser — first impression (other)'],
  ['c2a', 'Cleanser — skin feel after cleansing'],
  ['c2b', 'Cleanser — skin feel (other)'],
  ['c5a', 'Cleanser — reach for it regularly?'],
  ['q6', 'First word for "glowbeast"'],
  ['q7', 'Brands with same vibe'],
  ['q8a', 'Recommend to a friend?'],
  ['q8b', 'Why, or why not?'],
  ['q9a', 'Want an invite to next session?'],
  ['q9b', 'Insta handle'],
  ['userAgent', 'User agent']
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
      var v = data[key];

      if (key === 'submittedAt') {
        // ISO 문자열을 시트에서 읽기 좋은 날짜값으로.
        var d = v ? new Date(v) : new Date();
        return isNaN(d.getTime()) ? new Date() : d;
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
