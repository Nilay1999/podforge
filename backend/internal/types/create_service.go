package types

type CreateServiceRequest struct {
	Name      string `json:"name"      binding:"required"`
	Namespace string `json:"namespace" binding:"required"`

	Labels      map[string]string `json:"labels,omitempty"`
	Annotations map[string]string `json:"annotations,omitempty"`

	Selector map[string]string `json:"selector,omitempty"`

	// Type: ClusterIP (default) | NodePort | LoadBalancer | ExternalName
	Type string `json:"type,omitempty"`

	Ports []ServicePort `json:"ports,omitempty"`

	ClusterIP string `json:"clusterIP,omitempty"`

	ExternalName string `json:"externalName,omitempty"`

	ExternalIPs []string `json:"externalIPs,omitempty"`

	SessionAffinity               string `json:"sessionAffinity,omitempty"` // None (default) | ClientIP
	SessionAffinityTimeoutSeconds *int32 `json:"sessionAffinityTimeoutSeconds,omitempty"`

	ExternalTrafficPolicy string `json:"externalTrafficPolicy,omitempty"` // Cluster (default) | Local
	InternalTrafficPolicy string `json:"internalTrafficPolicy,omitempty"` // Cluster (default) | Local

	LoadBalancerIP           string   `json:"loadBalancerIP,omitempty"`
	LoadBalancerSourceRanges []string `json:"loadBalancerSourceRanges,omitempty"`
	HealthCheckNodePort      int32    `json:"healthCheckNodePort,omitempty"`

	PublishNotReadyAddresses bool `json:"publishNotReadyAddresses,omitempty"`
}

type ServicePort struct {
	Name        string `json:"name,omitempty"`
	Protocol    string `json:"protocol,omitempty"`    // TCP (default) | UDP | SCTP
	AppProtocol string `json:"appProtocol,omitempty"` // e.g. "http" | "grpc"
	Port        int32  `json:"port" binding:"required,min=1,max=65535"`
	TargetPort  string `json:"targetPort,omitempty"`
	NodePort    int32  `json:"nodePort,omitempty"`
}
