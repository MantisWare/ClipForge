const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  if (value === undefined || value === "") {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return fallback;
  }
  return parsed;
};

export const getBatchConfig = () => ({
  maxBatchClips: parsePositiveInt(process.env.MAX_BATCH_CLIPS, 20),
  renderConcurrency: parsePositiveInt(process.env.BATCH_RENDER_CONCURRENCY, 2),
});
