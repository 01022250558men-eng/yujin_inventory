# 유진코 인터넷쇼핑몰 재고현황 (GitHub + Vercel)

## 폴더 구성

```
index.html        ← 바로 열어볼 수 있는 완성본 (데이터 내장, 2,070건)
template.html     ← 데이터 자리(__DATA__)만 비어 있는 화면 원본
data/inventory.xlsx ← 재고 엑셀 (여기만 갈아끼우면 됨)
tools/build.mjs   ← 엑셀 → dist/index.html 생성 스크립트
vercel.json       ← Vercel 빌드 설정
package.json
```

## 왜 index.html 과 template.html 이 둘 다 있나

- **index.html** : 지금 당장 열어볼 수 있는 결과물. 이대로 올리면 Vercel·Pages 모두 바로 뜹니다.
- **template.html + data + build.mjs** : 엑셀만 바꿔 올리면 자동으로 새 index.html 이 만들어지는 경로.

둘 중 하나만 쓰셔도 됩니다.

### 방법 1 — 단순 (빌드 없음)
Vercel 프로젝트 설정에서 Framework Preset = **Other**, Build Command = **비움**,
Output Directory = **비움** 으로 두면 `index.html` 을 그대로 서빙합니다.
재고가 바뀌면 `index.html` 을 새로 만들어 다시 올려야 합니다.

### 방법 2 — 엑셀만 교체 (자동 빌드)
`vercel.json` 이 아래를 자동 실행합니다.
```
node tools/build.mjs   →  dist/index.html
```
매일 `data/inventory.xlsx` 만 새 파일로 바꿔 올리면 재배포됩니다.
Framework Preset 은 **Other**, 나머지는 `vercel.json` 값이 우선합니다.

## 로컬에서 빌드 확인

```bash
npm install
npm run build
# dist/index.html 확인
```

## 주의

- 이 페이지는 **읽기 전용**입니다. 관리자 업로드 기능은 서버(Worker)가 있어야 동작합니다.
- 저장소가 **공개(Public)** 면 2,070개 품목·단가·재고금액이 모두에게 보입니다. Private 권장.
- Vercel Hobby 요금제는 **개인 계정의 private 저장소**는 배포되지만,
  **조직(Organization) 소유 private 저장소**는 Pro 가 필요합니다.
