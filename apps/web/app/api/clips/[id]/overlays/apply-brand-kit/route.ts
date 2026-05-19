import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import {
  requireUser,
  requireWorkspaceEditor,
} from "@/lib/api-auth";
import { loadClipForWorkspace, requireApprovedClip } from "@/lib/clip-access";
import { ensureDefaultBrandKit } from "@/lib/brand-kit-defaults";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { prisma, type Prisma } from "@clipforge/database";
import { z } from "zod";

const bodySchema = z.object({
  workspaceId: z.string().min(1),
});

export const POST = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const { id } = await params;
  const body = await parseJsonBody<unknown>(request);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const loaded = await loadClipForWorkspace(id);
  if ("error" in loaded) {
    return loaded.error;
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  if (loaded.workspaceId !== parsed.data.workspaceId) {
    return apiError("FORBIDDEN", "Clip not in workspace", 403);
  }

  const statusError = requireApprovedClip(loaded.clip.status);
  if (statusError !== null) {
    return statusError;
  }

  const brandKit = await ensureDefaultBrandKit(parsed.data.workspaceId);
  const settings = await prisma.workspaceOverlaySettings.findUnique({
    where: { workspaceId: parsed.data.workspaceId },
  });

  const disclosure =
    settings?.defaultDisclosureText ??
    "Links may earn a commission.";

  const clipDurationMs = loaded.clip.endMs - loaded.clip.startMs;
  const endSlateMs = 3000;

  const defaults =
    typeof brandKit.overlayDefaults === "object" &&
    brandKit.overlayDefaults !== null
      ? (brandKit.overlayDefaults as Record<string, unknown>)
      : {};

  const headline =
    typeof defaults.endSlateHeadline === "string"
      ? defaults.endSlateHeadline
      : (loaded.clip.suggestedTitle ?? "Follow for more");
  const cta =
    typeof defaults.endSlateCta === "string"
      ? defaults.endSlateCta
      : "Link in bio";

  const existing = await prisma.clipOverlay.findMany({
    where: { clipCandidateId: id },
  });

  const result = await prisma.$transaction(async (tx) => {
    if (existing.length > 0) {
      for (const row of existing) {
        const prior =
          typeof row.style === "object" && row.style !== null
            ? (row.style as Record<string, unknown>)
            : {};
        await tx.clipOverlay.update({
          where: { id: row.id },
          data: {
            style: {
              ...prior,
              primaryColor: brandKit.primaryColor,
              fontFamily: brandKit.fontFamily,
              hookFontSize: brandKit.hookFontSize,
            } as Prisma.InputJsonValue,
          },
        });
      }
      return tx.clipOverlay.findMany({
        where: { clipCandidateId: id },
        include: { productLink: true, template: true },
      });
    }

    const created = await Promise.all([
      tx.clipOverlay.create({
        data: {
          clipCandidateId: id,
          overlayType: "affiliate_bar",
          startMs: 0,
          endMs: clipDurationMs,
          position: { anchor: "bottom_center", marginPx: 48 },
          style: {
            disclosure,
            primaryColor: brandKit.primaryColor,
          },
          compliance: "affiliate",
          sortOrder: 0,
          isDraft: false,
        },
      }),
      tx.clipOverlay.create({
        data: {
          clipCandidateId: id,
          overlayType: "end_slate",
          startMs: Math.max(0, clipDurationMs - endSlateMs),
          endMs: clipDurationMs,
          position: { anchor: "center", marginPx: 80 },
          style: {
            headline,
            cta,
            primaryColor: brandKit.primaryColor,
            fontFamily: brandKit.fontFamily,
          },
          compliance: "none",
          sortOrder: 1,
          isDraft: false,
        },
      }),
    ]);

    return created;
  });

  return apiSuccess(result);
};
