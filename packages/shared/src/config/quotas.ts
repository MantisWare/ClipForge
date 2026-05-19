const parseOptionalLimit = (value: string | undefined): number | null => {
  if (value === undefined || value === "") {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
};

export const getQuotaConfig = () => ({
  maxSourcesPerWorkspace: parseOptionalLimit(
    process.env.MAX_SOURCES_PER_WORKSPACE,
  ),
  maxRendersPerDay: parseOptionalLimit(process.env.MAX_RENDERS_PER_DAY),
});
