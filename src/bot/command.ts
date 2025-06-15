// src/bot/command.ts
import { type Message } from 'whatsapp-web.js';
import { logAction } from '../utils/audit';
import { getActiveSessionId } from '../utils/session';
import { isRateLimited } from '../utils/rateLimit';
import { rateLimits } from '../config/rateLimits';

export type CommandContext = {
  msg: Message;
  args: string[];
  phone: string;
  sessionId: string | null;
};

export type CommandHandler = (ctx: CommandContext) => Promise<void>;

const commands: Record<string, CommandHandler> = {};
const auditExclusion = ['setpin', 'verifikasi'];

export function registerCommand(
  names: string | string[],
  handler: CommandHandler
) {
  const nameList = Array.isArray(names) ? names : [names];
  for (const name of nameList) {
    commands[name] = async (ctx) => {
      const { msg, args, phone, sessionId } = ctx;

      const limit = rateLimits[name];
      if (limit && isRateLimited(phone, name, limit.max, limit.windowMs)) {
        await msg.reply('⏳ Terlalu banyak permintaan. Coba lagi nanti.');
        return;
      }

      try {
        await handler(ctx);

        if (!auditExclusion.includes(name)) {
          await logAction({
            phone,
            action: name,
            targetKey: args[0]?.toLowerCase?.() ?? null,
            sessionId,
            notes: 'berhasil'
          });
        }
      } catch (err) {
        console.error(`❌ Error saat menjalankan perintah "${name}"`, err);

        let errorMessage = 'unknown';
        if (err instanceof Error) {
          errorMessage = err.message;
        }

        if (!auditExclusion.includes(name)) {
          await logAction({
            phone,
            action: name,
            targetKey: args[0]?.toLowerCase?.() ?? null,
            sessionId,
            notes: `gagal: ${errorMessage}`
          });
        }

        await msg.reply('❌ Terjadi kesalahan saat menjalankan perintah.');
      }
    };
  }
}

export async function handleIncomingCommand(msg: Message) {
  const text = msg.body.trim();
  const [commandName, ...args] = text.split(/\s+/);
  const command = commands[commandName.toLowerCase()];
  if (!command) return;

  const phone = msg.from.split('@')[0];
  const sessionId = await getActiveSessionId(phone).catch(() => null);

  await command({ msg, args, phone, sessionId });
}
