import * as servicesApi from "@src/api/services";
import type { Service, ServiceList, CreateServiceRequest } from "@src/types";
import { createResourceHooks } from "./createResourceHooks";

const hooks = createResourceHooks<Service, ServiceList, CreateServiceRequest>("services", {
  list: servicesApi.listServices,
  get: servicesApi.getService,
  create: servicesApi.createService,
  remove: servicesApi.deleteService
});

export const useServices = hooks.useList;
export const useService = hooks.useDetail;
export const useCreateService = hooks.useCreate;
export const useDeleteService = hooks.useRemove;
