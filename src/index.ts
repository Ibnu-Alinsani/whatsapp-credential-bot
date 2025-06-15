import 'dotenv/config';
import { startBot } from './bot/whatsapp';

startBot();
console.log('🔧 DATABASE_URL:', process.env.DATABASE_URL);