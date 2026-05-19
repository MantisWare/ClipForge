import { prisma } from "@clipforge/database";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) => {
  const { slug } = await params;

  const link = await prisma.overlayLinkSlug.findUnique({
    where: { slug },
  });

  if (link === null) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.overlayEvent.create({
    data: {
      slugId: link.id,
      type: "click",
    },
  });

  return NextResponse.redirect(link.targetUrl);
};
