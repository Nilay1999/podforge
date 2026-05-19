import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as deploymentApi from "@src/api/deployments";
import type { CreateDeploymentRequest, Deployment, DeploymentList } from "@src/types";
import { createResourceHooks } from "./createResourceHooks";

const hooks = createResourceHooks<Deployment, DeploymentList, CreateDeploymentRequest>(
  "deployments",
  {
    list: deploymentApi.listDeployments,
    get: deploymentApi.getDeployment,
    create: deploymentApi.createDeployment,
    remove: deploymentApi.deleteDeployment
  }
);

export const useDeployments = hooks.useList;
export const useDeployment = hooks.useDetail;
export const useCreateDeployment = hooks.useCreate;
export const useDeleteDeployment = hooks.useRemove;

export const useScaleDeployment = (namespace: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, replicas }: { name: string; replicas: number }) =>
      deploymentApi.scaleDeployment(namespace, name, replicas),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] })
  });
};

export const useRestartDeployment = (namespace: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deploymentApi.restartDeployment(namespace, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deployments"] })
  });
};
