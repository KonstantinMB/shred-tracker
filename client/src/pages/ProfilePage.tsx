import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  name: z.string().min(1, "Name required"),
  startDate: z.string().min(1, "Start date required"),
  startWeight: z.coerce.number().min(40).max(200),
  goalWeight: z.coerce.number().min(40).max(200),
  goalMonths: z.coerce.number().min(1).max(24),
  estimatedBodyFat: z.coerce.number().min(5).max(50).optional().nullable(),
  caloriesTarget: z.coerce.number().min(1000).max(6000),
  proteinTarget: z.coerce.number().min(50).max(400),
  carbsTarget: z.coerce.number().min(50).max(600),
  fatTarget: z.coerce.number().min(20).max(200),
  stepsTarget: z.coerce.number().min(1000).max(50000),
  waterTarget: z.coerce.number().min(1).max(10),
  sleepTarget: z.coerce.number().min(4).max(14),
  location: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

function calcCalories(protein: number, carbs: number, fat: number) {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

export default function ProfilePage() {
  const { profile, updateProfile, isUpdating } = useProfile();
  const { toast } = useToast();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: profile?.name ?? "Konstantin",
      startDate: profile?.startDate ?? "2026-03-01",
      startWeight: profile?.startWeight ?? 94,
      goalWeight: profile?.goalWeight ?? 84,
      goalMonths: profile?.goalMonths ?? 12,
      estimatedBodyFat: profile?.estimatedBodyFat ?? undefined,
      caloriesTarget: profile?.caloriesTarget ?? 2500,
      proteinTarget: profile?.proteinTarget ?? 210,
      carbsTarget: profile?.carbsTarget ?? 240,
      fatTarget: profile?.fatTarget ?? 78,
      stepsTarget: profile?.stepsTarget ?? 10000,
      waterTarget: profile?.waterTarget ?? 3,
      sleepTarget: profile?.sleepTarget ?? 8,
      location: profile?.location ?? "",
    },
    values: profile
      ? {
          name: profile.name,
          startDate: profile.startDate,
          startWeight: profile.startWeight,
          goalWeight: profile.goalWeight,
          goalMonths: profile.goalMonths,
          estimatedBodyFat: profile.estimatedBodyFat ?? undefined,
          caloriesTarget: profile.caloriesTarget,
          proteinTarget: profile.proteinTarget,
          carbsTarget: profile.carbsTarget,
          fatTarget: profile.fatTarget,
          stepsTarget: profile.stepsTarget,
          waterTarget: profile.waterTarget,
          sleepTarget: profile.sleepTarget,
          location: profile.location ?? "",
        }
      : undefined,
  });

  const proteinTarget = watch("proteinTarget");
  const carbsTarget = watch("carbsTarget");
  const fatTarget = watch("fatTarget");
  useEffect(() => {
    const cal = calcCalories(Number(proteinTarget) || 0, Number(carbsTarget) || 0, Number(fatTarget) || 0);
    if (cal > 0) setValue("caloriesTarget", cal);
  }, [proteinTarget, carbsTarget, fatTarget, setValue]);

  const onSubmit = (data: FormValues) => {
    updateProfile(
      {
        ...data,
        estimatedBodyFat: data.estimatedBodyFat ?? null,
      },
      {
        onSuccess: () => toast({ title: "Profile saved", description: "Your settings have been updated." }),
        onError: () => toast({ title: "Error", description: "Failed to save profile.", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-3xl mx-auto">
      <div className="fade-slide-up pt-1">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Profile & Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Configure your targets, timeline, and personal details for analytics
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="glow-border rounded-xl bg-card p-5 space-y-6 fade-slide-up">
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Program & Weight Goals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} className="bg-secondary border-border" />
              {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" {...register("startDate")} className="bg-secondary border-border" />
              {errors.startDate && <p className="text-xs text-red-400">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startWeight">Starting Weight (kg)</Label>
              <Input id="startWeight" type="number" step="0.1" {...register("startWeight")} className="bg-secondary border-border" />
              {errors.startWeight && <p className="text-xs text-red-400">{errors.startWeight.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goalWeight">Goal Weight (kg)</Label>
              <Input id="goalWeight" type="number" step="0.1" {...register("goalWeight")} className="bg-secondary border-border" />
              {errors.goalWeight && <p className="text-xs text-red-400">{errors.goalWeight.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="goalMonths">Timeline (months)</Label>
              <Input id="goalMonths" type="number" {...register("goalMonths")} className="bg-secondary border-border" />
              {errors.goalMonths && <p className="text-xs text-red-400">{errors.goalMonths.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimatedBodyFat">Estimated Body Fat (%)</Label>
              <Input id="estimatedBodyFat" type="number" step="0.5" placeholder="Optional" {...register("estimatedBodyFat")} className="bg-secondary border-border" />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Nutrition Targets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="caloriesTarget">Calories (kcal) — auto from macros</Label>
              <Input id="caloriesTarget" type="number" readOnly {...register("caloriesTarget")} className="bg-secondary border-border cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">Protein×4 + Carbs×4 + Fat×9</p>
              {errors.caloriesTarget && <p className="text-xs text-red-400">{errors.caloriesTarget.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proteinTarget">Protein (g)</Label>
              <Input id="proteinTarget" type="number" {...register("proteinTarget")} className="bg-secondary border-border" />
              {errors.proteinTarget && <p className="text-xs text-red-400">{errors.proteinTarget.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="carbsTarget">Carbs (g)</Label>
              <Input id="carbsTarget" type="number" {...register("carbsTarget")} className="bg-secondary border-border" />
              {errors.carbsTarget && <p className="text-xs text-red-400">{errors.carbsTarget.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fatTarget">Fat (g)</Label>
              <Input id="fatTarget" type="number" {...register("fatTarget")} className="bg-secondary border-border" />
              {errors.fatTarget && <p className="text-xs text-red-400">{errors.fatTarget.message}</p>}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-foreground mb-4">Other Targets</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="stepsTarget">Steps</Label>
              <Input id="stepsTarget" type="number" {...register("stepsTarget")} className="bg-secondary border-border" />
              {errors.stepsTarget && <p className="text-xs text-red-400">{errors.stepsTarget.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waterTarget">Water (L)</Label>
              <Input id="waterTarget" type="number" step="0.1" {...register("waterTarget")} className="bg-secondary border-border" />
              {errors.waterTarget && <p className="text-xs text-red-400">{errors.waterTarget.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sleepTarget">Sleep (hours)</Label>
              <Input id="sleepTarget" type="number" step="0.5" {...register("sleepTarget")} className="bg-secondary border-border" />
              {errors.sleepTarget && <p className="text-xs text-red-400">{errors.sleepTarget.message}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="e.g. Sofia, BG" {...register("location")} className="bg-secondary border-border" />
        </div>

        <Button type="submit" disabled={isUpdating}>
          {isUpdating ? "Saving..." : "Save Profile"}
        </Button>
      </form>
    </div>
  );
}
