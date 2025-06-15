import { db } from '../db/client';

export async function isVerified(phone: string): Promise<boolean> {
  const result = await db.query(
    `SELECT session_id, expires_at FROM pin_session
     WHERE phone_number = $1 AND status = 'active'
     ORDER BY verified_at DESC LIMIT 1`,
    [phone]
  );

  if (result.rowCount === 0) return false;

  const { session_id, expires_at } = result.rows[0];
  const now = Date.now();
  const expired = now > new Date(expires_at).getTime();

  if (expired) {
    await db.query(`
      UPDATE pin_session SET status = 'expired'
      WHERE session_id = $1
    `, [session_id]);
    return false;
  }

  await db.query(`
    UPDATE pin_session
    SET last_activity = NOW()
    WHERE session_id = $1
  `, [session_id]);

  return true;
}

export async function setVerified(phone: string) {
  await db.query(`
    INSERT INTO pin_session (
      phone_number, verified_at, expires_at, last_activity, status, device
    )
    VALUES (
      $1,
      NOW(),
      NOW() + INTERVAL '10 minutes',
      NOW(),
      'active',
      'whatsapp'
    )
  `, [phone]);
}

export async function getActiveSessionId(phone: string): Promise<string | null> {
  const result = await db.query(
    `SELECT session_id FROM pin_session
     WHERE phone_number = $1 AND status = 'active'
     ORDER BY verified_at DESC LIMIT 1`,
    [phone]
  );
  return result.rowCount ? result.rows[0].session_id : null;
}