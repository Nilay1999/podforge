package builders

import (
	"github.com/nilay/k8s-orchestrator/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
)

func BuildDNSConfig(c *types.DNSConfig) *corev1.PodDNSConfig {
	if c == nil {
		return nil
	}
	out := &corev1.PodDNSConfig{
		Nameservers: c.Nameservers,
		Searches:    c.Searches,
	}
	for _, o := range c.Options {
		value := o.Value
		out.Options = append(out.Options, corev1.PodDNSConfigOption{
			Name:  o.Name,
			Value: &value,
		})
	}
	return out
}

func BuildHostAliases(aliases []types.HostAlias) []corev1.HostAlias {
	out := make([]corev1.HostAlias, len(aliases))
	for i, a := range aliases {
		out[i] = corev1.HostAlias{
			IP:        a.IP,
			Hostnames: a.Hostnames,
		}
	}
	return out
}

func BuildReadinessGates(gates []types.PodReadinessGate) []corev1.PodReadinessGate {
	out := make([]corev1.PodReadinessGate, len(gates))
	for i, g := range gates {
		out[i] = corev1.PodReadinessGate{
			ConditionType: corev1.PodConditionType(g.ConditionType),
		}
	}
	return out
}

func BuildOverhead(rl *types.ResourceList) (corev1.ResourceList, error) {
	if rl == nil {
		return nil, nil
	}
	return BuildResourceList(rl)
}
