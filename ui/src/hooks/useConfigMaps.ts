import * as configMapApi from "@src/api/configmaps";
import type {
  ConfigMap,
  ConfigMapList,
  CreateConfigMapRequest,
} from "@src/types";
import { createResourceHooks } from "./createResourceHooks";

const hooks = createResourceHooks<
  ConfigMap,
  ConfigMapList,
  CreateConfigMapRequest
>("configmaps", {
  list: configMapApi.listConfigMaps,
  get: configMapApi.getConfigMap,
  create: configMapApi.createConfigMap,
  update: configMapApi.updateConfigMap,
  remove: configMapApi.deleteConfigMap,
});

export const configMapKeys = hooks.keys;
export const useConfigMaps = hooks.useList;
export const useConfigMap = hooks.useDetail;
export const useCreateConfigMap = hooks.useCreate;
export const useUpdateConfigMap = hooks.useUpdate;
export const useDeleteConfigMap = hooks.useRemove;
