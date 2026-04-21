package types

import (
	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
)

type DeploymentOverview struct {
	Deployment  *appsv1.Deployment  `json:"deployment"`
	ReplicaSets []appsv1.ReplicaSet `json:"replicaSets"`
	Pods        []corev1.Pod        `json:"pods"`
	Events      []corev1.Event      `json:"events"`
}

type PodOverview struct {
	Pod    *corev1.Pod    `json:"pod"`
	Events []corev1.Event `json:"events"`
}
