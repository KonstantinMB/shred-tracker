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
  ReferenceLine,
} from "recharts";
import { format, parseISO } from "date-fns";
import { Plus, Trash2, Scale, TrendingDown, Target } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { WeightLog } from "@shared/schema";

const WEIGHT_START = 94;
const WEIGHT_TARGET = 84;

const formSchema = z.object({
  date: z.string().min(1, "Date required"),
  weight: z.coerce.number().min(50).max(200),
  waist: z.coerce.number().min(50).max(200).optional(),
});
type FormValues = z.infer<typeof formSchema>;

function WeightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value} {p.name === "Waist" ? "cm" : "kg"}
        </p>
      ))}
    </div>
  );
}

export default function WeightPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { data: logs = [], isLoading } = useQuery<WeightLog[]>({ queryKey: ["/api/weight"] });

  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const addMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/weight", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight"] });
      toast({ title: "Weight logged", description: "Entry saved successfully." });
      setShowForm(false);
      reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to save entry.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/weight/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/weight"] });
      toast({ title: "Deleted", description: "Entry removed." });
    },
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), weight: undefined, waist: undefined },
  });

  const onSubmit = (data: FormValues) => addMutation.mutate(data);

  // Chart data
  const chartData = sortedLogs
    .slice(0, 84)
    .reverse()
    .map((w) => ({
      date: format(parseISO(w.date), "MMM d"),
      Actual: w.weight,
      Waist: w.waist ?? null,
      Projected: parseFloat(
        (WEIGHT_START - ((WEIGHT_START - WEIGHT_TARGET) * sortedLogs.indexOf(w)) / 84).toFixed(1)
      ),
    }));

  const latestWeight = sortedLogs[0]?.weight;
  const lostKg = latestWeight ? (WEIGHT_START - latestWeight).toFixed(1) : "0";
  const remainingKg = latestWeight ? (latestWeight - WEIGHT_TARGET).toFixed(1) : "—";
  const progressPct = latestWeight ? Math.round(((WEIGHT_START - latestWeight) / (WEIGHT_START - WEIGHT_TARGET)) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between fade-slide-up pt-1">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Weight Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Log daily weight · track your cut progress</p>
        </div>
        <Button
          data-testid="button-log-weight"
          onClick={() => setShowForm(!showForm)}
          className="gap-2"
          size="sm"
        >
          <Plus className="w-4 h-4" /> Log Weight
        </Button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="glow-border rounded-xl bg-card p-5 fade-slide-up" data-testid="weight-form">
          <h2 className="text-sm font-semibold text-foreground mb-4">New Weight Entry</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="weight-date" className="text-xs">Date</Label>
              <Input
                id="weight-date"
                type="date"
                data-testid="input-date"
                {...register("date")}
                className="bg-secondary border-border"
              />
              {errors.date && <p className="text-xs text-red-400">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="weight-val" className="text-xs">Weight (kg)</Label>
              <Input
                id="weight-val"
                type="number"
                step="0.1"
                placeholder="88.5"
                data-testid="input-weight"
                {...register("weight")}
                className="bg-secondary border-border"
              />
              {errors.weight && <p className="text-xs text-red-400">{errors.weight.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="waist-val" className="text-xs">Waist (cm, optional)</Label>
              <Input
                id="waist-val"
                type="number"
                step="0.5"
                placeholder="87"
                data-testid="input-waist"
                {...register("waist")}
                className="bg-secondary border-border"
              />
            </div>
            <div className="col-span-1 sm:col-span-3 flex gap-3">
              <Button type="submit" data-testid="button-submit-weight" disabled={addMutation.isPending} size="sm">
                {addMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Lost so far", value: `${lostKg} kg`, icon: TrendingDown, color: "text-green-400" },
          { label: "Current weight", value: latestWeight ? `${latestWeight} kg` : "—", icon: Scale, color: "text-primary" },
          { label: "To goal", value: `${remainingKg} kg`, icon: Target, color: "text-warning" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glow-border rounded-xl bg-card p-4 flex items-center gap-3 fade-slide-up">
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

      {/* Chart */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-2" data-testid="weight-trend-chart">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Weight Trend</h2>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 bg-primary rounded" />Actual</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 border-t border-dashed border-muted-foreground" />Projected</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>94 kg</span>
            <span className="text-primary font-medium">{progressPct}% complete</span>
            <span>84 kg</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,10%,15%)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }}
              tickLine={false}
              axisLine={false}
              interval={Math.max(1, Math.floor(chartData.length / 10))}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<WeightTooltip />} />
            <ReferenceLine y={WEIGHT_TARGET} stroke="hsl(142,70%,45%)" strokeDasharray="4 4" label={{ value: "Goal 84kg", position: "insideRight", fontSize: 9, fill: "hsl(142,70%,45%)" }} />
            <Line type="monotone" dataKey="Projected" stroke="hsl(220,10%,35%)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} animationDuration={800} />
            <Line type="monotone" dataKey="Actual" stroke="hsl(186,90%,42%)" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} animationDuration={1000} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Log table */}
      <div className="glow-border rounded-xl bg-card overflow-hidden fade-slide-up stagger-3" data-testid="weight-table">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Weight Log</h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="p-6 space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="skeleton h-8 rounded" />
              ))}
            </div>
          ) : sortedLogs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No entries yet. Log your first weight!</div>
          ) : (
            sortedLogs.map((log, i) => {
              const prev = sortedLogs[i + 1];
              const diff = prev ? log.weight - prev.weight : null;
              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-secondary/30 transition-colors"
                  data-testid={`weight-row-${log.id}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground w-24">{format(parseISO(log.date), "EEE, MMM d")}</span>
                    <span className="text-sm font-semibold text-foreground tabular-nums">{log.weight} kg</span>
                    {log.waist && <span className="text-xs text-muted-foreground">{log.waist} cm waist</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    {diff !== null && (
                      <span className={`text-xs font-medium tabular-nums ${diff < 0 ? "text-green-400" : diff > 0 ? "text-red-400" : "text-muted-foreground"}`}>
                        {diff < 0 ? "↓" : diff > 0 ? "↑" : "→"} {Math.abs(diff).toFixed(1)} kg
                      </span>
                    )}
                    <button
                      data-testid={`button-delete-weight-${log.id}`}
                      onClick={() => deleteMutation.mutate(log.id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
