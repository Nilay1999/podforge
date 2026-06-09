package builders

import (
	"testing"

	"github.com/podforge/backend/internal/types"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

func TestBuildAffinity_Nil(t *testing.T) {
	if got := BuildAffinity(nil); got != nil {
		t.Errorf("expected nil affinity, got %+v", got)
	}
}

func TestBuildAffinity_NodeAffinity(t *testing.T) {
	a := &types.Affinity{
		NodeAffinity: &types.NodeAffinity{
			RequiredMatchExpressions: []types.NodeSelectorRequirement{
				{Key: "disktype", Operator: "In", Values: []string{"ssd"}},
			},
			PreferredMatchExpressions: []types.PreferredNodeExpression{
				{Weight: 10, MatchExpressions: []types.NodeSelectorRequirement{
					{Key: "zone", Operator: "In", Values: []string{"us-east-1a"}},
				}},
			},
		},
	}

	got := BuildAffinity(a)
	if got.NodeAffinity == nil {
		t.Fatal("expected NodeAffinity to be set")
	}

	req := got.NodeAffinity.RequiredDuringSchedulingIgnoredDuringExecution
	if req == nil || len(req.NodeSelectorTerms) != 1 {
		t.Fatalf("expected 1 required NodeSelectorTerm, got %+v", req)
	}
	exprs := req.NodeSelectorTerms[0].MatchExpressions
	if len(exprs) != 1 || exprs[0].Key != "disktype" || exprs[0].Operator != corev1.NodeSelectorOpIn {
		t.Errorf("unexpected required expressions: %+v", exprs)
	}

	pref := got.NodeAffinity.PreferredDuringSchedulingIgnoredDuringExecution
	if len(pref) != 1 || pref[0].Weight != 10 {
		t.Fatalf("expected 1 preferred term weight 10, got %+v", pref)
	}
}

func TestBuildAffinity_PodAffinityAndAntiAffinity(t *testing.T) {
	a := &types.Affinity{
		PodAffinity: &types.PodAffinity{
			Required: []types.PodAffinityTerm{
				{TopologyKey: "kubernetes.io/hostname", MatchLabels: map[string]string{"app": "cache"}},
			},
		},
		PodAntiAffinity: &types.PodAntiAffinity{
			Preferred: []types.WeightedPodAffinityTerm{
				{Weight: 50, PodAffinityTerm: types.PodAffinityTerm{
					TopologyKey: "topology.kubernetes.io/zone",
					MatchExpressions: []types.LabelSelectorRequirement{
						{Key: "app", Operator: "In", Values: []string{"web"}},
					},
				}},
			},
		},
	}

	got := BuildAffinity(a)

	if got.PodAffinity == nil || len(got.PodAffinity.RequiredDuringSchedulingIgnoredDuringExecution) != 1 {
		t.Fatalf("expected 1 required pod affinity term, got %+v", got.PodAffinity)
	}
	term := got.PodAffinity.RequiredDuringSchedulingIgnoredDuringExecution[0]
	if term.TopologyKey != "kubernetes.io/hostname" {
		t.Errorf("topologyKey = %q", term.TopologyKey)
	}
	if term.LabelSelector == nil || term.LabelSelector.MatchLabels["app"] != "cache" {
		t.Errorf("expected matchLabels app=cache, got %+v", term.LabelSelector)
	}

	if got.PodAntiAffinity == nil || len(got.PodAntiAffinity.PreferredDuringSchedulingIgnoredDuringExecution) != 1 {
		t.Fatalf("expected 1 preferred anti-affinity term, got %+v", got.PodAntiAffinity)
	}
	weighted := got.PodAntiAffinity.PreferredDuringSchedulingIgnoredDuringExecution[0]
	if weighted.Weight != 50 {
		t.Errorf("weight = %d, want 50", weighted.Weight)
	}
	ls := weighted.PodAffinityTerm.LabelSelector
	if ls == nil || len(ls.MatchExpressions) != 1 || ls.MatchExpressions[0].Operator != metav1.LabelSelectorOpIn {
		t.Errorf("unexpected label selector expressions: %+v", ls)
	}
}

func TestBuildPodAffinityTerms_NoSelectorLeavesNil(t *testing.T) {
	got := BuildPodAffinityTerms([]types.PodAffinityTerm{{TopologyKey: "host"}})
	if len(got) != 1 {
		t.Fatalf("expected 1 term, got %d", len(got))
	}
	if got[0].LabelSelector != nil {
		t.Errorf("expected nil LabelSelector when no labels/expressions, got %+v", got[0].LabelSelector)
	}
}

func TestBuildTolerations(t *testing.T) {
	secs := int64(60)
	got := BuildTolerations([]types.Toleration{
		{Key: "node.kubernetes.io/not-ready", Operator: "Exists", Effect: "NoExecute", TolerationSeconds: &secs},
	})
	if len(got) != 1 {
		t.Fatalf("expected 1 toleration, got %d", len(got))
	}
	tol := got[0]
	if tol.Operator != corev1.TolerationOpExists {
		t.Errorf("operator = %q, want Exists", tol.Operator)
	}
	if tol.Effect != corev1.TaintEffectNoExecute {
		t.Errorf("effect = %q, want NoExecute", tol.Effect)
	}
	if tol.TolerationSeconds == nil || *tol.TolerationSeconds != 60 {
		t.Errorf("tolerationSeconds = %v, want 60", tol.TolerationSeconds)
	}
}

func TestBuildTopologySpreadConstraints(t *testing.T) {
	got := BuildTopologySpreadConstraints([]types.TopologySpreadConstraint{
		{MaxSkew: 1, TopologyKey: "zone", WhenUnsatisfiable: "DoNotSchedule", MatchLabels: map[string]string{"app": "web"}},
		{MaxSkew: 2, TopologyKey: "host", WhenUnsatisfiable: "ScheduleAnyway"},
	})
	if len(got) != 2 {
		t.Fatalf("expected 2 constraints, got %d", len(got))
	}
	if got[0].WhenUnsatisfiable != corev1.DoNotSchedule {
		t.Errorf("constraint[0] action = %q, want DoNotSchedule", got[0].WhenUnsatisfiable)
	}
	if got[0].LabelSelector == nil || got[0].LabelSelector.MatchLabels["app"] != "web" {
		t.Errorf("constraint[0] expected selector app=web, got %+v", got[0].LabelSelector)
	}
	// No matchLabels -> selector stays nil.
	if got[1].LabelSelector != nil {
		t.Errorf("constraint[1] expected nil selector, got %+v", got[1].LabelSelector)
	}
}
