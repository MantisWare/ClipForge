import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type Props = {
  title: string;
  description: string;
};

export const PlaceholderPage = ({ title, description }: Props) => (
  <Card>
    <CardTitle>{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
    <p className="mt-4 text-sm text-muted">
      This section is scaffolded and will be implemented in a later phase.
    </p>
  </Card>
);
