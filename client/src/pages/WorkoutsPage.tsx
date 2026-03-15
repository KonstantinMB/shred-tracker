import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import * as api from "@/lib/supabaseApi";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from "date-fns";
import { Plus, Trash2, Dumbbell, Clock, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutLog, Exercise } from "@shared/schema";

const WORKOUT_TYPES = ["gym", "tennis", "jump_rope", "recovery"] as const;
const typeLabels: Record<string, string> = { gym: "Gym", tennis: "Tennis", jump_rope: "Jump Rope", recovery: "Recovery" };

const typeBg: Record<string, string> = {
  gym: "bg-blue-500",
  tennis: "bg-yellow-500",
  jump_rope: "bg-purple-500",
  recovery: "bg-green-500",
};
const typeText: Record<string, string> = {
  gym: "text-blue-400",
  tennis: "text-yellow-400",
  jump_rope: "text-purple-400",
  recovery: "text-green-400",
};
const typeBorder: Record<string, string> = {
  gym: "border-blue-500/30",
  tennis: "border-yellow-500/30",
  jump_rope: "border-purple-500/30",
  recovery: "border-green-500/30",
};

const formSchema = z.object({
  date: z.string().min(1),
  type: z.enum(WORKOUT_TYPES),
  durationMin: z.coerce.number().min(1).max(300),
  energyRating: z.coerce.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

// ─── Heatmap calendar ───────────────────────────────────────────────────────
function WorkoutCalendar({ logs }: { logs: WorkoutLog[] }) {
  const today = new Date();
  const start = subMonths(startOfMonth(today), 1);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });

  const workoutByDate: Record<string, WorkoutLog> = {};
  logs.forEach((l) => { workoutByDate[l.date] = l; });

  const weekHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  // Group days into weeks (starting Monday)
  const grid: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  // Pad start
  const firstDayOfWeek = (getDay(start) + 6) % 7; // 0=Mon
  for (let i = 0; i < firstDayOfWeek; i++) week.push(null);
  days.forEach((d) => {
    week.push(d);
    if (week.length === 7) { grid.push(week); week = []; }
  });
  if (week.length) { while (week.length < 7) week.push(null); grid.push(week); }

  return (
    <div data-testid="workout-heatmap">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekHeaders.map((h) => (
          <div key={h} className="text-center text-xs text-muted-foreground">{h}</div>
        ))}
      </div>
      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1 mb-1">
          {week.map((d, di) => {
            if (!d) return <div key={di} className="w-full aspect-square rounded" />;
            const dateStr = format(d, "yyyy-MM-dd");
            const workout = workoutByDate[dateStr];
            const isToday = format(today, "yyyy-MM-dd") === dateStr;
            return (
              <div
                key={di}
                title={workout ? `${typeLabels[workout.type]} — ${workout.durationMin}min` : format(d, "MMM d")}
                className={`w-full aspect-square rounded flex items-center justify-center text-xs font-medium transition-all duration-150
                  ${workout ? `${typeBg[workout.type]}/20 border ${typeBorder[workout.type]}` : "bg-muted/40 border border-border/30"}
                  ${isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}
                `}
              >
                {workout && <div className={`w-2 h-2 rounded-full ${typeBg[workout.type]}`} />}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
        {WORKOUT_TYPES.map((t) => (
          <div key={t} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${typeBg[t]}`} />
            {typeLabels[t]}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkoutsPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("gym");
  const [exerciseRows, setExerciseRows] = useState<{ exerciseId: number; sets: number; reps: number; weight: number }[]>([]);

  const { data: logs = [], isLoading } = useQuery<WorkoutLog[]>({ queryKey: ["/api/workouts"] });
  const { data: exercises = [] } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: exerciseLogs = [] } = useQuery<import("@shared/schema").ExerciseLog[]>({ queryKey: ["/api/exercise-logs"] });
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const addMutation = useMutation({
    mutationFn: async (data: FormValues & { exerciseRows?: { exerciseId: number; sets: number; reps: number; weight: number }[] }) => {
      if (api.hasSupabase()) {
        const workout = await api.addWorkoutLog({
          date: data.date,
          type: data.type,
          durationMin: data.durationMin,
          energyRating: data.energyRating ?? null,
          notes: data.notes ?? null,
        });
        if (data.type === "gym" && data.exerciseRows?.length) {
          for (const row of data.exerciseRows) {
            if (row.exerciseId && (row.reps || row.weight)) {
              await api.addExerciseLog({
                workoutId: workout.id,
                exerciseId: row.exerciseId,
                sets: row.sets || 1,
                reps: row.reps || null,
                weight: row.weight || null,
              });
            }
          }
        }
        return workout;
      }
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data.date, type: data.type, durationMin: data.durationMin, energyRating: data.energyRating, notes: data.notes }),
      });
      if (!res.ok) throw new Error(await res.text());
      const workout = await res.json();
      if (data.type === "gym" && data.exerciseRows?.length) {
        for (const row of data.exerciseRows) {
          if (row.exerciseId && (row.reps || row.weight)) {
            await fetch("/api/exercise-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ workoutId: workout.id, exerciseId: row.exerciseId, sets: row.sets || 1, reps: row.reps || null, weight: row.weight || null }),
            });
          }
        }
      }
      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs"] });
      toast({ title: "Workout logged", description: "Session saved." });
      setShowForm(false);
      setExerciseRows([]);
      reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/workouts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/workouts"] }),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), type: "gym", durationMin: 100, energyRating: 7 },
  });

  const onSubmit = (data: FormValues) => addMutation.mutate({ ...data, exerciseRows: selectedType === "gym" ? exerciseRows : [] });

  const logsByWorkout = (exerciseLogs as { id: number; workoutId: number; exerciseId: number; sets: number; reps: number | null; weight: number | null }[]).reduce(
    (acc, el) => {
      if (!acc[el.workoutId]) acc[el.workoutId] = [];
      acc[el.workoutId].push(el);
      return acc;
    },
    {} as Record<number, { id: number; workoutId: number; exerciseId: number; sets: number; reps: number | null; weight: number | null }[]>
  );
  const getExerciseName = (id: number) => exercises.find((e) => e.id === id)?.name ?? "?";

  // Stats
  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((s, l) => s + l.durationMin, 0);
  const gymSessions = logs.filter((l) => l.type === "gym").length;
  const avgEnergy = logs.filter((l) => l.energyRating).reduce((s, l, _, arr) => s + (l.energyRating ?? 0) / arr.length, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between fade-slide-up pt-1">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" /> Workouts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">5-6 gym sessions + tennis + jump rope per week</p>
        </div>
        <Button data-testid="button-log-workout" onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Log Session
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glow-border rounded-xl bg-card p-5 fade-slide-up" data-testid="workout-form">
          <h2 className="text-sm font-semibold text-foreground mb-4">New Workout Session</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" data-testid="input-workout-date" {...register("date")} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select
                  defaultValue="gym"
                  onValueChange={(v) => { setSelectedType(v); setValue("type", v as any); }}
                  data-testid="select-workout-type"
                >
                  <SelectTrigger className="bg-secondary border-border" data-testid="select-workout-type-trigger">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {WORKOUT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Duration (min)</Label>
                <Input type="number" placeholder="60" data-testid="input-duration" {...register("durationMin")} className="bg-secondary border-border" />
                {errors.durationMin && <p className="text-xs text-red-400">{errors.durationMin.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Energy (1-10)</Label>
                <Input type="number" min={1} max={10} placeholder="7" data-testid="input-energy" {...register("energyRating")} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input placeholder="Chest + triceps, hit new bench PR..." data-testid="input-notes" {...register("notes")} className="bg-secondary border-border" />
            </div>
            {selectedType === "gym" && exercises.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                <Label className="text-xs">Exercises (optional)</Label>
                {exerciseRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Exercise</Label>
                      <Select
                        value={String(row.exerciseId)}
                        onValueChange={(v) => setExerciseRows((prev) => prev.map((r, j) => (j === i ? { ...r, exerciseId: Number(v) } : r)))}
                      >
                        <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {exercises.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Sets</Label>
                      <Input type="number" min={1} value={row.sets} onChange={(e) => setExerciseRows((prev) => prev.map((r, j) => (j === i ? { ...r, sets: Number(e.target.value) || 1 } : r)))} className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Reps</Label>
                      <Input type="number" value={row.reps || ""} onChange={(e) => setExerciseRows((prev) => prev.map((r, j) => (j === i ? { ...r, reps: Number(e.target.value) || 0 } : r)))} placeholder="8" className="bg-secondary border-border" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Weight (kg)</Label>
                      <Input type="number" step="2.5" value={row.weight || ""} onChange={(e) => setExerciseRows((prev) => prev.map((r, j) => (j === i ? { ...r, weight: Number(e.target.value) || 0 } : r)))} placeholder="80" className="bg-secondary border-border" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setExerciseRows((prev) => prev.filter((_, j) => j !== i))}>Remove</Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => setExerciseRows((prev) => [...prev, { exerciseId: exercises[0]?.id ?? 0, sets: 3, reps: 8, weight: 0 }])}>
                  + Add exercise
                </Button>
              </div>
            )}
            <div className="flex gap-3">
              <Button type="submit" data-testid="button-submit-workout" disabled={addMutation.isPending} size="sm">
                {addMutation.isPending ? "Saving..." : "Save Session"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total sessions", value: totalWorkouts, icon: Dumbbell, color: "text-primary" },
          { label: "Total hours", value: `${Math.round(totalMinutes / 60)}h`, icon: Clock, color: "text-warning" },
          { label: "Gym sessions", value: gymSessions, icon: Zap, color: "text-blue-400" },
          { label: "Avg energy", value: avgEnergy ? avgEnergy.toFixed(1) + "/10" : "—", icon: Zap, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glow-border rounded-xl bg-card p-4 flex items-center gap-3 fade-slide-up" data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar heatmap */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-2" data-testid="heatmap-section">
        <h2 className="text-sm font-semibold text-foreground mb-4">Training Calendar (last 2 months)</h2>
        <WorkoutCalendar logs={logs} />
      </div>

      {/* Session history */}
      <div className="glow-border rounded-xl bg-card overflow-hidden fade-slide-up stagger-3" data-testid="workouts-table">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Session History</h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-12 rounded" />)}
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No sessions yet. Log your first workout!</div>
          ) : (
            sortedLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors"
                data-testid={`workout-row-${log.id}`}
              >
                <div className={`px-2.5 py-1 rounded-md text-xs font-semibold ${typeText[log.type]} bg-secondary/60 border ${typeBorder[log.type]}`}>
                  {typeLabels[log.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{format(parseISO(log.date), "EEE, MMM d")}</span>
                    <span className="text-xs text-muted-foreground">{log.durationMin} min</span>
                    {log.energyRating && (
                      <span className="text-xs text-warning font-medium">⚡ {log.energyRating}/10</span>
                    )}
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.notes}</p>
                  )}
                  {log.type === "gym" && logsByWorkout[log.id]?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {logsByWorkout[log.id].map((el) => (
                        <span key={el.id} className="text-xs text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                          {getExerciseName(el.exerciseId)}: {el.sets}x{el.reps ?? "?"} @ {el.weight ?? "?"}kg
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  data-testid={`button-delete-workout-${log.id}`}
                  onClick={() => deleteMutation.mutate(log.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
