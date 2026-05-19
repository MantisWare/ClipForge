export const generateCtaVariants = (input: {
  hook?: string | null;
  productTitle?: string | null;
}): string[] => {
  const hook = input.hook?.trim() ?? "";
  const product = input.productTitle?.trim() ?? "";

  const variants: string[] = [];

  if (product !== "") {
    variants.push(`Shop ${product}`);
    variants.push(`Get ${product} — link below`);
    variants.push(`Limited offer: ${product}`);
  }

  if (hook !== "") {
    const short =
      hook.length > 42 ? `${hook.slice(0, 39)}…` : hook;
    variants.push(short);
    variants.push(`Don't miss this — ${short}`);
  }

  if (variants.length === 0) {
    variants.push("Link in bio");
    variants.push("Tap the link");
    variants.push("Shop now");
  }

  return [...new Set(variants)].slice(0, 5);
};
