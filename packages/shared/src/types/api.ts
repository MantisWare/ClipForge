export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "NOT_IMPLEMENTED"
  | "WORKSPACE_REQUIRED";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};

export type ApiSuccess<T> = {
  data: T;
};

export type ApiResponse<T> = ApiSuccess<T> | { error: ApiError };

export const RIGHTS_WARNING =
  "Please confirm you own this content or have permission to repurpose it. ClipForge does not grant rights to reuse third-party videos.";

export type DiscoveryRightsStatus = "own" | "permission_required" | "unknown";
