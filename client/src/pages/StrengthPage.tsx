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
import { useToast } from "@/hooks/use-toast";
import type { StrengthLog } from "@shared/schema";

const LIFTS = [
  { key: "benchPress", label: "Bench Press", color: "hsl(186,90%,42%)", startWeight: 80, targetWeight: 90 },
  { key: "barbellRow", label: "Barbell Row", color: "hsl(38,90%,55%)", startWeight: 75, targetWeight: 85 },
  { key: "legPress", label: "Leg Press", color: "hsl(262,83%,68%)", startWeight: 150, targetWeight: 175 },
];

const formSchema = z.object({
  date: z.string().min(1),
  benchPress: z.coerce.number().min(0).max(300).optional(),
  barbellRow: z.coerce.number().min(0).max(300).optional(),
  legPress: z.coerce.number().min(0).max(500).optional(),
  notes: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

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
  const [showForm, setShowForm] = useState(false);

  const { data: logs = [], isLoading } = useQuery<StrengthLog[]>({ queryKey: ["/api/strength"] });
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  const addMutation = useMutation({
    mutationFn: (data: FormValues) => apiRequest("POST", "/api/strength", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strength"] });
      toast({ title: "Strength logged", description: "PRs updated." });
      setShowForm(false);
      reset();
    },
    onError: () => toast({ title: "Error", description: "Failed to save.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/strength/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/strength"] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd") },
  });

  const onSubmit = (data: FormValues) => addMutation.mutate(data);

  // Chart data
  const chartData = sortedLogs
    .slice(0, 20)
    .reverse()
    .map((l) => ({
      date: format(parseISO(l.date), "MMM d"),
      "Bench Press": l.benchPress ?? null,
      "Barbell Row": l.barbellRow ?? null,
      "Leg Press": l.legPress ?? null,
    }));

  // Current PRs (latest non-null)
  const prs: Record<string, number | null> = {};
  const firstPrs: Record<string, number | null> = {};
  for (const lift of LIFTS) {
    const found = sortedLogs.find((l) => (l as any)[lift.key] != null);
    prs[lift.key] = found ? (found as any)[lift.key] : null;
    const first = [...sortedLogs].reverse().find((l) => (l as any)[lift.key] != null);
    firstPrs[lift.key] = first ? (first as any)[lift.key] : null;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between fade-slide-up pt-1">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Strength Tracker
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Maintain &amp; progress strength while cutting</p>
        </div>
        <Button data-testid="button-log-strength" onClick={() => setShowForm(!showForm)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Log PRs
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="glow-border rounded-xl bg-card p-5 fade-slide-up" data-testid="strength-form">
          <h2 className="text-sm font-semibold text-foreground mb-4">Log Strength Session</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" data-testid="input-strength-date" {...register("date")} className="bg-secondary border-border" />
              </div>
              {LIFTS.map((lift) => (
                <div key={lift.key} className="space-y-1.5">
                  <Label className="text-xs">{lift.label} (kg)</Label>
                  <Input
                    type="number"
                    step="2.5"
                    placeholder={`${lift.startWeight}`}
                    data-testid={`input-${lift.key}`}
                    {...register(lift.key as any)}
                    className="bg-secondary border-border"
                  />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Input placeholder="3x5 @ 87.5kg, felt strong..." data-testid="input-strength-notes" {...register("notes")} className="bg-secondary border-border" />
            </div>
            <div className="flex gap-3">
              <Button type="submit" data-testid="button-submit-strength" disabled={addMutation.isPending} size="sm">
                {addMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Current PRs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {LIFTS.map((lift) => {
          const current = prs[lift.key];
          const first = firstPrs[lift.key];
          const gained = current && first ? (current - first).toFixed(1) : null;
          const toTarget = current ? (lift.targetWeight - current).toFixed(1) : null;
          return (
            <div
              key={lift.key}
              className="glow-border rounded-xl bg-card p-5 fade-slide-up"
              data-testid={`pr-card-${lift.key}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{lift.label}</p>
                  <p className="text-2xl font-bold tabular-nums mt-1" style={{ color: lift.color }}>
                    {current ?? "—"}
                    <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Trophy className="w-4 h-4 text-warning" />
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t border-border">
                {gained && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Gained</span>
                    <span className="text-green-400 font-semibold flex items-center gap-1">
                      <ArrowUp className="w-3 h-3" />{gained} kg
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Target</span>
                  <span className="text-foreground font-semibold">{lift.targetWeight} kg</span>
                </div>
                {toTarget && parseFloat(toTarget) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">To target</span>
                    <span className="text-warning font-semibold">{toTarget} kg</span>
                  </div>
                )}
                {/* mini progress bar */}
                {current && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full fill-animate"
                        style={{
                          width: `${Math.min(((current - lift.startWeight) / (lift.targetWeight - lift.startWeight)) * 100, 100)}%`,
                          background: lift.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{lift.startWeight}</span>
                      <span>{lift.targetWeight} kg goal</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Strength trend chart */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-2" data-testid="strength-chart">
        <h2 className="text-sm font-semibold text-foreground mb-4">Strength Trends</h2>
        {chartData.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">No strength data yet. Log your first session!</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,10%,15%)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }} tickLine={false} axisLine={false} />
              <Tooltip content={<StrengthTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: "hsl(210,10%,55%)" }}
                formatter={(v) => <span style={{ color: "hsl(210,10%,55%)" }}>{v}</span>}
              />
              {LIFTS.map((lift) => (
                <Line
                  key={lift.key}
                  type="monotone"
                  dataKey={lift.label}
                  stroke={lift.color}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: lift.color }}
                  activeDot={{ r: 6 }}
                  connectNulls
                  animationDuration={1000}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Log table */}
      <div className="glow-border rounded-xl bg-card overflow-hidden fade-slide-up stagger-3" data-testid="strength-table">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Strength Log</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Date", "Bench Press", "Barbell Row", "Leg Press", "Notes", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="p-6"><div className="skeleton h-6 rounded" /></td></tr>
              ) : sortedLogs.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">No entries yet.</td></tr>
              ) : (
                sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-secondary/20 transition-colors" data-testid={`strength-row-${log.id}`}>
                    <td className="px-4 py-3 text-muted-foreground">{format(parseISO(log.date), "EEE MMM d")}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: LIFTS[0].color }}>{log.benchPress ?? "—"} kg</td>
                    <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: LIFTS[1].color }}>{log.barbellRow ?? "—"} kg</td>
                    <td className="px-4 py-3 font-semibold tabular-nums" style={{ color: LIFTS[2].color }}>{log.legPress ?? "—"} kg</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs truncate max-w-[180px]">{log.notes ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        data-testid={`button-delete-strength-${log.id}`}
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
