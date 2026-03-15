import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import * as api from "@/lib/supabaseApi";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths } from "date-fns";
import { Plus, Trash2, Dumbbell, Clock, Zap, Pencil, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { WorkoutLog, Exercise, ExerciseLog } from "@shared/schema";
import type { SetData } from "@shared/schema";

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

type ExerciseRow = {
  id?: number; // existing exercise log id when editing
  exerciseId: number;
  sets: { reps?: number; weight?: number }[];
};

// ─── Heatmap calendar ───────────────────────────────────────────────────────
function WorkoutCalendar({ logs }: { logs: WorkoutLog[] }) {
  const today = new Date();
  const start = subMonths(startOfMonth(today), 1);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });

  const workoutByDate: Record<string, WorkoutLog> = {};
  logs.forEach((l) => { workoutByDate[l.date] = l; });

  const weekHeaders = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const grid: (Date | null)[][] = [];
  let week: (Date | null)[] = [];
  const firstDayOfWeek = (getDay(start) + 6) % 7;
  for (let i = 0; i < firstDayOfWeek; i++) week.push(null);
  days.forEach((d) => {
    week.push(d);
    if (week.length === 7) { grid.push(week); week = []; }
  });
  if (week.length) { while (week.length < 7) week.push(null); grid.push(week); }

  return (
    <div data-testid="workout-heatmap" className="max-w-[280px]">
      <div className="grid grid-cols-7 gap-0.5 mb-0.5">
        {weekHeaders.map((h) => (
          <div key={h} className="text-center text-[10px] text-muted-foreground">{h}</div>
        ))}
      </div>
      {grid.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-0.5 mb-0.5">
          {week.map((d, di) => {
            if (!d) return <div key={di} className="w-8 h-8 rounded" />;
            const dateStr = format(d, "yyyy-MM-dd");
            const workout = workoutByDate[dateStr];
            const isToday = format(today, "yyyy-MM-dd") === dateStr;
            return (
              <div
                key={di}
                title={workout ? `${typeLabels[workout.type]} — ${workout.durationMin}min` : format(d, "MMM d")}
                className={`w-8 h-8 rounded flex items-center justify-center transition-all duration-150
                  ${workout ? `${typeBg[workout.type]}/20 border ${typeBorder[workout.type]}` : "bg-muted/40 border border-border/30"}
                  ${isToday ? "ring-1 ring-primary ring-offset-1 ring-offset-background" : ""}
                `}
              >
                {workout && <div className={`w-1.5 h-1.5 rounded-full ${typeBg[workout.type]}`} />}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex gap-3 mt-1.5 text-[10px] text-muted-foreground flex-wrap">
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
  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<string>("gym");
  const [exerciseRows, setExerciseRows] = useState<ExerciseRow[]>([]);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [createExerciseForRow, setCreateExerciseForRow] = useState<number | null>(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [showEndWorkout, setShowEndWorkout] = useState<WorkoutLog | null>(null);

  const { data: logs = [], isLoading } = useQuery<WorkoutLog[]>({ queryKey: ["/api/workouts"] });
  const { data: exercises = [], refetch: refetchExercises } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: exerciseLogs = [] } = useQuery<ExerciseLog[]>({ queryKey: ["/api/exercise-logs"] });
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const addMutation = useMutation({
    mutationFn: async (data: FormValues & { exerciseRows?: ExerciseRow[] }) => {
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
            const hasData = row.sets.some((s) => s.reps != null || s.weight != null);
            if (row.exerciseId && hasData) {
              const setsData: SetData = row.sets.filter((s) => s.reps != null || s.weight != null);
              await api.addExerciseLog({
                workoutId: workout.id,
                exerciseId: row.exerciseId,
                sets: setsData.length || 1,
                reps: setsData[0]?.reps ?? null,
                weight: setsData[0]?.weight ?? null,
                setsData: setsData.length > 0 ? setsData : undefined,
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
          const hasData = row.sets.some((s) => s.reps != null || s.weight != null);
          if (row.exerciseId && hasData) {
            const setsData: SetData = row.sets.filter((s) => s.reps != null || s.weight != null);
            await fetch("/api/exercise-logs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                workoutId: workout.id,
                exerciseId: row.exerciseId,
                sets: setsData.length || 1,
                reps: setsData[0]?.reps ?? null,
                weight: setsData[0]?.weight ?? null,
                setsData: setsData.length > 0 ? setsData : undefined,
              }),
            });
          }
        }
      }
      return workout;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs"] });
      toast({ title: "Workout logged", description: "Session saved. Add more exercises or End Workout when done." });
      setShowForm(false);
      setExerciseRows([]);
      setEditingWorkoutId(null);
      reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ workoutId, data, exerciseRows: rows }: { workoutId: number; data: FormValues; exerciseRows: ExerciseRow[] }) => {
      if (api.hasSupabase()) {
        await api.updateWorkoutLog(workoutId, {
          date: data.date,
          type: data.type,
          durationMin: data.durationMin,
          energyRating: data.energyRating ?? null,
          notes: data.notes ?? null,
        });
        const existingLogs = (exerciseLogs as ExerciseLog[]).filter((el) => el.workoutId === workoutId);
        for (const el of existingLogs) {
          const row = rows.find((r) => r.id === el.id);
          if (!row) await api.deleteExerciseLog(el.id);
        }
        for (const row of rows) {
          const setsData: SetData = row.sets.filter((s) => s.reps != null || s.weight != null);
          if (!row.exerciseId || setsData.length === 0) continue;
          const payload = {
            workoutId,
            exerciseId: row.exerciseId,
            sets: setsData.length || 1,
            reps: setsData[0]?.reps ?? null,
            weight: setsData[0]?.weight ?? null,
            setsData: setsData.length > 0 ? setsData : undefined,
          };
          if (row.id) {
            await api.updateExerciseLog(row.id, payload);
          } else {
            await api.addExerciseLog(payload);
          }
        }
        return { id: workoutId };
      }
      const res = await apiRequest("PATCH", `/api/workouts/${workoutId}`, {
        date: data.date,
        type: data.type,
        durationMin: data.durationMin,
        energyRating: data.energyRating,
        notes: data.notes,
      });
      if (!res.ok) throw new Error(await res.text());
      const existingLogs = (exerciseLogs as ExerciseLog[]).filter((el) => el.workoutId === workoutId);
      for (const el of existingLogs) {
        const row = rows.find((r) => r.id === el.id);
        if (!row) await apiRequest("DELETE", `/api/exercise-logs/${el.id}`);
      }
      for (const row of rows) {
        const setsData: SetData = row.sets.filter((s) => s.reps != null || s.weight != null);
        if (!row.exerciseId || setsData.length === 0) continue;
        const payload = {
          workoutId,
          exerciseId: row.exerciseId,
          sets: setsData.length || 1,
          reps: setsData[0]?.reps ?? null,
          weight: setsData[0]?.weight ?? null,
          setsData: setsData.length > 0 ? setsData : undefined,
        };
        if (row.id) {
          await apiRequest("PATCH", `/api/exercise-logs/${row.id}`, payload);
        } else {
          await apiRequest("POST", "/api/exercise-logs", payload);
        }
      }
      return { id: workoutId };
    },
    onSuccess: (_, { workoutId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-logs"] });
      toast({ title: "Session updated", description: "Changes saved." });
      setShowForm(false);
      setExerciseRows([]);
      setEditingWorkoutId(null);
      reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to update.", variant: "destructive" }),
  });

  const finishMutation = useMutation({
    mutationFn: async (workoutId: number) => {
      if (api.hasSupabase()) {
        return api.updateWorkoutLog(workoutId, { finishedAt: new Date().toISOString() });
      }
      const res = await apiRequest("PATCH", `/api/workouts/${workoutId}`, { finishedAt: new Date().toISOString() });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({ title: "Workout finished", description: "Great session!" });
      setShowEndWorkout(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to mark as finished.", variant: "destructive" }),
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (name: string) => {
      if (api.hasSupabase()) {
        return api.addExercise({ name, category: "compound", unit: "kg" });
      }
      const res = await apiRequest("POST", "/api/exercises", { name, category: "compound", unit: "kg" });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: async (exercise) => {
      await refetchExercises();
      if (createExerciseForRow != null) {
        setExerciseRows((prev) =>
          prev.map((r, i) =>
            i === createExerciseForRow ? { ...r, exerciseId: exercise.id } : r
          )
        );
      }
      setShowCreateExercise(false);
      setNewExerciseName("");
      setCreateExerciseForRow(null);
      toast({ title: "Exercise created", description: `"${exercise.name}" added.` });
    },
    onError: () => toast({ title: "Error", description: "Failed to create exercise.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/workouts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/workouts"] }),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), type: "gym", durationMin: 100, energyRating: 7 },
  });

  const openEditForm = (log: WorkoutLog) => {
    const logsForWorkout = (exerciseLogs as ExerciseLog[]).filter((el) => el.workoutId === log.id);
    setEditingWorkoutId(log.id);
    setValue("date", log.date);
    setValue("type", log.type);
    setValue("durationMin", log.durationMin);
    setValue("energyRating", log.energyRating ?? 7);
    setValue("notes", log.notes ?? "");
    setSelectedType(log.type);
    setExerciseRows(
      logsForWorkout.map((el) => {
        const setsData = (el as { setsData?: SetData }).setsData;
        const sets =
          setsData && Array.isArray(setsData) && setsData.length > 0
            ? setsData.map((s) => ({ reps: s.reps, weight: s.weight }))
            : [{ reps: el.reps ?? undefined, weight: el.weight ?? undefined }];
        return { id: el.id, exerciseId: el.exerciseId, sets };
      })
    );
    setShowForm(true);
  };

  const onSubmit = (data: FormValues) => {
    if (editingWorkoutId) {
      updateMutation.mutate({ workoutId: editingWorkoutId, data, exerciseRows: selectedType === "gym" ? exerciseRows : [] });
    } else {
      addMutation.mutate({ ...data, exerciseRows: selectedType === "gym" ? exerciseRows : [] });
    }
  };

  const addSet = (rowIndex: number) => {
    setExerciseRows((prev) =>
      prev.map((r, i) => (i === rowIndex ? { ...r, sets: [...r.sets, {}] } : r))
    );
  };
  const removeSet = (rowIndex: number, setIndex: number) => {
    setExerciseRows((prev) =>
      prev.map((r, i) =>
        i === rowIndex ? { ...r, sets: r.sets.filter((_, j) => j !== setIndex) } : r
      )
    );
  };
  const updateSet = (rowIndex: number, setIndex: number, field: "reps" | "weight", value: number) => {
    setExerciseRows((prev) =>
      prev.map((r, i) => {
        if (i !== rowIndex) return r;
        const newSets = [...r.sets];
        newSets[setIndex] = { ...newSets[setIndex], [field]: value };
        return { ...r, sets: newSets };
      })
    );
  };

  const logsByWorkout = (exerciseLogs as (ExerciseLog & { setsData?: SetData })[]).reduce(
    (acc, el) => {
      if (!acc[el.workoutId]) acc[el.workoutId] = [];
      acc[el.workoutId].push(el);
      return acc;
    },
    {} as Record<number, (ExerciseLog & { setsData?: SetData })[]>
  );
  const getExerciseName = (id: number) => exercises.find((e) => e.id === id)?.name ?? "?";

  const formatExerciseLog = (el: ExerciseLog & { setsData?: SetData }) => {
    const setsData = el.setsData;
    if (setsData && Array.isArray(setsData) && setsData.length > 0) {
      return setsData.map((s) => `${s.reps ?? "?"}×${s.weight ?? "?"}kg`).join(", ");
    }
    return `${el.sets}x${el.reps ?? "?"} @ ${el.weight ?? "?"}kg`;
  };

  const totalWorkouts = logs.length;
  const totalMinutes = logs.reduce((s, l) => s + l.durationMin, 0);
  const gymSessions = logs.filter((l) => l.type === "gym").length;
  const avgEnergy = logs.filter((l) => l.energyRating).reduce((s, l, _, arr) => s + (l.energyRating ?? 0) / arr.length, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between fade-slide-up pt-1">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" /> Workouts
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">5-6 gym sessions + tennis + jump rope per week</p>
        </div>
        <Button data-testid="button-log-workout" onClick={() => { setEditingWorkoutId(null); setExerciseRows([]); setShowForm(!showForm); }} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Log Session
        </Button>
      </div>

      {showForm && (
        <div className="glow-border rounded-xl bg-card p-5 fade-slide-up" data-testid="workout-form">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            {editingWorkoutId ? "Edit Workout Session" : "New Workout Session"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" data-testid="input-workout-date" {...register("date")} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Type</Label>
                <Select
                  value={selectedType}
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
                <Input type="number" placeholder="100" data-testid="input-duration" {...register("durationMin")} className="bg-secondary border-border" />
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
            {selectedType === "gym" && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Exercises (optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (exercises.length === 0) {
                        setCreateExerciseForRow(exerciseRows.length);
                        setExerciseRows((prev) => [...prev, { exerciseId: 0, sets: [{}] }]);
                        setShowCreateExercise(true);
                      } else {
                        setExerciseRows((prev) => [...prev, { exerciseId: exercises[0]?.id ?? 0, sets: [{}] }]);
                      }
                    }}
                  >
                    + Add exercise
                  </Button>
                </div>
                {exerciseRows.map((row, i) => (
                  <div key={i} className="rounded-lg border border-border p-3 space-y-2 bg-secondary/30">
                    <div className="flex items-end justify-between gap-3 flex-wrap">
                      <div className="flex items-end gap-2 flex-1 min-w-[180px]">
                        <div className="space-y-1 flex-1">
                          <Label className="text-xs">Exercise</Label>
                          <Select
                            value={row.exerciseId ? String(row.exerciseId) : ""}
                            onValueChange={(v) => {
                              if (v === "__create__") {
                                setCreateExerciseForRow(i);
                                setShowCreateExercise(true);
                              } else {
                                setExerciseRows((prev) => prev.map((r, j) => (j === i ? { ...r, exerciseId: Number(v) } : r)));
                              }
                            }}
                          >
                            <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Select exercise" /></SelectTrigger>
                            <SelectContent>
                              {exercises.map((e) => (
                                <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                              ))}
                              <SelectItem value="__create__" className="text-primary font-medium">
                                + Create new exercise
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => { setCreateExerciseForRow(i); setShowCreateExercise(true); }}
                        >
                          + New
                        </Button>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setExerciseRows((prev) => prev.filter((_, j) => j !== i))}>Remove</Button>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="text-xs">Sets (reps × weight per set)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => addSet(i)}>+ Add set</Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        {row.sets.map((set, si) => (
                          <div key={si} className="flex items-center gap-1">
                            <Input
                              type="number"
                              placeholder="Reps"
                              value={set.reps ?? ""}
                              onChange={(e) => updateSet(i, si, "reps", Number(e.target.value) || 0)}
                              className="bg-secondary border-border h-8 text-sm"
                            />
                            <span className="text-muted-foreground">×</span>
                            <Input
                              type="number"
                              step={2.5}
                              placeholder="kg"
                              value={set.weight ?? ""}
                              onChange={(e) => updateSet(i, si, "weight", Number(e.target.value) || 0)}
                              className="bg-secondary border-border h-8 text-sm"
                            />
                            {row.sets.length > 1 && (
                              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeSet(i, si)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {row.sets.length === 0 && (
                          <Button type="button" variant="outline" size="sm" onClick={() => addSet(i)}>Add set</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <Button type="submit" data-testid="button-submit-workout" disabled={addMutation.isPending || updateMutation.isPending} size="sm">
                {addMutation.isPending || updateMutation.isPending ? "Saving..." : editingWorkoutId ? "Save Changes" : "Save Session"}
              </Button>
              {editingWorkoutId && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="gap-2"
                  onClick={() => {
                    const log = sortedLogs.find((l) => l.id === editingWorkoutId);
                    if (log) setShowEndWorkout(log);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4" /> End Workout
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); setEditingWorkoutId(null); setExerciseRows([]); }}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Create exercise dialog */}
      <Dialog open={showCreateExercise} onOpenChange={setShowCreateExercise}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new exercise</DialogTitle>
            <DialogDescription>Add a custom exercise to use in your workouts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Exercise name</Label>
            <Input
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              placeholder="e.g. Bulgarian Split Squat"
              className="bg-secondary border-border"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateExercise(false)}>Cancel</Button>
            <Button onClick={() => newExerciseName.trim() && createExerciseMutation.mutate(newExerciseName.trim())} disabled={!newExerciseName.trim() || createExerciseMutation.isPending}>
              {createExerciseMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End workout summary dialog */}
      <Dialog open={!!showEndWorkout} onOpenChange={(open) => !open && setShowEndWorkout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Workout</DialogTitle>
            <DialogDescription>Mark this session as finished. Summary below.</DialogDescription>
          </DialogHeader>
          {showEndWorkout && (
            <div className="space-y-3">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-sm font-medium">{format(parseISO(showEndWorkout.date), "EEEE, MMM d")}</p>
                <p className="text-xs text-muted-foreground">{typeLabels[showEndWorkout.type]} · {showEndWorkout.durationMin} min</p>
                {showEndWorkout.energyRating && <p className="text-xs text-warning mt-1">Energy: {showEndWorkout.energyRating}/10</p>}
              </div>
              {logsByWorkout[showEndWorkout.id]?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Exercises</p>
                  <ul className="text-sm space-y-1">
                    {logsByWorkout[showEndWorkout.id].map((el) => (
                      <li key={el.id}>{getExerciseName(el.exerciseId)}: {formatExerciseLog(el)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEndWorkout(null)}>Cancel</Button>
            <Button onClick={() => showEndWorkout && finishMutation.mutate(showEndWorkout.id)} disabled={finishMutation.isPending}>
              {finishMutation.isPending ? "Finishing..." : "Mark as Finished"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-2" data-testid="heatmap-section">
        <h2 className="text-sm font-semibold text-foreground mb-4">Training Calendar (last 2 months)</h2>
        <WorkoutCalendar logs={logs} />
      </div>

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
                    {(log as WorkoutLog & { finishedAt?: string }).finishedAt && (
                      <span className="text-xs text-green-400 font-medium">✓ Finished</span>
                    )}
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
                          {getExerciseName(el.exerciseId)}: {formatExerciseLog(el)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    data-testid={`button-edit-workout-${log.id}`}
                    onClick={() => openEditForm(log)}
                    className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex-shrink-0"
                    title="Edit session"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    data-testid={`button-delete-workout-${log.id}`}
                    onClick={() => deleteMutation.mutate(log.id)}
                    className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
