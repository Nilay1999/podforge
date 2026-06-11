export interface ApplyRequest {
  yaml: string;
  namespace?: string;
  dryRun?: boolean;
}

export interface AppliedResource {
  kind: string;
  name: string;
  namespace?: string;
}

export interface ApplyResult {
  dryRun: boolean;
  applied: AppliedResource[];
}
