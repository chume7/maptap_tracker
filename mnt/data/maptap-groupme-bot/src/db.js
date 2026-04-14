const Database = require('better-sqlite3');
const config = require('./config');

const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id TEXT NOT NULL,
    message_id TEXT NOT NULL UNIQUE,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    game_date_text TEXT NOT NULL,
    round1 INTEGER NOT NULL,
    round2 INTEGER NOT NULL,
    round3 INTEGER NOT NULL,
    round4 INTEGER NOT NULL,
    round5 INTEGER NOT NULL,
    final_score INTEGER NOT NULL,
    created_at_groupme INTEGER,
    ingested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    raw_text TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS job_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_name TEXT NOT NULL,
    run_date_local TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_name, run_date_local)
  );
`);

const insertSubmissionStmt = db.prepare(`
  INSERT INTO submissions (
    group_id,
    message_id,
    user_id,
    user_name,
    game_date_text,
    round1,
    round2,
    round3,
    round4,
    round5,
    final_score,
    created_at_groupme,
    raw_text
  ) VALUES (
    @groupId,
    @messageId,
    @userId,
    @userName,
    @gameDateText,
    @round1,
    @round2,
    @round3,
    @round4,
    @round5,
    @finalScore,
    @createdAtGroupme,
    @rawText
  )
`);

const getLeaderboardStmt = db.prepare(`
  SELECT
    user_id AS userId,
    MAX(user_name) AS userName,
    COUNT(*) AS gamesPlayed,
    ROUND(AVG(final_score), 1) AS averageFinalScore,
    MAX(final_score) AS bestScore
  FROM submissions
  GROUP BY user_id
  HAVING COUNT(*) > 0
  ORDER BY averageFinalScore DESC, gamesPlayed DESC, userName ASC
`);

const countSubmissionsStmt = db.prepare(`SELECT COUNT(*) AS count FROM submissions`);
const countUsersStmt = db.prepare(`SELECT COUNT(DISTINCT user_id) AS count FROM submissions`);
const recordJobRunStmt = db.prepare(`INSERT INTO job_runs (job_name, run_date_local) VALUES (?, ?)`);
const hasJobRunStmt = db.prepare(`SELECT 1 FROM job_runs WHERE job_name = ? AND run_date_local = ? LIMIT 1`);

function insertSubmission(payload) {
  try {
    insertSubmissionStmt.run(payload);
    return { inserted: true };
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: submissions.message_id')) {
      return { inserted: false, reason: 'duplicate_message_id' };
    }
    throw error;
  }
}

function getLeaderboard() {
  return getLeaderboardStmt.all();
}

function getStats() {
  return {
    submissions: countSubmissionsStmt.get().count,
    users: countUsersStmt.get().count
  };
}

function hasJobRun(jobName, runDateLocal) {
  return Boolean(hasJobRunStmt.get(jobName, runDateLocal));
}

function recordJobRun(jobName, runDateLocal) {
  try {
    recordJobRunStmt.run(jobName, runDateLocal);
    return true;
  } catch (error) {
    if (String(error.message).includes('UNIQUE constraint failed: job_runs.job_name, job_runs.run_date_local')) {
      return false;
    }
    throw error;
  }
}

module.exports = {
  db,
  insertSubmission,
  getLeaderboard,
  getStats,
  hasJobRun,
  recordJobRun
};
