import * as configMapApi from "@src/api/configmaps";
import type { ConfigMap, ConfigMapList, CreateConfigMapRequest } from "@src/types";
import { createResourceHooks } from "./createResourceHooks";

const hooks = createResourceHooks<ConfigMap, ConfigMapList, CreateConfigMapRequest>("configmaps", {
  list: configMapApi.listConfigMaps,
  get: configMapApi.getConfigMap,
  create: configMapApi.createConfigMap,
  remove: configMapApi.deleteConfigMap
});

export const useConfigMaps = hooks.useList;
export const useConfigMap = hooks.useDetail;
export const useCreateConfigMap = hooks.useCreate;
export const useDeleteConfigMap = hooks.useRemove;
