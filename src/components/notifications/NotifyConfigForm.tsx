"use client";

import { useActionState } from "react";
import { updateNotifyConfigAction, testSendNotificationAction, type ActionState } from "@/lib/notifications/actions";

export function NotifyConfigForm({
  telegramEnabled,
  telegramBotToken,
  telegramChatId,
  emailEnabled,
  emailToAddress,
}: {
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  emailEnabled: boolean;
  emailToAddress: string;
}) {
  const [saveState, saveAction, isSaving] = useActionState<ActionState, FormData>(updateNotifyConfigAction, undefined);
  const [testState, testAction, isTesting] = useActionState<ActionState, FormData>(testSendNotificationAction, undefined);

  return (
    <div className="flex flex-col gap-6">
      <form action={saveAction} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-3 rounded-md border border-black/10 p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="telegramEnabled" defaultChecked={telegramEnabled} />
            เปิดใช้งานแจ้งเตือนผ่าน Telegram
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="telegramBotToken" className="text-sm">
              Bot Token
            </label>
            <input
              id="telegramBotToken"
              name="telegramBotToken"
              type="text"
              defaultValue={telegramBotToken}
              placeholder="123456:ABC-DEF..."
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="telegramChatId" className="text-sm">
              Chat ID
            </label>
            <input
              id="telegramChatId"
              name="telegramChatId"
              type="text"
              defaultValue={telegramChatId}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-3 rounded-md border border-black/10 p-3">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="emailEnabled" defaultChecked={emailEnabled} />
            เปิดใช้งานแจ้งเตือนผ่านอีเมล
          </label>
          <div className="flex flex-col gap-1">
            <label htmlFor="emailToAddress" className="text-sm">
              อีเมลปลายทาง
            </label>
            <input
              id="emailToAddress"
              name="emailToAddress"
              type="email"
              defaultValue={emailToAddress}
              className="rounded-md border border-black/10 px-3 py-2"
            />
          </div>
        </fieldset>

        {saveState?.error && <p className="text-sm text-red-600">{saveState.error}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60"
        >
          {isSaving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </form>

      <form action={testAction} className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={isTesting}
          className="w-fit rounded-md border border-black/20 px-4 py-2 text-sm disabled:opacity-60"
        >
          {isTesting ? "กำลังส่ง..." : "ทดสอบส่ง"}
        </button>
        {testState?.error && <p className="text-sm text-red-600">{testState.error}</p>}
        {testState?.success && <p className="text-sm text-green-600">{testState.success}</p>}
      </form>
    </div>
  );
}
