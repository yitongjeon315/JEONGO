CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(40) NOT NULL,
  role ENUM('learner', 'admin') NOT NULL DEFAULT 'learner',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME(3) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_user_id (user_id),
  INDEX idx_sessions_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_snapshots (
  user_id CHAR(36) PRIMARY KEY,
  data JSON NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_snapshots_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_words (
  id BIGINT UNSIGNED PRIMARY KEY,
  hanzi VARCHAR(64) NOT NULL,
  pinyin VARCHAR(128) NOT NULL DEFAULT '',
  meaning VARCHAR(500) NOT NULL,
  hsk VARCHAR(10) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_quests (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  target INT UNSIGNED NOT NULL,
  gold INT UNSIGNED NOT NULL,
  xp INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_rewards (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  image VARCHAR(255) NOT NULL,
  cost INT UNSIGNED NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO content_rewards (id, name, image, cost, description) VALUES
  ('starbucks', '스타벅스 아이스 아메리카노 Tall', '☕', 5000, '학습 고행을 식혀줄 현실 커피 쿠폰.'),
  ('naverpay', '네이버페이 포인트 1,000원권', '💳', 1200, '쇼핑에 사용할 수 있는 포인트.'),
  ('gs25', 'GS25 모바일 상품권 3,000원권', '🏪', 3300, '편의점 모바일 상품권.');

CREATE TABLE IF NOT EXISTS reward_redemptions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  reward_id VARCHAR(100) NOT NULL,
  reward_name VARCHAR(120) NOT NULL,
  cost INT UNSIGNED NOT NULL,
  phone_encrypted VARBINARY(512) NOT NULL,
  phone_last4 CHAR(4) NOT NULL,
  idempotency_key VARCHAR(100) NOT NULL,
  status ENUM('pending', 'approved', 'sent', 'cancelled') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_redemptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_redemptions_user_request (user_id, idempotency_key),
  INDEX idx_redemptions_user_created (user_id, created_at),
  INDEX idx_redemptions_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guilds (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  level INT UNSIGNED NOT NULL DEFAULT 1,
  exp INT UNSIGNED NOT NULL DEFAULT 0,
  exp_needed INT UNSIGNED NOT NULL DEFAULT 1000,
  boss_hp INT UNSIGNED NOT NULL DEFAULT 10000,
  boss_max_hp INT UNSIGNED NOT NULL DEFAULT 10000,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS guild_members (
  guild_id VARCHAR(100) NOT NULL,
  user_id CHAR(36) NOT NULL,
  contribution INT UNSIGNED NOT NULL DEFAULT 0,
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (guild_id, user_id),
  CONSTRAINT fk_guild_members_guild FOREIGN KEY (guild_id) REFERENCES guilds(id) ON DELETE CASCADE,
  CONSTRAINT fk_guild_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_guild_members_contribution (guild_id, contribution)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO guilds (id, name, level, exp, exp_needed, boss_hp, boss_max_hp)
VALUES
  ('default-guild', '사천 짜장 마법사들', 1, 0, 1000, 10000, 10000),
  ('beijing-readers', '베이징 독서 원정대', 1, 0, 1000, 10000, 10000),
  ('tone-guardians', '성조 수호대', 1, 0, 1000, 10000, 10000);
