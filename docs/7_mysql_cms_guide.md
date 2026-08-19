# MySQL 공용 콘텐츠 CMS 안내

## 무엇이 달라졌나요?

예전에는 관리자가 추가한 단어·퀘스트·보상이 관리자의 브라우저 `localStorage`에만 저장됐습니다. 이제는 다음 순서로 동작합니다.

1. 앱이 열리면 누구나 `GET /api/content`로 공용 콘텐츠를 읽습니다.
2. 관리자가 CMS에서 저장을 누르면 브라우저가 `PUT /api/content`로 목록을 보냅니다.
3. 서버가 로그인 세션을 확인하고, MySQL의 `users.role`이 `admin`인지 다시 확인합니다.
4. 서버가 글자 수, 숫자 범위, 중복 ID와 HSK 등급을 검사합니다.
5. 검사를 통과한 목록만 하나의 MySQL 트랜잭션으로 저장합니다.
6. 저장 도중 하나라도 실패하면 전체 작업을 취소하므로 일부만 저장되는 상태가 생기지 않습니다.

화면에서 관리자처럼 보이게 값을 조작해도 3번의 서버 권한 검사를 통과할 수 없습니다.

## 처음 한 번 설정하기

### 1. MySQL 연결 정보 만들기

프로젝트 루트에 `.env.local` 파일을 만들고 실제 MySQL 정보로 채웁니다.

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=jeongo
DB_PASSWORD=실제비밀번호
DB_NAME=jeongo
```

### 2. 테이블 만들기

PowerShell에서 프로젝트 폴더로 이동한 뒤 실행합니다.

```powershell
npm run db:init
```

이 명령은 기존 사용자·세션 테이블을 보존하면서 `content_words`, `content_quests`, `content_rewards`를 추가합니다.

### 3. 관리자 계정 지정하기

앱 회원가입으로 계정을 하나 만든 다음 MySQL에서 해당 이메일의 역할을 변경합니다.

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

역할을 바꾼 뒤에는 로그아웃하고 다시 로그인해야 화면에 관리자 권한이 반영됩니다.

## 초보자용 수동 테스트

1. `npm run dev`로 앱을 실행합니다.
2. 관리자 계정으로 로그인하고 `/admin/content`로 이동합니다.
3. 단어 탭에서 `测试 / cèshì / 테스트 / HSK 2`를 입력하고 저장합니다.
4. “모든 사용자에게 공용으로 반영되었습니다” 메시지가 나오는지 확인합니다.
5. 시크릿 창을 열어 로그인하지 않은 상태로 `/vocab-book`에 들어갑니다.
6. `测试`를 검색해 같은 단어가 보이는지 확인합니다.
7. 다시 관리자 CMS에서 단어를 삭제합니다.
8. 시크릿 창을 새로고침하고 단어가 사라졌는지 확인합니다.
9. 일반 학습자 계정으로 `/admin/content`에 접근해 저장 화면이 표시되지 않는지 확인합니다.

## 자동 테스트

```powershell
npm test
npm run lint
npm run build
npm run test:e2e
```

- `npm test`: 입력값 검증과 비로그인·일반 사용자·관리자 권한을 검사합니다.
- `npm run lint`: 코드 규칙 위반을 검사합니다.
- `npm run build`: TypeScript 오류와 실제 배포 빌드를 검사합니다.
- `npm run test:e2e`: 브라우저에서 주요 화면과 기존 학습 흐름이 깨지지 않았는지 검사합니다.

자동 테스트는 MySQL 드라이버 자체를 흉내 내어 권한과 API 로직을 빠르게 검사합니다. 실제 MySQL 저장 여부는 위의 수동 테스트로 최종 확인합니다.

## AI 튜터와 현실 보상 환경 변수

다음 값은 서버 전용 `.env.local`에 설정합니다. 브라우저에 노출되는 `NEXT_PUBLIC_` 변수로 만들면 안 됩니다.

```dotenv
# AI 자유 대화, 음성 전사, 누락 어휘 번역
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6-luna
OPENAI_TRANSCRIBE_MODEL=gpt-transcribe

# 환전 전화번호 AES 암호화용 24자 이상의 임의 비밀값
REDEMPTION_ENCRYPTION_KEY=
```

`OPENAI_API_KEY`가 없으면 AI 튜터는 작성된 시나리오 대체 응답과 브라우저 음성 인식을 사용합니다. `REDEMPTION_ENCRYPTION_KEY`가 없으면 개인정보가 평문 저장되지 않도록 현실 보상 신청 API가 요청을 거부합니다.
