import "server-only";
import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

export async function generatePromptPayQrDataUrl(promptPayId: string, amount: number): Promise<string> {
  const payload = generatePayload(promptPayId, { amount });
  return QRCode.toDataURL(payload, { width: 300, margin: 1 });
}
