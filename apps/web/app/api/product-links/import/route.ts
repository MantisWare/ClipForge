import { apiError, apiSuccess, parseJsonBody } from "@/lib/api";
import { requireUser, requireWorkspaceEditor } from "@/lib/api-auth";
import { isOverlaysEnabled, overlaysDisabledResponse } from "@/lib/overlay-feature";
import { validateProductUrl } from "@/lib/url-safety";
import { prisma } from "@clipforge/database";
import { importProductLinksCsvSchema } from "@clipforge/shared";

const parseCsvRow = (line: string): { title: string; url: string; priceLabel?: string; affiliateNetwork?: string } | null => {
  const trimmed = line.trim();
  if (trimmed === "" || trimmed.startsWith("#")) {
    return null;
  }
  const parts = trimmed.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
  if (parts.length < 2) {
    return null;
  }
  return {
    title: parts[0] ?? "",
    url: parts[1] ?? "",
    priceLabel: parts[2],
    affiliateNetwork: parts[3],
  };
};

export const POST = async (request: Request) => {
  if (!isOverlaysEnabled()) {
    return overlaysDisabledResponse();
  }

  const authResult = await requireUser();
  if ("error" in authResult) {
    return authResult.error;
  }

  const body = await parseJsonBody<unknown>(request);
  const parsed = importProductLinksCsvSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.message, 400);
  }

  const access = await requireWorkspaceEditor(
    authResult.userId,
    parsed.data.workspaceId,
  );
  if ("error" in access) {
    return access.error;
  }

  const settings = await prisma.workspaceOverlaySettings.findUnique({
    where: { workspaceId: parsed.data.workspaceId },
  });

  const lines = parsed.data.csv.split("\n");
  const created: string[] = [];
  const errors: string[] = [];

  for (const line of lines) {
    const row = parseCsvRow(line);
    if (row === null || row.title === "" || row.url === "") {
      continue;
    }
    const urlCheck = validateProductUrl(row.url, settings?.urlAllowlist ?? []);
    if (!urlCheck.ok) {
      errors.push(`${row.title}: ${urlCheck.reason}`);
      continue;
    }
    const link = await prisma.productLink.create({
      data: {
        workspaceId: parsed.data.workspaceId,
        title: row.title,
        url: urlCheck.url,
        priceLabel: row.priceLabel,
        affiliateNetwork: row.affiliateNetwork,
        active: true,
      },
    });
    created.push(link.id);
  }

  return apiSuccess({ createdCount: created.length, createdIds: created, errors });
};
