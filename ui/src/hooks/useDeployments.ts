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
