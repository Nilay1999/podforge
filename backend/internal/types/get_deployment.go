package types

type GetDeployementByName struct {
	Name      string `json:"name"      binding:"required"`
	Namespace string `json:"namespace"`
}
