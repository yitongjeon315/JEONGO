# [중국어 학습 웹앱] DB 설계 (Database Schema Design)

본 문서는 Supabase(PostgreSQL 기반)를 활용하여 백엔드 및 영속성 레이어를 구축하기 위한 데이터베이스 스키마 설계서입니다. 테이블 관계, DDL(SQL) 명세, 그리고 Supabase의 Row Level Security(RLS) 정책을 포함합니다.

---

## 1. 개체 관계도 (ERD - Text Representation)

```
[users] 1  ───  1 [user_stats]
   │
   ├──────────  N [user_vocabulary_progress] ─── N [vocabulary_items]
   │
   ├──────────  N [guild_members] ─── 1 [guilds]
   │
   └──────────  N [chat_history]
```

---

## 2. 테이블 정의서 및 DDL 명세 (PostgreSQL)

### 2.1 사용자 테이블 및 프로필 (`users`, `user_stats`)
Supabase Auth의 `auth.users`와 연계되는 프로필 및 게임 스탯 테이블입니다.

```sql
-- 1. 사용자 통계 및 게임 캐릭터 스탯 테이블
CREATE TABLE public.user_stats (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    nickname VARCHAR(50) UNIQUE NOT NULL,
    avatar_skin_id VARCHAR(100) DEFAULT 'default_explorer',
    level INT DEFAULT 1 NOT NULL,
    xp INT DEFAULT 0 NOT NULL,
    gold INT DEFAULT 500 NOT NULL,
    streak_count INT DEFAULT 0 NOT NULL,
    last_learned_at TIMESTAMP WITH TIME ZONE,
    
    -- RPG 스탯 점수
    stat_str_vocab INT DEFAULT 10 NOT NULL, -- 어휘력 (STR)
    stat_dex_fluency INT DEFAULT 10 NOT NULL, -- 유창성 (DEX)
    stat_int_tone INT DEFAULT 10 NOT NULL,    -- 성조 정확도 (INT)
    stat_vit_attendance INT DEFAULT 10 NOT NULL, -- 출석도 (VIT)
    
    stat_points_available INT DEFAULT 0 NOT NULL, -- 분배 가능한 남은 스탯 포인트
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 2.2 중국어 어휘 및 망각 곡선 데이터베이스 (`vocabulary_items`, `user_vocabulary_progress`)
어휘 학습의 핵심인 Spaced Repetition을 관리하기 위한 테이블입니다.

```sql
-- 2. 단어 데이터베이스 (Master Table)
CREATE TABLE public.vocabulary_items (
    id SERIAL PRIMARY KEY,
    hanzi VARCHAR(100) NOT NULL,         -- 중국어 한자 (예: 苹果)
    pinyin VARCHAR(150) NOT NULL,        -- 한자 병음 (예: píngguǒ)
    meaning TEXT NOT NULL,               -- 한국어 뜻 (예: 사과)
    hsk_level VARCHAR(10) NOT NULL,       -- HSK 등급 (예: HSK1, HSK3)
    part_of_speech VARCHAR(50),          -- 품사 (명사, 동사 등)
    example_sentence TEXT,               -- 예문 한자
    example_pinyin TEXT,                 -- 예문 병음
    example_meaning TEXT,                -- 예문 해석
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 유저별 단어 학습 주기 테이블 (SuperMemo-2 알고리즘 파라미터 적용)
CREATE TABLE public.user_vocabulary_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    vocab_id INT REFERENCES public.vocabulary_items(id) ON DELETE CASCADE NOT NULL,
    
    -- SRS 변수
    easiness_factor REAL DEFAULT 2.5 NOT NULL, -- 쉬움 정도 (E-Factor)
    repetitions INT DEFAULT 0 NOT NULL,        -- 누적 정답 횟수
    interval_days INT DEFAULT 0 NOT NULL,      -- 복습 주기 (일 단위)
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL, -- 다음 복습 시각
    
    last_learned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    is_mastered BOOLEAN DEFAULT FALSE NOT NULL, -- 마스터 여부
    
    UNIQUE(user_id, vocab_id)
);
CREATE INDEX idx_user_vocab_next_review ON public.user_vocabulary_progress(user_id, next_review_at);
```

### 2.3 길드 및 소셜 시스템 테이블 (`guilds`, `guild_members`)
소셜 네트워크 강화와 레이드 퀘스트 관리를 위한 테이블입니다.

```sql
-- 4. 길드 정보 테이블
CREATE TABLE public.guilds (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES auth.users(id) NOT NULL,
    level INT DEFAULT 1 NOT NULL,
    total_xp INT DEFAULT 0 NOT NULL,
    member_count INT DEFAULT 1 NOT NULL,
    max_members INT DEFAULT 20 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 5. 길드 멤버 매핑 테이블
CREATE TABLE public.guild_members (
    id BIGSERIAL PRIMARY KEY,
    guild_id INT REFERENCES public.guilds(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

### 2.4 AI 튜터 세션 로그 테이블 (`chat_history`)
사용자와 AI 튜터 간의 대화 히스토리 및 발음 피드백 로그입니다.

```sql
-- 6. AI 채팅 대화 로그 및 발음 성조 평가 결과
CREATE TABLE public.chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tutor_id VARCHAR(50) NOT NULL,            -- AI 튜터 식별자 (예: wang_teacher, lily)
    sender VARCHAR(10) NOT NULL,              -- 'user' 또는 'ai'
    message_text TEXT NOT NULL,               -- 메시지 본문
    audio_url TEXT,                           -- 음성 녹음 파일 스토리지 경로 (사용자 발화용)
    
    -- 발음 평가 결과 (JSON 구조로 세부 음소 점수 보관)
    pronunciation_score INT,                  -- 0~100 종합 점수
    tone_feedback JSONB,                      -- 성조 피치 데이터 및 오류 단어 리스트
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
CREATE INDEX idx_chat_user_history ON public.chat_history(user_id, created_at DESC);
```

---

## 3. 로우 레벨 보안 정책 (Supabase RLS Rules)

Supabase는 클라이언트에서 테이블에 직접 쿼리를 날릴 수 있으므로, 타인의 정보를 보호하기 위해 철저한 RLS 정의가 수반되어야 합니다.

```sql
-- RLS 활성화 명령
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- 1. user_stats: 본인의 스탯만 조회/수정 가능 (타인은 닉네임, 아바타, 레벨만 조회 가능하도록 제한적 뷰 생성 권장)
CREATE POLICY "Users can view and update their own stats"
ON public.user_stats
FOR ALL
USING (auth.uid() = user_id);

-- 2. user_vocabulary_progress: 타인이 본인의 단어 학습 내역을 볼 수 없음
CREATE POLICY "Users can manage their own vocabulary progress"
ON public.user_vocabulary_progress
FOR ALL
USING (auth.uid() = user_id);

-- 3. chat_history: 본인의 음성 데이터 및 대화 내용만 접근 가능
CREATE POLICY "Users can access their own chat history"
ON public.chat_history
FOR ALL
USING (auth.uid() = user_id);
```
