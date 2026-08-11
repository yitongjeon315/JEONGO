const APP_TITLE = 'TOPIK 실시간 번역 수업방';
const ROOM_TTL_MS = 8 * 60 * 60 * 1000;
const MAX_SOURCE_LENGTH = 600;
const TARGET_LANGUAGES = Object.freeze({
  en: 'English',
  'zh-CN': '简体中文',
  vi: 'Tiếng Việt',
  ne: 'नेपाली'
});

function doGet(e) {
  const params = (e && e.parameter) || {};
  const view = params.view === 'student' ? 'student' : 'teacher';
  const room = sanitizeRoomId_(params.room || '');
  const template = HtmlService.createTemplateFromFile('Index');

  template.bootData = JSON.stringify({
    view: view,
    room: room,
    appUrl: ScriptApp.getService().getUrl() || '',
    languages: TARGET_LANGUAGES
  });

  return template
    .evaluate()
    .setTitle(APP_TITLE)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSetupState() {
  return {
    configured: Boolean(PropertiesService.getScriptProperties().getProperty('TEACHER_PIN_HASH')),
    languages: TARGET_LANGUAGES
  };
}

function initializeTeacherPin(pin) {
  const cleanPin = normalizePin_(pin);
  if (cleanPin.length < 4) {
    throw new Error('교사 비밀번호는 4자 이상으로 입력하세요.');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const properties = PropertiesService.getScriptProperties();
    if (properties.getProperty('TEACHER_PIN_HASH')) {
      throw new Error('교사 비밀번호가 이미 설정되어 있습니다.');
    }
    properties.setProperty('TEACHER_PIN_HASH', hash_(cleanPin));
  } finally {
    lock.releaseLock();
  }

  return { ok: true };
}

function createRoom(pin) {
  verifyTeacherPin_(pin);
  cleanupExpiredRooms_();

  const roomId = createRoomId_();
  const writeKey = Utilities.getUuid().replace(/-/g, '');
  const now = Date.now();
  const room = {
    id: roomId,
    writeKeyHash: hash_(writeKey),
    source: '',
    translations: { en: '', 'zh-CN': '', vi: '', ne: '' },
    version: 0,
    updatedAt: now,
    expiresAt: now + ROOM_TTL_MS
  };

  PropertiesService.getScriptProperties().setProperty(roomKey_(roomId), JSON.stringify(room));

  return {
    roomId: roomId,
    writeKey: writeKey,
    studentUrl: buildStudentUrl_(roomId),
    expiresAt: room.expiresAt
  };
}

function publishText(roomId, writeKey, sourceText) {
  const cleanRoomId = sanitizeRoomId_(roomId);
  const source = String(sourceText || '').trim();

  if (!cleanRoomId) throw new Error('수업방 번호가 올바르지 않습니다.');
  if (!source) throw new Error('번역할 한국어 문장을 입력하세요.');
  if (source.length > MAX_SOURCE_LENGTH) {
    throw new Error('한 번에 600자까지 번역할 수 있습니다.');
  }

  const properties = PropertiesService.getScriptProperties();
  const raw = properties.getProperty(roomKey_(cleanRoomId));
  if (!raw) throw new Error('수업방을 찾을 수 없습니다. 새 수업방을 만들어 주세요.');

  const room = JSON.parse(raw);
  if (room.expiresAt < Date.now()) {
    properties.deleteProperty(roomKey_(cleanRoomId));
    throw new Error('수업방 사용 시간이 끝났습니다. 새 수업방을 만들어 주세요.');
  }
  if (room.writeKeyHash !== hash_(String(writeKey || ''))) {
    throw new Error('교사 쓰기 권한이 올바르지 않습니다.');
  }

  if (room.source === source && room.translations) {
    return publicRoom_(room);
  }

  const translations = translateAll_(source);
  room.source = source;
  room.translations = translations;
  room.version = Number(room.version || 0) + 1;
  room.updatedAt = Date.now();
  room.expiresAt = room.updatedAt + ROOM_TTL_MS;

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    properties.setProperty(roomKey_(cleanRoomId), JSON.stringify(room));
  } finally {
    lock.releaseLock();
  }

  return publicRoom_(room);
}

function getRoom(roomId) {
  const cleanRoomId = sanitizeRoomId_(roomId);
  if (!cleanRoomId) return { found: false, message: '수업방 번호를 확인하세요.' };

  const properties = PropertiesService.getScriptProperties();
  const raw = properties.getProperty(roomKey_(cleanRoomId));
  if (!raw) return { found: false, message: '수업방을 찾을 수 없습니다.' };

  const room = JSON.parse(raw);
  if (room.expiresAt < Date.now()) {
    properties.deleteProperty(roomKey_(cleanRoomId));
    return { found: false, message: '수업이 종료되었습니다.' };
  }

  return Object.assign({ found: true }, publicRoom_(room));
}

function closeRoom(roomId, writeKey) {
  const cleanRoomId = sanitizeRoomId_(roomId);
  const properties = PropertiesService.getScriptProperties();
  const raw = properties.getProperty(roomKey_(cleanRoomId));
  if (!raw) return { ok: true };

  const room = JSON.parse(raw);
  if (room.writeKeyHash !== hash_(String(writeKey || ''))) {
    throw new Error('교사 쓰기 권한이 올바르지 않습니다.');
  }
  properties.deleteProperty(roomKey_(cleanRoomId));
  return { ok: true };
}

function translateAll_(source) {
  const cache = CacheService.getScriptCache();
  const cacheKey = 'translation:' + hash_(source).slice(0, 40);
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = {};
  Object.keys(TARGET_LANGUAGES).forEach(function(languageCode) {
    result[languageCode] = LanguageApp.translate(source, 'ko', languageCode);
  });

  cache.put(cacheKey, JSON.stringify(result), 21600);
  return result;
}

function publicRoom_(room) {
  return {
    roomId: room.id,
    source: room.source || '',
    translations: room.translations || {},
    version: Number(room.version || 0),
    updatedAt: room.updatedAt,
    expiresAt: room.expiresAt
  };
}

function buildStudentUrl_(roomId) {
  const base = ScriptApp.getService().getUrl() || '';
  return base + '?view=student&room=' + encodeURIComponent(roomId);
}

function verifyTeacherPin_(pin) {
  const expected = PropertiesService.getScriptProperties().getProperty('TEACHER_PIN_HASH');
  if (!expected) throw new Error('먼저 교사 비밀번호를 설정하세요.');
  if (hash_(normalizePin_(pin)) !== expected) throw new Error('교사 비밀번호가 맞지 않습니다.');
}

function normalizePin_(pin) {
  return String(pin || '').trim();
}

function sanitizeRoomId_(roomId) {
  const clean = String(roomId || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  return clean.length === 6 ? clean : '';
}

function createRoomId_() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const properties = PropertiesService.getScriptProperties();
  for (let attempt = 0; attempt < 12; attempt += 1) {
    let id = '';
    for (let i = 0; i < 6; i += 1) {
      id += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    if (!properties.getProperty(roomKey_(id))) return id;
  }
  throw new Error('수업방 번호를 만들지 못했습니다. 다시 시도하세요.');
}

function cleanupExpiredRooms_() {
  const properties = PropertiesService.getScriptProperties();
  const all = properties.getProperties();
  const now = Date.now();
  Object.keys(all).forEach(function(key) {
    if (key.indexOf('ROOM_') !== 0) return;
    try {
      const room = JSON.parse(all[key]);
      if (!room.expiresAt || room.expiresAt < now) properties.deleteProperty(key);
    } catch (error) {
      properties.deleteProperty(key);
    }
  });
}

function roomKey_(roomId) {
  return 'ROOM_' + roomId;
}

function hash_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ''),
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(bytes);
}
