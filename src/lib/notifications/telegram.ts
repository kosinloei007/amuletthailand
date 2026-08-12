import "server-only";

export type TelegramSendResult = { ok: true } | { ok: false; error: string };

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<TelegramSendResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) {
      return { ok: false, error: body.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ส่งไม่สำเร็จ" };
  }
}

export async function sendTelegramPhoto(
  botToken: string,
  chatId: string,
  photoUrl: string,
  caption?: string
): Promise<TelegramSendResult> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: "HTML" }),
    });
    const body = await res.json();
    if (!res.ok || !body.ok) {
      return { ok: false, error: body.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ส่งไม่สำเร็จ" };
  }
}
