"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/actions";

export type ActionState = { error?: string } | undefined;

async function requireTenantAdmin() {
  const session = await requireSession();
  if (session.role !== "tenant_admin" || !session.tenantId) {
    redirect("/admin");
  }
  return { tenantId: session.tenantId };
}

export async function updateShopInfoAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const shopName = String(formData.get("shopName") ?? "").trim();
  const ownerContact = String(formData.get("ownerContact") ?? "").trim();

  if (!shopName) {
    return { error: "กรุณากรอกชื่อร้าน" };
  }

  await prisma.tenant.update({
    where: { tenantId },
    data: { shopName, ownerContact: ownerContact || null },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}

export async function selectPresetThemeAction(formData: FormData) {
  const { tenantId } = await requireTenantAdmin();
  const themeId = Number(formData.get("themeId"));

  const theme = await prisma.theme.findFirst({ where: { themeId, isPreset: true } });
  if (!theme) {
    redirect("/admin/settings?error=" + encodeURIComponent("ไม่พบธีมสำเร็จรูปที่เลือก"));
  }

  await prisma.tenant.update({ where: { tenantId }, data: { themeId } });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

function readThemeForm(formData: FormData) {
  const primaryColor = String(formData.get("primaryColor") ?? "");
  const accentColor = String(formData.get("accentColor") ?? "");
  const backgroundColor = String(formData.get("backgroundColor") ?? "");
  const surfaceColor = String(formData.get("surfaceColor") ?? "");
  const textColor = String(formData.get("textColor") ?? "");
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const fontFamily = String(formData.get("fontFamily") ?? "").trim();
  const layoutStyle = String(formData.get("layoutStyle") ?? "classic").trim();

  for (const [label, value] of [
    ["สีหลัก", primaryColor],
    ["สีรอง", accentColor],
    ["สีพื้นหลัง", backgroundColor],
    ["สีพื้นผิวการ์ด", surfaceColor],
    ["สีตัวอักษร", textColor],
  ] as const) {
    if (!HEX_COLOR_PATTERN.test(value)) {
      return { error: `${label} ต้องเป็นรหัสสี hex ที่ถูกต้อง` } as const;
    }
  }

  return {
    data: {
      primaryColor,
      accentColor,
      backgroundColor,
      surfaceColor,
      textColor,
      logoUrl: logoUrl || null,
      fontFamily: fontFamily || null,
      layoutStyle: layoutStyle || "classic",
    },
  } as const;
}

export async function customizeThemeAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { tenantId } = await requireTenantAdmin();
  const parsed = readThemeForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { tenantId }, include: { theme: true } });

  // clone-on-write: ห้ามแก้ preset ตรงๆ (จะกระทบร้านอื่นที่ใช้ preset เดียวกัน) และห้ามแก้ theme ที่ร้านอื่นใช้ร่วมอยู่
  const canEditInPlace = tenant.theme && !tenant.theme.isPreset;
  const sharedByOthers = canEditInPlace
    ? (await prisma.tenant.count({ where: { themeId: tenant.themeId!, NOT: { tenantId } } })) > 0
    : false;

  if (canEditInPlace && !sharedByOthers) {
    await prisma.theme.update({ where: { themeId: tenant.themeId! }, data: parsed.data });
  } else {
    const newTheme = await prisma.theme.create({
      data: { ...parsed.data, name: `${tenant.shopName} (กำหนดเอง)`, isPreset: false },
    });
    await prisma.tenant.update({ where: { tenantId }, data: { themeId: newTheme.themeId } });
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}
