import 'server-only';

import type { RowDataPacket } from 'mysql2';
import type { ContentCatalog, ContentQuest, ContentReward, VocabItem } from '@/lib/content-catalog';
import { getDb } from './db';

interface WordRow extends RowDataPacket {
  id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  hsk: string;
}

interface QuestRow extends RowDataPacket, ContentQuest {}
interface RewardRow extends RowDataPacket, ContentReward {}

export async function getContentCatalog(): Promise<ContentCatalog> {
  const db = getDb();
  const [wordRows, questRows, rewardRows] = await Promise.all([
    db.execute<WordRow[]>('SELECT id, hanzi, pinyin, meaning, hsk FROM content_words ORDER BY created_at, id'),
    db.execute<QuestRow[]>('SELECT id, title, description AS `desc`, target, gold, xp FROM content_quests ORDER BY created_at, id'),
    db.execute<RewardRow[]>('SELECT id, name, image, cost, description AS `desc` FROM content_rewards ORDER BY created_at, id'),
  ]);
  const now = new Date().toISOString();
  const words: VocabItem[] = wordRows[0].map((word) => ({
    ...word,
    id: Number(word.id),
    isLearned: false,
    easiness: 2.5,
    repetitions: 0,
    intervalDays: 0,
    nextReviewAt: now,
  }));
  return { words, quests: questRows[0], rewards: rewardRows[0] };
}

export async function replaceContentCatalog(catalog: ContentCatalog) {
  const connection = await getDb().getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM content_words');
    await connection.execute('DELETE FROM content_quests');
    await connection.execute('DELETE FROM content_rewards');

    if (catalog.words.length > 0) {
      const placeholders = catalog.words.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const values = catalog.words.flatMap((word) => [word.id, word.hanzi, word.pinyin, word.meaning, word.hsk]);
      await connection.execute(
        `INSERT INTO content_words (id, hanzi, pinyin, meaning, hsk) VALUES ${placeholders}`,
        values,
      );
    }
    if (catalog.quests.length > 0) {
      const placeholders = catalog.quests.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
      const values = catalog.quests.flatMap((quest) => [quest.id, quest.title, quest.desc, quest.target, quest.gold, quest.xp]);
      await connection.execute(
        `INSERT INTO content_quests (id, title, description, target, gold, xp) VALUES ${placeholders}`,
        values,
      );
    }
    if (catalog.rewards.length > 0) {
      const placeholders = catalog.rewards.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const values = catalog.rewards.flatMap((reward) => [reward.id, reward.name, reward.image, reward.cost, reward.desc]);
      await connection.execute(
        `INSERT INTO content_rewards (id, name, image, cost, description) VALUES ${placeholders}`,
        values,
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
