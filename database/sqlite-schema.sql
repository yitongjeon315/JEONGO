CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL CHECK(length(name) BETWEEN 2 AND 40),
  role TEXT NOT NULL DEFAULT 'learner' CHECK(role IN ('learner', 'admin')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (provider, provider_subject),
  UNIQUE(provider, user_id)
);
CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_id ON oauth_accounts(user_id);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  target_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK(action IN ('member_role_changed', 'member_sessions_revoked')),
  details TEXT NOT NULL CHECK(json_valid(details)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target_user ON admin_audit_logs(target_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS user_snapshots (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data TEXT NOT NULL CHECK(json_valid(data)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS account_balances (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  gold INTEGER NOT NULL DEFAULT 1450 CHECK(gold >= 0),
  xp INTEGER NOT NULL DEFAULT 65 CHECK(xp >= 0),
  level INTEGER NOT NULL DEFAULT 4 CHECK(level >= 1),
  xp_needed INTEGER NOT NULL DEFAULT 150 CHECK(xp_needed >= 1),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS gold_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK(balance_after >= 0),
  reason TEXT NOT NULL,
  reference_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(user_id, reference_key)
);
CREATE INDEX IF NOT EXISTS idx_gold_transactions_user_created ON gold_transactions(user_id, created_at);

CREATE TABLE IF NOT EXISTS processed_learning_events (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK(event_type IN ('lesson', 'pronunciation', 'reward')),
  awarded_gold INTEGER NOT NULL CHECK(awarded_gold >= 0),
  awarded_xp INTEGER NOT NULL CHECK(awarded_xp >= 0),
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (user_id, event_id)
);
CREATE INDEX IF NOT EXISTS idx_learning_events_user_occurred ON processed_learning_events(user_id, occurred_at);

CREATE TABLE IF NOT EXISTS ai_rate_limit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK(scope IN ('tutor', 'translate', 'transcribe')),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limit_user_scope_created
  ON ai_rate_limit_events(user_id, scope, created_at);

CREATE TRIGGER IF NOT EXISTS create_initial_balance AFTER INSERT ON users BEGIN
  INSERT OR IGNORE INTO account_balances(user_id) VALUES (NEW.id);
END;

CREATE TABLE IF NOT EXISTS content_words (
  id INTEGER PRIMARY KEY,
  hanzi TEXT NOT NULL,
  pinyin TEXT NOT NULL DEFAULT '',
  meaning TEXT NOT NULL,
  hsk TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS content_quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  target INTEGER NOT NULL CHECK(target >= 0),
  gold INTEGER NOT NULL CHECK(gold >= 0),
  xp INTEGER NOT NULL CHECK(xp >= 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS content_rewards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK(cost >= 0),
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
INSERT OR IGNORE INTO content_rewards (id, name, image, cost, description) VALUES
  ('starbucks', '스타벅스 아이스 아메리카노 Tall', '☕', 5000, '학습 고행을 식혀줄 현실 커피 쿠폰.'),
  ('naverpay', '네이버페이 포인트 1,000원권', '💳', 1200, '쇼핑에 사용할 수 있는 포인트.'),
  ('gs25', 'GS25 모바일 상품권 3,000원권', '🏪', 3300, '편의점 모바일 상품권.');

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id TEXT NOT NULL,
  reward_name TEXT NOT NULL,
  cost INTEGER NOT NULL CHECK(cost >= 0),
  phone_encrypted BLOB NOT NULL,
  phone_last4 TEXT NOT NULL CHECK(length(phone_last4) = 4),
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'sent', 'cancelled')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE(user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS idx_redemptions_user_created ON reward_redemptions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_redemptions_status_created ON reward_redemptions(status, created_at);

CREATE TABLE IF NOT EXISTS guilds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1 CHECK(level >= 1),
  exp INTEGER NOT NULL DEFAULT 0 CHECK(exp >= 0),
  exp_needed INTEGER NOT NULL DEFAULT 1000 CHECK(exp_needed >= 1),
  boss_hp INTEGER NOT NULL DEFAULT 10000 CHECK(boss_hp >= 0),
  boss_max_hp INTEGER NOT NULL DEFAULT 10000 CHECK(boss_max_hp >= 1),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS guild_members (
  guild_id TEXT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  contribution INTEGER NOT NULL DEFAULT 0 CHECK(contribution >= 0),
  joined_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (guild_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_guild_members_contribution ON guild_members(guild_id, contribution);

INSERT OR IGNORE INTO guilds (id, name, level, exp, exp_needed, boss_hp, boss_max_hp) VALUES
  ('default-guild', '사천 짜장 마법사들', 1, 0, 1000, 10000, 10000),
  ('beijing-readers', '베이징 독서 원정대', 1, 0, 1000, 10000, 10000),
  ('tone-guardians', '성조 수호대', 1, 0, 1000, 10000, 10000);
