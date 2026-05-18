import type { ApiError, ApiErrorCode } from "@clipforge/shared";
import { NextResponse } from "next/server";

export const apiSuccess = <T>(data: T, status = 200) =>
  NextResponse.json({ data }, { status });

export const apiError = (
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: unknown,
) =>
  NextResponse.json(
    { error: { code, message, details } satisfies ApiError },
    { status },
  );

export const parseJsonBody = async <T>(
  request: Request,
): Promise<T | null> => {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
};
