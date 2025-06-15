import { db } from '../db/client';

export async function logAction({
  phone,
  action,
  targetKey,
  sessionId,
  notes
}: {
  phone: string;
  action: string;
  targetKey?: string;
  sessionId: string | null;
  notes?: string;
}) {
  try {
    await db.query(`
      INSERT INTO audit_log (phone_number, action, target_key, session_id, notes)
      VALUES ($1, $2, $3, $4, $5)
    `, [phone, action, targetKey || null, sessionId || null, notes || null]);
  } catch (err) {
    console.error('🛑 Gagal mencatat audit log:', err);
  }
}
