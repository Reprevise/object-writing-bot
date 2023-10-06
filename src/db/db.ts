import Database from "bun:sqlite";
import { GuildOptions, guildOptionsSchema } from "../types/guild-options";
import { Word, wordSchema } from "../types/word";
import dayjs from "dayjs";

const db = new Database("object-writer.sqlite", { create: true });

db.run<never>(`CREATE TABLE IF NOT EXISTS 'words' (
  'word' TEXT PRIMARY KEY NOT NULL
);`);

db.run<never>(`CREATE TABLE IF NOT EXISTS 'servers' (
	'id' TEXT PRIMARY KEY UNIQUE NOT NULL,
  'channelId' TEXT,
  'lastManualRoll' INTEGER
);`);

export async function initializeWordList() {
  const wordsFile = Bun.file("./wordlist.txt");
  const rawWords = await wordsFile.text();
  const wordsList = rawWords
    .trim()
    .split("\n")
    .map((w) => `('${w}')`);

  db.run<never>(`INSERT OR IGNORE INTO 'words' VALUES ${wordsList.join(", ")}`);
}

export function dbUpdateWordLastUsed(guildId: string, word: string): void {
  db.run<[string, number]>(
    `INSERT INTO '${guildId}-words' (word, lastUsed) VALUES (?1, ?2) ON CONFLICT DO UPDATE SET 'lastUsed' = ?2 WHERE word = ?1`,
    [word, dayjs.utc().valueOf()]
  );
}

export function dbGetRandomWord(guildId: string): Word {
  const query = db.prepare<Record<string, unknown>, []>(`
WITH Combined AS (
  SELECT word, NULL AS lastUsed FROM words

  UNION ALL

  SELECT word, lastUsed FROM '${guildId}-words'
)

SELECT word, lastUsed FROM Combined
ORDER BY
  CASE WHEN lastUsed IS NULL THEN 0 ELSE 1 END,
  lastUsed ASC,
  RANDOM()
LIMIT 1;
`);

  const response = query.get();

  return wordSchema.parse(response);
}

const inGlobalWordlistQuery = db.prepare<Record<string, unknown>, string>(
  "SELECT word FROM 'words' WHERE word = ?;"
);
export function dbAddWord(guildId: string, word: string): boolean {
  if (inGlobalWordlistQuery.get(word)) return false;

  const query = db.prepare<Record<string, unknown>, string>(
    `INSERT OR IGNORE INTO '${guildId}-words' ('word') VALUES (?) RETURNING word;`
  );

  const result = query.get(word);
  if (!result) return false;

  return result.word == word;
}

export function dbDeleteWord(guildId: string, word: string): boolean {
  const query = db.prepare<Record<string, unknown>, string>(
    `DELETE FROM '${guildId}-words' WHERE word = ? RETURNING word;`
  );

  const result = query.get(word);
  if (!result) return false;

  return result.word == word;
}

const guildsQuery = db.prepare<Record<string, unknown>, []>(
  "SELECT id, channelId FROM 'servers';"
);
export function dbGetGuilds(): GuildOptions[] {
  const response = guildsQuery.all();

  return response.map<GuildOptions>((e) => guildOptionsSchema.parse(e));
}

const addGuildQuery = db.prepare<void, string>(
  "INSERT OR IGNORE INTO 'servers' ('id') VALUES (?);"
);
export function dbAddGuild(id: string): void {
  addGuildQuery.run(id);
  db.run<never>(`CREATE TABLE IF NOT EXISTS '${id}-words' (
    'word' TEXT PRIMARY KEY NOT NULL,
    'lastUsed' INTEGER
  );`);
}

const deleteGuildQuery = db.prepare<void, string>(
  "DELETE FROM 'servers' WHERE id = ?;"
);
export function dbRemoveGuild(id: string): void {
  deleteGuildQuery.run(id);
  db.run<[string]>("DROP TABLE ?'-words'", [id]);
}

const editWritingChannelQuery = db.prepare<void, [string, string]>(
  "UPDATE 'servers' SET channelId = ?2 WHERE id = ?1;"
);
export function dbAddOrUpdateWritingChannel(
  guildId: string,
  channelId: string
): void {
  editWritingChannelQuery.run(guildId, channelId);
}

const guildQuery = db.prepare<Record<string, unknown>, string>(
  "SELECT * FROM 'servers' WHERE id = ? LIMIT 1;"
);
export function dbGetGuild(id: string): GuildOptions | null {
  const response = guildQuery.get(id);

  if (!response) return null;

  return guildOptionsSchema.parse(response);
}

const setManualRollTimeQuery = db.prepare<never, [string, number]>(
  "UPDATE 'servers' SET lastManualRoll = ?2 WHERE id = ?1"
);
export function dbSetManualRollTime(guildId: string) {
  setManualRollTimeQuery.run(guildId, dayjs.utc().valueOf());
}
