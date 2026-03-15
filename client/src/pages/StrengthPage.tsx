import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, TrendingUp, Trophy, ArrowUp } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Exercise, ExerciseLog } from "@shared/schema";
import type { WorkoutLog } from "@shared/schema";

const COLORS = ["hsl(186,90%,42%)", "hsl(38,90%,55%)", "hsl(262,83%,68%)", "hsl(142,70%,45%)", "hsl(0,72%,51%)"];

function StrengthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.stroke }} className="font-semibold">
          {p.name}: {p.value} kg
        </p>
      ))}
    </div>
  );
}

export default function StrengthPage() {
  const { toast } = useToast();
  const [showAddExercise, setShowAddExercise] = useState(false);

  const { data: exercises = [] } = useQuery<Exercise[]>({ queryKey: ["/api/exercises"] });
  const { data: exerciseLogs = [] } = useQuery<ExerciseLog[]>({ queryKey: ["/api/exercise-logs"] });
  const { data: workouts = [] } = useQuery<WorkoutLog[]>({ queryKey: ["/api/workouts"] });

  const addExerciseMutation = useMutation({
    mutationFn: (data: { name: string; category?: string; unit?: string }) =>
      apiRequest("POST", "/api/exercises", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({ title: "Exercise added", description: "You can now log this exercise in workouts." });
      setShowAddExercise(false);
      reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to add exercise.", variant: "destructive" }),
  });

  const deleteExerciseMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/exercises/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/exercises"] }),
  });

  const addExerciseSchema = z.object({ name: z.string().min(1, "Name required"), category: z.string().optional(), unit: z.string().optional() });
  const { register, handleSubmit, reset } = useForm<z.infer<typeof addExerciseSchema>>({
    resolver: zodResolver(addExerciseSchema),
    defaultValues: { name: "", category: "compound", unit: "kg" },
  });

  const workoutById = Object.fromEntries(workouts.map((w) => [w.id, w]));
  const logsWithDate = (exerciseLogs as (ExerciseLog & { date?: string })[]).map((el) => ({
    ...el,
    date: workoutById[el.workoutId]?.date,
  })).filter((el) => el.date);

  // Per-exercise: PR (max weight), first weight, trend data
  const exerciseStats = exercises.map((ex, i) => {
    const logs = logsWithDate.filter((l) => l.exerciseId === ex.id && l.weight != null);
    const sorted = [...logs].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
    const weights = sorted.map((l) => l.weight!).filter(Boolean);
    const current = weights.length ? Math.max(...weights) : null;
    const first = weights.length ? weights[0] : null;
    const gained = current && first ? (current - first).toFixed(1) : null;
    const chartData = sorted.map((l) => ({
      date: format(parseISO(l.date!), "MMM d"),
      [ex.name]: l.weight,
    }));
    return {
      exercise: ex,
      color: COLORS[i % COLORS.length],
      current,
      first,
      gained,
      chartData,
    };
  });

  // Combined chart data (all exercises)
  const allDates = [...new Set(logsWithDate.map((l) => l.date).filter(Boolean))].sort();
  const chartData = allDates.slice(-20).map((d) => {
    const point: Record<string, string | number | null> = { date: format(parseISO(d!), "MMM d") };
    exercises.forEach((ex) => {
      const log = logsWithDate.find((l) => l.exerciseId === ex.id && l.date === d);
      point[ex.name] = log?.weight ?? null;
    });
    return point;
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between fade-slide-up pt-1">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Strength Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track progress on your custom exercises</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Add exercise
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add custom exercise</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit((d) => addExerciseMutation.mutate(d))} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Exercise name</Label>
                  <Input {...register("name")} placeholder="e.g. Squat" className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Input {...register("category")} placeholder="compound, isolation, cardio" className="bg-secondary border-border" />
                </div>
                <div className="space-y-1.5">
                  <Label>Unit</Label>
                  <Input {...register("unit")} placeholder="kg, reps, time" className="bg-secondary border-border" />
                </div>
                <Button type="submit" disabled={addExerciseMutation.isPending}>
                  {addExerciseMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button size="sm" className="gap-2" onClick={() => window.location.hash = "#/workouts"}>
            <Plus className="w-4 h-4" /> Log session
          </Button>
        </div>
      </div>

      {/* PR cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {exerciseStats.map(({ exercise, color, current, gained }) => (
          <div
            key={exercise.id}
            className="glow-border rounded-xl bg-card p-5 fade-slide-up flex flex-col"
            data-testid={`pr-card-${exercise.id}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{exercise.name}</p>
                <p className="text-2xl font-bold tabular-nums mt-1" style={{ color }}>
                  {current ?? "—"}
                  <span className="text-sm font-normal text-muted-foreground ml-1">{exercise.unit}</span>
                </p>
              </div>
              <div className="flex gap-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="w-4 h-4 text-warning" />
                </div>
                <button
                  onClick={() => deleteExerciseMutation.mutate(exercise.id)}
                  className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {gained && (
              <div className="flex justify-between text-xs pt-2 border-t border-border">
                <span className="text-muted-foreground">Gained</span>
                <span className="text-green-400 font-semibold flex items-center gap-1">
                  <ArrowUp className="w-3 h-3" />{gained} {exercise.unit}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {exercises.length === 0 && (
        <div className="glow-border rounded-xl bg-card p-8 text-center text-muted-foreground fade-slide-up">
          <p className="mb-4">No exercises yet. Add your first exercise to start tracking strength progress.</p>
          <Button onClick={() => setShowAddExercise(true)}>Add exercise</Button>
        </div>
      )}

      {/* Strength trend chart */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-2" data-testid="strength-chart">
        <h2 className="text-sm font-semibold text-foreground mb-4">Strength Trends</h2>
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Log gym workouts with exercises to see your progress here.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,10%,15%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<StrengthTooltip />} wrapperStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)" }} />
              <Legend wrapperStyle={{ fontSize: 11, color: "hsl(210,10%,55%)" }} />
              {exercises.map((ex, i) => (
                <Line
                  key={ex.id}
                  type="monotone"
                  dataKey={ex.name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: COLORS[i % COLORS.length] }}
                  activeDot={{ r: 6 }}
                  connectNulls
                  animationDuration={1000}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
