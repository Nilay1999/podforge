import * as secretsApi from "@src/api/secrets";
import type { Secret, SecretList, CreateSecretRequest } from "@src/types";
import { createResourceHooks } from "./createResourceHooks";

const hooks = createResourceHooks<Secret, SecretList, CreateSecretRequest>("secrets", {
  list: secretsApi.listSecrets,
  get: secretsApi.getSecret,
  create: secretsApi.createSecret,
  remove: secretsApi.deleteSecret
});

export const useSecrets = hooks.useList;
export const useSecret = hooks.useDetail;
export const useCreateSecret = hooks.useCreate;
export const useDeleteSecret = hooks.useRemove;
