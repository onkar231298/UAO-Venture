import { pool } from "./db";

type LockClient = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: any[] }>;
  release: () => void;
};

type LockPool = {
  connect: () => Promise<LockClient>;
};

export type BulkEmailRequestLock = {
  assertHeld: () => Promise<void>;
  release: () => Promise<void>;
};

export async function acquireBulkEmailRequestLock(
  userId: string,
  idempotencyKey: string,
  lockPool: LockPool = pool as unknown as LockPool,
): Promise<BulkEmailRequestLock | null> {
  const client = await lockPool.connect();
  let held = false;
  try {
    const result = await client.query(
      "SELECT pg_try_advisory_lock(hashtext($1), hashtext($2)) AS acquired",
      [userId, idempotencyKey],
    );
    held = result.rows[0]?.acquired === true;
    if (!held) {
      client.release();
      return null;
    }

    let released = false;
    return {
      assertHeld: async () => {
        if (released) throw new Error("Bulk email request lock is no longer held.");
        await client.query("SELECT 1");
      },
      release: async () => {
        if (released) return;
        released = true;
        try {
          await client.query(
            "SELECT pg_advisory_unlock(hashtext($1), hashtext($2))",
            [userId, idempotencyKey],
          );
        } finally {
          client.release();
        }
      },
    };
  } catch (error) {
    if (!held) client.release();
    throw error;
  }
}