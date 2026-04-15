import * as podApi from "../api/pods";
import type { CreatePodRequest, Pod, PodList } from "../types";
import { createResourceHooks } from "./createResourceHooks";

const hooks = createResourceHooks<Pod, PodList, CreatePodRequest>("pods", {
  list: podApi.listPods,
  get: podApi.getPod,
  create: podApi.createPod,
  update: podApi.updatePod,
  remove: podApi.deletePod,
});

export const podKeys = hooks.keys;
export const usePods = hooks.useList;
export const usePod = hooks.useDetail;
export const useCreatePod = hooks.useCreate;
export const useUpdatePod = hooks.useUpdate;
export const useDeletePod = hooks.useRemove;
