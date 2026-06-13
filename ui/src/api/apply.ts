import { apiClient } from "./client";
import type { ApplyRequest, ApplyResult } from "@src/types";

export const applyYaml = (payload: ApplyRequest) =>
  apiClient.post<ApplyResult>("/apply", payload).then((r) => r.data);
