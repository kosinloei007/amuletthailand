"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/actions";

export type ActionState = { error?: string } | undefined;

function readAddressForm(formData: FormData) {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const subDistrict = String(formData.get("subDistrict") ?? "").trim();
  const district = String(formData.get("district") ?? "").trim();
  const province = String(formData.get("province") ?? "").trim();
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const isDefault = formData.get("isDefault") === "on";

  if (!fullName || !phone || !address) {
    return { error: "กรุณากรอกชื่อผู้รับ เบอร์โทร และที่อยู่ให้ครบ" } as const;
  }

  return {
    data: {
      fullName,
      phone,
      address,
      subDistrict: subDistrict || undefined,
      district: district || undefined,
      province: province || undefined,
      postalCode: postalCode || undefined,
      isDefault,
    },
  } as const;
}

export async function createAddressAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const parsed = readAddressForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existingCount = await prisma.userAddress.count({ where: { userId: session.userId } });
  const shouldBeDefault = parsed.data.isDefault || existingCount === 0;

  await prisma.$transaction(async (tx) => {
    if (shouldBeDefault) {
      await tx.userAddress.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      });
    }
    await tx.userAddress.create({
      data: { ...parsed.data, userId: session.userId, isDefault: shouldBeDefault },
    });
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function updateAddressAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const userAddressId = Number(formData.get("userAddressId"));
  const parsed = readAddressForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const existing = await prisma.userAddress.findFirst({
    where: { userAddressId, userId: session.userId },
  });
  if (!existing) {
    return { error: "ไม่พบที่อยู่นี้" };
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.isDefault) {
      await tx.userAddress.updateMany({
        where: { userId: session.userId, NOT: { userAddressId } },
        data: { isDefault: false },
      });
    }
    await tx.userAddress.update({
      where: { userAddressId },
      data: parsed.data,
    });
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function deleteAddressAction(formData: FormData) {
  const session = await requireSession();
  const userAddressId = Number(formData.get("userAddressId"));

  const existing = await prisma.userAddress.findFirst({
    where: { userAddressId, userId: session.userId },
  });
  if (!existing) {
    redirect("/account/addresses");
  }

  await prisma.$transaction(async (tx) => {
    await tx.userAddress.delete({ where: { userAddressId } });

    if (existing.isDefault) {
      const nextDefault = await tx.userAddress.findFirst({
        where: { userId: session.userId },
        orderBy: { userAddressId: "desc" },
      });
      if (nextDefault) {
        await tx.userAddress.update({
          where: { userAddressId: nextDefault.userAddressId },
          data: { isDefault: true },
        });
      }
    }
  });

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}

export async function setDefaultAddressAction(formData: FormData) {
  const session = await requireSession();
  const userAddressId = Number(formData.get("userAddressId"));

  const existing = await prisma.userAddress.findFirst({
    where: { userAddressId, userId: session.userId },
  });
  if (!existing) {
    redirect("/account/addresses");
  }

  await prisma.$transaction([
    prisma.userAddress.updateMany({
      where: { userId: session.userId },
      data: { isDefault: false },
    }),
    prisma.userAddress.update({
      where: { userAddressId },
      data: { isDefault: true },
    }),
  ]);

  revalidatePath("/account/addresses");
  redirect("/account/addresses");
}
