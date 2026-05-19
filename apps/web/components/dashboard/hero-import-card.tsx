"use client";

import { SourceImportForm } from "@/components/sources/source-import-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type Props = {
  workspaceId: string;
};

export const HeroImportCard = ({ workspaceId }: Props) => {
  return (
    <Card className="border-brand-glow">
      <CardTitle>Paste a video URL</CardTitle>
      <CardDescription className="mb-4">
        Supported: YouTube, Vimeo, direct MP4/MOV URLs, and file upload (via New
        Project).
      </CardDescription>
      <SourceImportForm workspaceId={workspaceId} showFileUpload={false} />
    </Card>
  );
};
