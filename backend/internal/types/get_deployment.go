package types

type GetDeploymentByName struct {
	Name      string `json:"name"      binding:"required"`
	Namespace string `json:"namespace"`
}
