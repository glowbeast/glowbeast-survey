# glowbeast × othership 설문 — 배포 가이드

폼 파일: `othership/index.html`
응답 수집 스크립트: `apps-script/Code.gs`

목표 주소: **https://glowbeast.github.io/glowbeast-survey/othership/**

아래 두 단계는 각각 서영님 구글 계정과 깃허브 계정 로그인이 필요해서 제가 대신 못 합니다.
순서대로 따라오시면 됩니다.

---

## 1단계 — 구글 시트에 응답 자동 저장

응답 시트는 이미 만들어 뒀습니다:
**glowbeast × othership — survey responses**
https://docs.google.com/spreadsheets/d/1W1hzXZn8-q-MXDK3sPQbPsaYIedVEbBdhBRDBTKelo0/edit

1. 위 시트를 엽니다.
2. 상단 메뉴 **확장 프로그램 → Apps Script** 클릭.
3. 편집기에 있던 기본 코드(`function myFunction() {}`)를 **전부 지우고**,
   이 저장소의 `apps-script/Code.gs` 내용을 **전부 붙여넣기** 후 저장(⌘S).
4. 왼쪽 위 프로젝트 이름을 `glowbeast survey collector` 정도로 바꿔둡니다.
5. 오른쪽 위 **배포 → 새 배포** 클릭.
   - 톱니바퀴(유형 선택) → **웹 앱**
   - 설명: `v1`
   - **다음 사용자 인증 정보로 실행:** 나(seoyoung.yun@grandeclip.com)
   - **액세스 권한이 있는 사용자:** **모든 사용자**  ← 이게 핵심입니다. 로그인 안 한 참가자도 제출할 수 있어야 합니다.
   - **배포** 클릭.
6. 권한 승인 창이 뜹니다 → 계정 선택 → "이 앱은 확인되지 않았습니다" 화면에서
   **고급 → (안전하지 않은 페이지)로 이동** → **허용**.
   (본인이 방금 만든 스크립트라 정상입니다.)
7. 배포가 끝나면 **웹 앱 URL** 이 나옵니다. `https://script.google.com/macros/s/.../exec` 형태입니다.
   이 주소를 복사하세요.
8. 그 주소를 브라우저에 그냥 붙여넣어 열어보면
   `{"ok":true,"message":"glowbeast survey collector is live"}` 가 떠야 정상입니다.
9. `othership/index.html` 을 열어 아래 줄의 따옴표 안에 그 URL 을 붙여넣습니다:

   ```js
   window.OTHERSHIP_ENDPOINT = "";
   ```
   ↓
   ```js
   window.OTHERSHIP_ENDPOINT = "https://script.google.com/macros/s/여기에_붙여넣기/exec";
   ```

   > 이 줄만 채워주시면 나머지는 제가 붙여넣어 드릴 수 있습니다. URL 만 알려주세요.

10. 폼을 열어 아무 답이나 채우고 **Send it** 을 눌러보세요. 시트 `responses` 탭에 한 줄이 쌓이면 성공입니다.
    테스트 줄은 나중에 지우면 됩니다.

**코드를 수정하면 반드시 다시 배포해야 합니다.** 배포 → 배포 관리 → 연필 아이콘 → 버전 `새 버전` → 배포.
(새 배포를 또 만들면 URL 이 바뀌니 주의)

---

## 2단계 — 웹사이트로 공유 (GitHub Pages)

이 폴더는 이미 git 저장소로 초기화하고 첫 커밋까지 해뒀습니다. 올리기만 하면 됩니다.

### 방법 A — `gh` CLI (한 번 설치해두면 다음부터 편합니다)

```bash
brew install gh
gh auth login                     # GitHub.com → HTTPS → 브라우저 로그인
cd ~/glowbeast-survey
gh repo create glowbeast-survey --public --source=. --remote=origin --push
```

그다음 Pages 켜기:

```bash
gh api -X POST repos/glowbeast/glowbeast-survey/pages \
  -f 'source[branch]=main' -f 'source[path]=/'
```

> `glowbeast` 부분은 실제 깃허브 계정/조직 이름으로 바꾸세요.
> 원본 폼이 `glowbeast.github.io` 에 있으니 같은 계정을 쓰시면 됩니다.

### 방법 B — 깃허브 웹사이트에서 (설치 없이)

1. https://github.com/new 에서 `glowbeast-survey` 저장소를 **Public** 으로 생성 (README 체크 해제).
2. 생성 후 나오는 화면의 `…or push an existing repository` 명령을 복사해서 터미널에 붙여넣기:
   ```bash
   cd ~/glowbeast-survey
   git remote add origin https://github.com/<계정명>/glowbeast-survey.git
   git branch -M main
   git push -u origin main
   ```
3. 저장소 **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `/ (root)` → Save.

### 완료 후

1~2분 뒤 아래 주소가 살아납니다:

**https://glowbeast.github.io/glowbeast-survey/othership/**

인스타 DM, 카톡, 슬랙에 붙이면 링크 미리보기 카드가 뜹니다.

> 미리보기 이미지는 아직 없습니다. 원본 폼처럼 카드 썸네일을 넣으려면
> 1200×630 png 를 저장소 루트에 `og.png` 로 올리면 됩니다.
> `index.html` 의 `og:image` 가 이미 그 경로를 가리키고 있습니다.

---

## 체크리스트

- [ ] Apps Script 배포 완료, `/exec` URL 확보
- [ ] `index.html` 의 `OTHERSHIP_ENDPOINT` 에 URL 붙여넣기
- [ ] 테스트 제출 → 시트에 줄 쌓이는지 확인
- [ ] 깃허브 저장소에 push
- [ ] Pages 켜고 주소 접속 확인
- [ ] (선택) `og.png` 업로드
