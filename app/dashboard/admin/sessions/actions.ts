"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SessionStatus } from "@/lib/generated/prisma/enums";
import { requireAdmin, requirePermission } from "@/lib/guards";
import {
  canCancelSession,
  canCompleteSession,
  canEditSession,
} from "@/lib/permissions";
import {
  SessionManagementError,
  adminUpdateSessionStatus,
} from "@/services/session.service";
import { sessionStatusUpdateSchema } from "@/lib/validators/session";

function readString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function safeReturnPath(value: string | undefined): string {
  if (
    value === "/dashboard/admin/sessions" ||
    value?.startsWith("/dashboard/admin/sessions?")
  ) {
    return value;
  }

  return "/dashboard/admin/sessions";
}

function redirectWithError(path: string, message: string): never {
  const [pathname, queryString] = path.split("?", 2);
  const params = new URLSearchParams(queryString);
  params.set("error", message);

  redirect(`${pathname}?${params.toString()}`);
}

function errorMessage(error: unknown): string {
  if (error instanceof SessionManagementError) {
    if (error.code === "INVALID_STATUS_TRANSITION") {
      return "Invalid session status transition.";
    }

    if (error.code === "SESSION_NOT_FOUND") {
      return "Session not found.";
    }
  }

  return "Unable to update session status.";
}

export async function updateAdminSessionStatusAction(
  formData: FormData,
): Promise<void> {
  const parsed = sessionStatusUpdateSchema.safeParse({
    sessionId: readString(formData, "sessionId"),
    status: readString(formData, "status"),
    returnTo: readString(formData, "returnTo"),
  });
  const returnTo = safeReturnPath(
    parsed.success ? parsed.data.returnTo : undefined,
  );

  if (!parsed.success) {
    redirectWithError(returnTo, "Missing session status information.");
  }

  const user = await requireAdmin();

  if (parsed.data.status === SessionStatus.CANCELLED) {
    await requirePermission(canCancelSession(user, parsed.data.sessionId));
  } else if (parsed.data.status === SessionStatus.COMPLETED) {
    await requirePermission(canCompleteSession(user, parsed.data.sessionId));
  } else {
    await requirePermission(canEditSession(user, parsed.data.sessionId));
  }

  try {
    await adminUpdateSessionStatus(parsed.data.sessionId, parsed.data.status);
  } catch (error) {
    redirectWithError(returnTo, errorMessage(error));
  }

  revalidatePath("/dashboard/admin/sessions");
  revalidatePath("/dashboard/tutor/sessions");
  redirect(returnTo);
}

async function updateAdminSessionStatusWithIntent(
  formData: FormData,
  status: SessionStatus,
): Promise<void> {
  const sessionId = readString(formData, "sessionId");
  const returnTo = safeReturnPath(readString(formData, "returnTo"));

  if (!sessionId) {
    redirectWithError(returnTo, "Missing session id.");
  }

  const nextFormData = new FormData();
  nextFormData.set("sessionId", sessionId);
  nextFormData.set("status", status);
  nextFormData.set("returnTo", returnTo);

  await updateAdminSessionStatusAction(nextFormData);
}

export async function cancelAdminSessionAction(
  formData: FormData,
): Promise<void> {
  await updateAdminSessionStatusWithIntent(formData, SessionStatus.CANCELLED);
}

export async function completeAdminSessionAction(
  formData: FormData,
): Promise<void> {
  await updateAdminSessionStatusWithIntent(formData, SessionStatus.COMPLETED);
}
