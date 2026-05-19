import type { ObjectMeta } from "./shared";

export interface ServicePort {
  name?: string;
  protocol?: string;
  appProtocol?: string;
  port: number;
  targetPort?: string | number;
  nodePort?: number;
}

export interface Service {
  metadata: ObjectMeta;
  spec?: {
    type?: string;
    clusterIP?: string;
    clusterIPs?: string[];
    selector?: Record<string, string>;
    ports?: ServicePort[];
    externalName?: string;
    externalIPs?: string[];
    sessionAffinity?: string;
    externalTrafficPolicy?: string;
  };
  status?: {
    loadBalancer?: {
      ingress?: Array<{ ip?: string; hostname?: string }>;
    };
  };
}

export interface ServiceList {
  items: Service[];
}

export interface CreateServicePortInput {
  name?: string;
  protocol?: string;
  port: number;
  targetPort?: string;
  nodePort?: number;
}

export interface CreateServiceRequest {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  selector?: Record<string, string>;
  type?: string;
  ports?: CreateServicePortInput[];
  clusterIP?: string;
  externalName?: string;
  externalIPs?: string[];
  sessionAffinity?: string;
  externalTrafficPolicy?: string;
  internalTrafficPolicy?: string;
}
