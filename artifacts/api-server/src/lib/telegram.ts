import axios from "axios";

const BOT_TOKEN = process.env["TELEGRAM_BOT_TOKEN"] || "";
const CHAT_ID = process.env["TELEGRAM_CHAT_ID"] || "";

export async function sendTelegramMessage(message: string): Promise<void> {
  if (!BOT_TOKEN || !CHAT_ID) return;
  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML",
    });
  } catch {
    // Silently fail if Telegram is not configured
  }
}
