import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format, subDays, parseISO, isToday, isThisWeek } from "date-fns";
import {
  Scale,
  Flame,
  Footprints,
  TrendingDown,
  Dumbbell,
  Target,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import type { WeightLog, NutritionLog, WorkoutLog } from "@shared/schema";

function delta(val: number | undefined, target: number) {
  if (!val) return null;
  const d = val - target;
  return { d, pct: Math.round((d / target) * 100) };
}

// ─── KPI card ───────────────────────────────────────────────────────────────
function KpiCard({
  title,
  value,
  unit,
  sub,
  icon: Icon,
  color,
  delay,
}: {
  title: string;
  value: string | number;
  unit?: string;
  sub?: React.ReactNode;
  icon: React.ElementType;
  color: string;
  delay?: string;
}) {
  return (
    <div
      className={`glow-border rounded-xl bg-card p-5 fade-slide-up ${delay ?? ""}`}
      data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className={`text-xl sm:text-2xl font-bold tabular-nums count-animate ${color}`}>
            {value}
            {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
          </p>
          {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
        </div>
        <div className={`p-2 rounded-lg bg-primary/10`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
    </div>
  );
}

// ─── Macro ring ─────────────────────────────────────────────────────────────
function MacroRing({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const total = protein * 4 + carbs * 4 + fat * 9;
  const data = [
    { name: "Protein", value: Math.round((protein * 4 / total) * 100), color: "hsl(186,90%,42%)" },
    { name: "Carbs", value: Math.round((carbs * 4 / total) * 100), color: "hsl(38,90%,55%)" },
    { name: "Fat", value: Math.round((fat * 9 / total) * 100), color: "hsl(262,83%,68%)" },
  ];

  return (
    <div className="flex items-center gap-6">
      <PieChart width={100} height={100}>
        <Pie
          data={data}
          cx={45}
          cy={45}
          innerRadius={30}
          outerRadius={45}
          paddingAngle={2}
          dataKey="value"
          startAngle={90}
          endAngle={-270}
          isAnimationActive
          animationDuration={800}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
      <div className="space-y-2">
        {[
          { label: "Protein", val: protein, unit: "g", color: "text-primary" },
          { label: "Carbs", val: carbs, unit: "g", color: "text-warning" },
          { label: "Fat", val: fat, unit: "g", color: "text-purple-400" },
        ].map(({ label, val, unit, color }) => (
          <div key={label} className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${color.replace("text-", "bg-")}`} />
            <span className="text-muted-foreground w-14">{label}</span>
            <span className={`font-semibold tabular-nums ${color}`}>{val}{unit}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────────────────
function WeightTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs shadow-xl">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value} kg
        </p>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { profile, targets, weightTargets } = useProfile();
  const { data: weightLogs = [] } = useQuery<WeightLog[]>({ queryKey: ["/api/weight"] });
  const { data: nutritionLogs = [] } = useQuery<NutritionLog[]>({ queryKey: ["/api/nutrition"] });
  const { data: workoutLogs = [] } = useQuery<WorkoutLog[]>({ queryKey: ["/api/workouts"] });

  const { start: WEIGHT_START, goal: WEIGHT_TARGET, months: goalMonths } = weightTargets;
  const CALORIES_TARGET = targets.calories;
  const STEPS_TARGET = targets.steps;
  const totalDays = goalMonths * 30;
  const startDate = parseISO(profile.startDate);
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const currentWeek = Math.max(1, Math.floor(daysSinceStart / 7) + 1);
  const weeksRemaining = Math.max(0, goalMonths * 4 - currentWeek);

  // Current weight (latest)
  const sortedWeight = [...weightLogs].sort((a, b) => b.date.localeCompare(a.date));
  const latestWeight = sortedWeight[0]?.weight;
  const prevWeight = sortedWeight[1]?.weight;
  const weightDelta = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  // Weekly avg loss
  const weekWeights = sortedWeight.slice(0, 7);
  const weekAvgLoss =
    weekWeights.length >= 2
      ? ((weekWeights[weekWeights.length - 1].weight - weekWeights[0].weight) / (weekWeights.length - 1)).toFixed(2)
      : null;

  // Today nutrition
  const today = format(new Date(), "yyyy-MM-dd");
  const todayNutrition = nutritionLogs.find((n) => n.date === today);

  // This week workouts
  const thisWeekWorkouts = workoutLogs.filter((w) => {
    try {
      return isThisWeek(parseISO(w.date), { weekStartsOn: 1 });
    } catch {
      return false;
    }
  });

  // Progress to goal
  const progressPct =
    latestWeight
      ? Math.round(((WEIGHT_START - latestWeight) / (WEIGHT_START - WEIGHT_TARGET)) * 100)
      : 0;

  // Weight chart: last 28 days with projected line
  const chartData = sortedWeight
    .slice(0, 28)
    .reverse()
    .map((w) => ({
      date: format(parseISO(w.date), "MMM d"),
      Actual: w.weight,
      // Simple projected: linear from start to target over 84 days
      Projected: parseFloat(
        (
          WEIGHT_START -
          ((WEIGHT_START - WEIGHT_TARGET) *
            (weightLogs.length - sortedWeight.indexOf(w) - 1)) /
            totalDays
        ).toFixed(1)
      ),
    }));

  // Week training
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const workoutsByDay: Record<string, WorkoutLog | undefined> = {};
  thisWeekWorkouts.forEach((w) => {
    try {
      const day = format(parseISO(w.date), "EEE");
      workoutsByDay[day] = w;
    } catch {}
  });

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="fade-slide-up pt-1">
        <h1 className="text-xl font-bold text-foreground">Good evening, {profile.name || "there"}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, d MMMM yyyy")} · Summer Shred Week {currentWeek}
        </p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Current Weight"
          value={latestWeight ?? "—"}
          unit="kg"
          sub={weightDelta ? (
            <span className={parseFloat(weightDelta) < 0 ? "text-green-400" : "text-red-400"}>
              {parseFloat(weightDelta) < 0 ? "↓" : "↑"} {Math.abs(parseFloat(weightDelta))} kg vs yesterday
            </span>
          ) : "No recent log"}
          icon={Scale}
          color="text-primary"
          delay="stagger-1"
        />
        <KpiCard
          title="Weekly Avg Loss"
          value={weekAvgLoss ? Math.abs(parseFloat(weekAvgLoss)).toFixed(2) : "—"}
          unit="kg/day"
          sub="Target: ~0.11 kg/day"
          icon={TrendingDown}
          color="text-green-400"
          delay="stagger-2"
        />
        <KpiCard
          title="Calories Today"
          value={todayNutrition?.calories ?? "—"}
          unit={todayNutrition ? "kcal" : ""}
          sub={todayNutrition ? `${CALORIES_TARGET - (todayNutrition?.calories ?? 0)} remaining` : "Not logged yet"}
          icon={Flame}
          color="text-warning"
          delay="stagger-3"
        />
        <KpiCard
          title="Steps Today"
          value={todayNutrition?.steps?.toLocaleString() ?? "—"}
          sub={`Target: ${STEPS_TARGET.toLocaleString()}`}
          icon={Footprints}
          color="text-purple-400"
          delay="stagger-4"
        />
      </div>

      {/* Progress to goal */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-2" data-testid="progress-goal">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Progress to Goal</span>
          </div>
          <span className="text-sm font-bold text-primary">{progressPct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full fill-animate"
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Start: {WEIGHT_START} kg</span>
          <span className="text-foreground font-medium">
            {latestWeight ? `${(latestWeight - WEIGHT_TARGET).toFixed(1)} kg to go` : "—"}
          </span>
          <span>Goal: {WEIGHT_TARGET} kg</span>
        </div>
      </div>

      {/* Weight chart + macros */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Weight trend */}
        <div className="lg:col-span-2 glow-border rounded-xl bg-card p-5 fade-slide-up stagger-3" data-testid="weight-chart">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Weight Trend</h2>
            <span className="text-xs text-muted-foreground">Last 28 days</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,10%,15%)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }}
                tickLine={false}
                axisLine={false}
                interval={6}
              />
              <YAxis
                domain={["auto", "auto"]}
                tick={{ fontSize: 10, fill: "hsl(210,10%,55%)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<WeightTooltip />} wrapperStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)" }} />
              <ReferenceLine y={WEIGHT_TARGET} stroke="hsl(142,70%,45%)" strokeDasharray="4 4" strokeWidth={1} label={{ value: "Goal", position: "right", fontSize: 9, fill: "hsl(142,70%,45%)" }} />
              <Line
                type="monotone"
                dataKey="Projected"
                stroke="hsl(220,10%,35%)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                animationDuration={800}
              />
              <Line
                type="monotone"
                dataKey="Actual"
                stroke="hsl(186,90%,42%)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: "hsl(186,90%,42%)" }}
                animationDuration={1000}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-primary" />Actual</div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 border-t border-dashed border-border" />Projected</div>
            <div className="flex items-center gap-1.5"><div className="w-4 h-0.5 bg-green-400 border-dashed" />Goal: {WEIGHT_TARGET} kg</div>
          </div>
        </div>

        {/* Today macros */}
        <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-4" data-testid="macro-ring">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Today's Macros
          </h2>
          {todayNutrition ? (
            <MacroRing
              protein={todayNutrition.protein}
              carbs={todayNutrition.carbs}
              fat={todayNutrition.fat}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No nutrition logged today
            </div>
          )}
          {todayNutrition && (
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total calories</span>
                <span className={todayNutrition.calories <= CALORIES_TARGET ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>
                  {todayNutrition.calories} / {CALORIES_TARGET}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Water</span>
                <span className="text-primary font-semibold">{todayNutrition.water ?? "—"} L</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Sleep</span>
                <span className="text-foreground font-semibold">{todayNutrition.sleep ?? "—"} hrs</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* This week training */}
      <div className="glow-border rounded-xl bg-card p-5 fade-slide-up stagger-5" data-testid="week-training">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">This Week's Training</h2>
          </div>
          <span className="text-xs text-primary font-semibold">{thisWeekWorkouts.length} / 6 sessions</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const workout = workoutsByDay[day];
            return (
              <div key={day} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{day}</span>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-medium ${
                    workout
                      ? workout.type === "gym"
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/25"
                        : workout.type === "tennis"
                        ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25"
                        : workout.type === "jump_rope"
                        ? "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                        : "bg-green-500/15 text-green-400 border border-green-500/25"
                      : "bg-muted border border-border text-muted-foreground"
                  }`}
                  title={workout ? `${workout.type} — ${workout.durationMin}min` : "Rest"}
                >
                  {workout ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground capitalize">
                  {workout ? workout.type.replace("_", " ") : "rest"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 fade-slide-up stagger-6">
        {[
          { label: "Lost so far", value: latestWeight ? `${(WEIGHT_START - latestWeight).toFixed(1)} kg` : "—", icon: TrendingDown, color: "text-green-400" },
          { label: "Total workouts", value: workoutLogs.length, icon: Dumbbell, color: "text-primary" },
          { label: "Weeks remaining", value: `${weeksRemaining}`, icon: Zap, color: "text-warning" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glow-border rounded-xl bg-card p-4 flex items-center gap-3" data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
