type Props = {
  status: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-muted/20 text-muted",
  importing: "bg-accent-cyan/20 text-accent-cyan",
  imported: "bg-success/20 text-success",
  ready: "bg-success/20 text-success",
  analyzing: "bg-brand-pink/20 text-brand-pink",
  failed: "bg-danger/20 text-danger",
  transcribing: "bg-accent-orange/20 text-accent-orange",
};

export const SourceStatusBadge = ({ status }: Props) => {
  const style =
    STATUS_STYLES[status] ?? "bg-muted/20 text-muted";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
};
