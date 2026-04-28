import * as podApi from "@src/api/pods";
import type { CreatePodRequest, Pod, PodList } from "@src/types";
import { createResourceHooks } from "./createResourceHooks";

const hooks = createResourceHooks<Pod, PodList, CreatePodRequest>("pods", {
  list: podApi.listPods,
  get: podApi.getPod,
  create: podApi.createPod,
  remove: podApi.deletePod,
});

export const usePods = hooks.useList;
export const usePod = hooks.useDetail;
export const useCreatePod = hooks.useCreate;
export const useDeletePod = hooks.useRemove;
