import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { format, parseISO, subDays } from "date-fns";
import { Plus, Trash2, Utensils, Flame, Beef, Wheat, Droplets, Moon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { NutritionLog } from "@shared/schema";

const TARGETS = { calories: 2500, protein: 210, carbs: 240, fat: 78, steps: 10000, water: 3.0, sleep: 8 };

const formSchema = z.object({
  date: z.string().min(1, "Date required"),
  calories: z.coerce.number().min(0).max(6000),
  protein: z.coerce.number().min(0).max(500),
  carbs: z.coerce.number().min(0).max(800),
  fat: z.coerce.number().min(0).max(300),
  steps: z.coerce.number().min(0).max(50000).optional(),
  water: z.coerce.number().min(0).max(10).optional(),
  sleep: z.coerce.number().min(0).max(14).optional(),
});
type FormValues = z.infer<typeof formSchema>;

function NutritionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill || p.color }} className="font-semibold">
          {p.name}: {p.value} {p.name === "Calories" ? "kcal" : p.name === "Protein" || p.name === "Carbs" || p.name === "Fat" ? "g" : ""}
        </p>
      ))}
    </div>
  );
}

function MacroBar({ label, value, target, color, unit = "g" }: { label: string; value: number; target: number; color: string; unit?: string }) {
  const pct = Math.min((value / target) * 100, 100);
  const status = value >= target * 0.9 && value <= target * 1.1;
  return (
    <div className="space-y-1" data-testid={`macro-bar-${label.toLowerCase()}`}>
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={status ? "text-green-400 font-semibold" : "text-foreground font-semibold"}>
          {value} / {target}{unit}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full fill-animate transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function NutritionPage() {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { data: logs = [], isLoading } = useQuery<NutritionLog[]>({ queryKey: ["/api/nutrition"] });

  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const last7 = sortedLogs.slice(0, 7).reverse();

  const addMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/nutrition", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition"] });
      toast({ title: "Nutrition logged", description: "Entry saved." });
      setShowForm(false);
      reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/nutrition/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/nutrition"] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      calories: 2500, protein: 210, carbs: 240, fat: 78,
      steps: 10000, water: 3.0, sleep: 8,
    },
  });

  const onSubmit = (data: FormValues) => addMutation.mutate(data);

  // Weekly averages
  const weeklyAvg = last7.length
    ? {
        calories: Math.round(last7.reduce((s, l) => s + l.calories, 0) / last7.length),
        protein: Math.round(last7.reduce((s, l) => s + l.protein, 0) / last7.length),
        carbs: Math.round(last7.reduce((s, l) => s + l.carbs, 0) / last7.length),
        fat: Math.round(last7.reduce((s, l) => s + l.fat, 0) / last7.length),
        steps: Math.round(last7.reduce((s, l) => s + (l.steps ?? 0), 0) / last7.length),
      }
    : null;

  const chartData = last7.map((l) => ({
    date: format(parseISO(l.date), "EEE"),
    Calories: l.calories,
    Protein: l.protein,
    Carbs: l.carbs,
    Fat: l.fat,
  }));

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLog = sortedLogs.find((l) => l.date === today);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between fade-slide-up pt-1">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Utensils className="w-5 h-5 text-primary" /> Nutrition Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Target: 2,500 kcal · 210g protein · 240g carbs · 78g fat</p>
        </div>
        <Button data-testid="button-log-nutrition" onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Log Nutrition
        </Button>
      </div>

      {/* Log form */}
      {showForm && (
        <div className="glow-border rounded-xl bg-card p-5 fade-slide-up" data-testid="nutrition-form">
          <h2 className="text-sm font-semibold text-foreground mb-4">New Nutrition Entry</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" data-testid="input-nutrition-date" {...register("date")} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Calories (kcal)</Label>
                <Input type="number" placeholder="2500" data-testid="input-calories" {...register("calories")} className="bg-secondary border-border" />
                {errors.calories && <p className="text-xs text-red-400">{errors.calories.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Protein (g)</Label>
                <Input type="number" placeholder="210" data-testid="input-protein" {...register("protein")} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Carbs (g)</Label>
                <Input type="number" placeholder="240" data-testid="input-carbs" {...register("carbs")} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Fat (g)</Label>
                <Input type="number" placeholder="78" data-testid="input-fat" {...register("fat")} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Steps</Label>
                <Input type="number" placeholder="10000" data-testid="input-steps" {...register("steps")} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Water (L)</Label>
                <Input type="number" step="0.1" placeholder="3.0" data-testid="input-water" {...register("water")} className="bg-secondary border-border" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Sleep (hrs)</Label>
                <Input type="number" step="0.5" placeholder="8" data-testid="input-sleep" {...register("sleep")} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" data-testid="button-submit-nutrition" disabled={addMutation.isPending} size="sm">
                {addMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Today's macros */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-1" data-testid="today-macros">
        <h2 className="text-sm font-semibold text-foreground mb-4">Today's Progress</h2>
        {todayLog ? (
          <div className="space-y-3">
            <MacroBar label="Calories" value={todayLog.calories} target={TARGETS.calories} color="hsl(38,90%,55%)" unit=" kcal" />
            <MacroBar label="Protein" value={todayLog.protein} target={TARGETS.protein} color="hsl(186,90%,42%)" />
            <MacroBar label="Carbs" value={todayLog.carbs} target={TARGETS.carbs} color="hsl(262,83%,68%)" />
            <MacroBar label="Fat" value={todayLog.fat} target={TARGETS.fat} color="hsl(0,72%,51%)" />
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-border mt-3">
              {[
                { label: "Steps", value: todayLog.steps?.toLocaleString() ?? "—", target: "10,000", icon: "👟", color: "text-purple-400" },
                { label: "Water", value: todayLog.water ? `${todayLog.water}L` : "—", target: "3.0L", icon: "💧", color: "text-primary" },
                { label: "Sleep", value: todayLog.sleep ? `${todayLog.sleep}h` : "—", target: "8h", icon: "🌙", color: "text-warning" },
              ].map(({ label, value, target, icon, color }) => (
                <div key={label} className="text-center">
                  <div className="text-lg mb-1">{icon}</div>
                  <div className={`text-base font-bold tabular-nums ${color}`}>{value}</div>
                  <div className="text-xs text-muted-foreground">/ {target}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4">Nothing logged today yet. Hit "Log Nutrition" to start.</p>
        )}
      </div>

      {/* 7-day chart */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-2" data-testid="nutrition-chart">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">7-Day Calories</h2>
          {weeklyAvg && (
            <span className="text-xs text-muted-foreground">
              7-day avg: <span className="text-warning font-semibold">{weeklyAvg.calories} kcal</span>
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }} barSize={28}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,10%,15%)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(210,10%,55%)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }} tickLine={false} axisLine={false} domain={[0, 3200]} />
            <Tooltip content={<NutritionTooltip />} />
            <ReferenceLine y={TARGETS.calories} stroke="hsl(38,90%,55%)" strokeDasharray="4 4" label={{ value: "Target", position: "right", fontSize: 9, fill: "hsl(38,90%,55%)" }} />
            <Bar dataKey="Calories" radius={[4, 4, 0, 0]} animationDuration={800}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.Calories <= TARGETS.calories
                      ? "hsl(186,90%,42%)"
                      : "hsl(0,72%,51%)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Macro breakdown chart */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-3" data-testid="macro-chart">
        <h2 className="text-sm font-semibold text-foreground mb-4">7-Day Macro Breakdown</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }} barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,10%,15%)" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(210,10%,55%)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }} tickLine={false} axisLine={false} />
            <Tooltip content={<NutritionTooltip />} />
            <Bar dataKey="Protein" fill="hsl(186,90%,42%)" radius={[2, 2, 0, 0]} animationDuration={800} />
            <Bar dataKey="Carbs" fill="hsl(262,83%,68%)" radius={[2, 2, 0, 0]} animationDuration={800} />
            <Bar dataKey="Fat" fill="hsl(0,72%,51%)" radius={[2, 2, 0, 0]} animationDuration={800} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-primary" />Protein (210g target)</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-purple-400" />Carbs (240g target)</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded bg-red-400" />Fat (78g target)</div>
        </div>
      </div>

      {/* Weekly averages */}
      {weeklyAvg && (
        <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-4" data-testid="weekly-averages">
          <h2 className="text-sm font-semibold text-foreground mb-3">7-Day Averages vs Targets</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: "Calories", avg: weeklyAvg.calories, target: TARGETS.calories, unit: "kcal", color: "text-warning" },
              { label: "Protein", avg: weeklyAvg.protein, target: TARGETS.protein, unit: "g", color: "text-primary" },
              { label: "Carbs", avg: weeklyAvg.carbs, target: TARGETS.carbs, unit: "g", color: "text-purple-400" },
              { label: "Fat", avg: weeklyAvg.fat, target: TARGETS.fat, unit: "g", color: "text-red-400" },
              { label: "Steps", avg: weeklyAvg.steps, target: TARGETS.steps, unit: "", color: "text-green-400" },
            ].map(({ label, avg, target, unit, color }) => {
              const pct = Math.round((avg / target) * 100);
              const ok = pct >= 90 && pct <= 110;
              return (
                <div key={label} className="text-center p-3 rounded-lg bg-secondary/40">
                  <div className={`text-lg font-bold tabular-nums ${ok ? "text-green-400" : color}`}>{avg.toLocaleString()}{unit}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{target.toLocaleString()}{unit} target</div>
                  <div className={`text-xs font-medium mt-1 ${ok ? "text-green-400" : pct < 90 ? "text-red-400" : "text-warning"}`}>{pct}%</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Log table */}
      <div className="glow-border rounded-xl bg-card overflow-hidden fade-slide-up stagger-5" data-testid="nutrition-table">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Nutrition Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Kcal", "Protein", "Carbs", "Fat", "Steps", "Water", "Sleep", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={9} className="p-6"><div className="skeleton h-6 rounded" /></td></tr>
              ) : sortedLogs.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground text-sm">No entries yet.</td></tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors" data-testid={`nutrition-row-${log.id}`}>
                    <td className="px-4 py-3 text-muted-foreground">{format(parseISO(log.date), "EEE MMM d")}</td>
                    <td className="px-4 py-3 font-semibold text-warning tabular-nums">{log.calories}</td>
                    <td className="px-4 py-3 font-semibold text-primary tabular-nums">{log.protein}g</td>
                    <td className="px-4 py-3 text-purple-400 tabular-nums">{log.carbs}g</td>
                    <td className="px-4 py-3 text-red-400 tabular-nums">{log.fat}g</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{log.steps?.toLocaleString() ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{log.water ?? "—"}L</td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{log.sleep ?? "—"}h</td>
                    <td className="px-4 py-3">
                      <button
                        data-testid={`button-delete-nutrition-${log.id}`}
                        onClick={() => deleteMutation.mutate(log.id)}
                        className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
