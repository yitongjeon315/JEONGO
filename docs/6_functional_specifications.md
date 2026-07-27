# [중국어 학습 웹앱] 기능 명세서 (Functional Specifications)

본 문서는 서비스의 핵심 비즈니스 로직과 API 연동 사양, 예외 처리 설계 등을 상세히 기술하는 기능 명세서입니다.

---

## 1. AI 발음 및 성조 분석 기능 명세

사용자가 화면의 마이크 버튼을 누르고 음성을 발화했을 때, 백엔드 및 서드파티 엔진을 거쳐 최종 발음 점수와 성조 그래프를 그리기까지의 비즈니스 로직입니다.

### 1.1 입출력 사양 (API Specs)
*   **API 엔드포인트**: Supabase Edge Function `/functions/v1/analyze-pronunciation`
*   **요청 객체 (Request)**:
    ```json
    {
      "user_id": "UUID",
      "target_pinyin": "wǒ chī le hànbǎobāo",
      "target_hanzi": "我吃了汉堡包",
      "audio_base64": "UklGRiQAAABXQVZFZm10I..."
    }
    ```
*   **응답 객체 (Response)**:
    ```json
    {
      "pronunciation_score": 85,
      "fluency_score": 90,
      "words": [
        {
          "word": "我",
          "pinyin": "wǒ",
          "accuracy_score": 95,
          "error_type": "None"
        },
        {
          "word": "汉",
          "pinyin": "hàn",
          "accuracy_score": 45,
          "error_type": "Mispronunciation (Tone Error)"
        }
      ],
      "user_pitch_curve": [120, 115, 110, 220, 190, 180],
      "native_pitch_curve": [125, 115, 105, 250, 210, 180]
    }
    ```

### 1.2 처리 알고리즘 및 엔진 구성
1.  **동작 순서**:
    *   웹 프론트엔드에서 MediaRecorder API를 사용하여 `audio/webm;codecs=opus` 형태로 사용자 발화 녹음.
    *   WAV 포맷으로 변환 후 Base64로 인코딩하여 Supabase Edge Function 호출.
    *   Edge Function에서 Azure Speech SDK(발음 평가 모듈)로 데이터 포워딩.
    *   음소 수준(Phoneme-level)의 정확성 점수(Accuracy), 유창성 점수(Fluency) 및 단어별 성조 오류 패턴을 파싱하여 클라이언트에 전달.
2.  **스탯 반영**: 종합 점수가 80점 이상일 경우 캐릭터의 `stat_int_tone` 및 `stat_dex_fluency` 능력치를 점수에 비례하여 동적으로 가산.

---

## 2. OpenAI API 기반 AI 대화 명세

상황별 시나리오를 바탕으로 사용자와 핑퐁 대화를 이어나가고, 피드백을 축적하는 튜터 엔진입니다.

### 2.1 프롬프트 엔지니어링 템플릿
Edge Function에서 OpenAI GPT-4o API를 호출할 때 주입하는 시스템 프롬프트(System Prompt) 구조입니다.

```markdown
Role: 너는 중국어 회화 앱의 [TUTOR_NAME] 튜터이다. 캐릭터 성격은 [TUTOR_PERSONALITY]이다.
Context: 현재 시나리오는 [SCENARIO_NAME]이다.
Rules:
1. 학습자의 레벨([USER_LEVEL])에 맞는 어휘와 문장 길이만 사용하라.
2. 학습자가 발화하면, 친절히 답변한 뒤 관련된 추가 질문을 반드시 던져 핑퐁을 유지하라.
3. 한 번에 최대 2문장 이내의 보통화(Mandarin) 중국어로 답할 것이며, 대괄호[] 안에 한국어 번역을 동봉하라.
```

### 2.2 대화 컨텍스트 누적
*   메시지 전송 시 직전 6회의 대화 히스토리(`chat_history` 테이블 조회)만 Context Window에 누적하여 전송함으로써 OpenAI API 토큰 소모 비용을 최적화하고 지연 시간(Latency)을 단축합니다.

---

## 3. 망각 곡선 어휘 복습 엔진 (SuperMemo-2 SM2)

사용자별 최적의 복습 타이밍을 제공하기 위한 계산 로직입니다.

### 3.1 변수 및 계산식
학습자가 퀴즈를 풀 때 1점(전혀 기억 안 남) ~ 5점(아주 쉽게 맞춤)의 점수(`Quality, q`)를 매기고 다음 복습 일수(`I`)를 업데이트합니다.

1.  **정답 여부에 따른 반복 횟수(`n`) 계산**:
    *   성공(`q >= 3`): `n = n + 1`
    *   실패(`q < 3`): `n = 0` (처음부터 다시 시작)
2.  **복습 주기(`Interval, I`) 계산**:
    *   `n = 1` 인 경우: `I = 1` (1일 뒤 복습)
    *   `n = 2` 인 경우: `I = 6` (6일 뒤 복습)
    *   `n > 2` 인 경우: `I(n) = I(n-1) * EF` (이전 주기 * 쉬움 계수)
3.  **쉬움 계수(`Easiness Factor, EF`) 수정**:
    *   `EF = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`
    *   *최솟값 제한*: `EF`가 1.3 미만으로 떨어지면 1.3으로 강제 고정.

---

## 4. 예외 처리 및 에러 핸들링 설계

### 4.1 오프라인 모드 대응 (PWA / Local Cache)
*   **문제 상황**: 사용자가 지하철 등 네트워크 음영 지역에서 학습을 수행할 때 API 요청 실패 가능성.
*   **해결책**:
    *   학습을 시작할 때 당일 복습 큐(`vocabulary_items`)를 IndexedDB 또는 `localStorage`에 JSON 포맷으로 미리 다운로드하여 캐싱합니다.
    *   오프라인 상태에서 완료된 퀴즈 점수 및 획득 XP/골드는 로컬 스토리지에 `offline_learning_logs` 배열로 누적 저장합니다.
    *   네트워크 연결이 복구되는 즉시(Window `online` 이벤트 감지), 서비스 워커(Service Worker)가 백그라운드 동기화를 실행하여 Supabase DB에 일괄 반영(Bulk Upsert)합니다.

### 4.2 음성 인식 불가 및 무음 유입 대책
*   **문제 상황**: 시끄러운 실외에서 발음 테스트를 진행하여 배경 소음이 유입되거나 사용자가 말을 전혀 하지 않는 경우.
*   **해결책**:
    *   음성 녹음 데시벨(Decibel) 레벨을 검사하여 최소 임계치(-40dB) 이하로 3초간 지속될 경우 "주변이 너무 조용하거나 마이크가 꺼져 있습니다. 마이크 볼륨을 확인해 주세요" 팝업 노출.
    *   음성 전송 후 인식된 텍스트 신뢰도(STT Confidence Score)가 30% 미만인 경우, 무리하게 발음 점수를 산정하지 않고 "잡음이 심해 발음을 정확히 인식하지 못했습니다. 조용한 곳에서 다시 시도해 주세요"라는 친절한 가이드 제공 후 스탯 하락이나 스트릭 패널티 없이 재녹음 유도.
