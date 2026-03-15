import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { UserProfile } from "@shared/schema";

const DEFAULT_PROFILE: UserProfile = {
  id: 1,
  name: "Konstantin",
  startDate: "2026-03-01",
  startWeight: 94,
  goalWeight: 84,
  goalMonths: 12,
  estimatedBodyFat: null,
  caloriesTarget: 2500,
  proteinTarget: 210,
  carbsTarget: 240,
  fatTarget: 78,
  stepsTarget: 10000,
  waterTarget: 3,
  sleepTarget: 8,
  location: "Sofia, BG",
};

export function useProfile() {
  const { data: profile, isLoading } = useQuery<UserProfile | null>({
    queryKey: ["/api/profile"],
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) =>
      apiRequest("PATCH", "/api/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  const effective = profile ?? DEFAULT_PROFILE;
  const targets = {
    calories: effective.caloriesTarget,
    protein: effective.proteinTarget,
    carbs: effective.carbsTarget,
    fat: effective.fatTarget,
    steps: effective.stepsTarget,
    water: effective.waterTarget,
    sleep: effective.sleepTarget,
  };
  const weightTargets = {
    start: effective.startWeight,
    goal: effective.goalWeight,
    months: effective.goalMonths,
  };

  return {
    profile: effective,
    isLoading,
    targets,
    weightTargets,
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
