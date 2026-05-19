export const isOverlaysEnabled = (): boolean => {
  const flag = process.env.CLIPFORGE_OVERLAYS_ENABLED;
  if (flag === undefined || flag === "") {
    return true;
  }
  return flag === "true" || flag === "1";
};

export const overlaysDisabledResponse = () =>
  new Response(
    JSON.stringify({
      error: {
        code: "FEATURE_DISABLED",
        message: "Monetization overlays are disabled on this instance.",
      },
    }),
    { status: 503, headers: { "Content-Type": "application/json" } },
  );
