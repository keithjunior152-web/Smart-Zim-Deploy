import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, Play, Pause, RotateCcw, Coffee, Zap, Trophy, Clock, AlertTriangle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

const MODES = [
  { label: "Focus", duration: 25 * 60, type: "study", color: "text-green-600", bg: "bg-green-50" },
  { label: "Short Break", duration: 5 * 60, type: "break", color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Long Break", duration: 15 * 60, type: "long_break", color: "text-purple-600", bg: "bg-purple-50" },
];

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function StudyShield() {
  const [modeIdx, setModeIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(MODES[0].duration);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [distractions, setDistractions] = useState(0);
  const [showDistracted, setShowDistracted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const mode = MODES[modeIdx];
  const progress = Math.round(((mode.duration - secondsLeft) / mode.duration) * 100);

  const { data: history } = useQuery({
    queryKey: ["focus-sessions"],
    queryFn: () => fetch("/api/focus-sessions", { credentials: "include" }).then(r => r.json()),
  });

  const { data: profile } = useQuery({
    queryKey: ["gamification-profile"],
    queryFn: () => fetch("/api/gamification/profile", { credentials: "include" }).then(r => r.json()),
  });

  const logSession = useMutation({
    mutationFn: (data: { durationMinutes: number; type: string }) =>
      fetch("/api/focus-sessions", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["focus-sessions"] });
      qc.invalidateQueries({ queryKey: ["gamification-profile"] });
      toast.success(`+${data.xpGained} XP earned! Focus session logged 🎯`);
    },
  });

  const requestWakeLock = useCallback(async () => {
    if (!("wakeLock" in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<WakeLockSentinel> } }).wakeLock.request("screen");
    } catch {
      /* wake lock not supported or denied — continue silently */
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen) {
        await (el as HTMLElement & { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen();
      }
    } catch {
      /* fullscreen denied — fine, continue */
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!running) return;

    const handleVisibility = () => {
      if (document.visibilityState === "hidden" && running) {
        setDistractions(d => d + 1);
        setShowDistracted(true);
        setRunning(false);
        toast.error("⚠️ Distraction detected! Timer paused. Stay focused! 🦁");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            releaseWakeLock();
            exitFullscreen();
            if (modeIdx === 0) {
              logSession.mutate({ durationMinutes: 25, type: "study" });
              setSessionsCompleted(c => c + 1);
              toast.success("🌿 Focus session complete! Take a break. Well done!");
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const handleStartPause = async () => {
    if (!running) {
      if (modeIdx === 0) {
        await enterFullscreen();
        await requestWakeLock();
        toast.info("🔒 Focus mode ON — screen locked, phone silenced. Stay focused!");
      }
      setShowDistracted(false);
      setRunning(true);
    } else {
      setRunning(false);
      await releaseWakeLock();
      await exitFullscreen();
    }
  };

  const selectMode = (idx: number) => {
    setModeIdx(idx);
    setSecondsLeft(MODES[idx].duration);
    setRunning(false);
    releaseWakeLock();
    exitFullscreen();
  };

  const reset = () => {
    setSecondsLeft(mode.duration);
    setRunning(false);
    releaseWakeLock();
    exitFullscreen();
  };

  const totalTodayMins = Array.isArray(history)
    ? history.filter((s: { type: string; completedAt: string }) => {
        const d = new Date(s.completedAt).toDateString();
        return d === new Date().toDateString() && s.type === "study";
      }).reduce((acc: number, s: { durationMinutes: number }) => acc + s.durationMinutes, 0)
    : 0;

  return (
    <div ref={containerRef} className="space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-green-600" />
          Study Shield
        </h1>
        <p className="text-muted-foreground mt-1">Pomodoro focus timer — earn XP and block distractions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-green-50/60">
          <CardContent className="p-5 flex items-center gap-3">
            <Zap className="h-7 w-7 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Focus Score</p>
              <p className="text-2xl font-bold">{profile?.focusScore ?? 0}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50/60">
          <CardContent className="p-5 flex items-center gap-3">
            <Clock className="h-7 w-7 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Today's Focus</p>
              <p className="text-2xl font-bold">{totalTodayMins} min</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-purple-50/60">
          <CardContent className="p-5 flex items-center gap-3">
            <Trophy className="h-7 w-7 text-purple-600" />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Sessions Today</p>
              <p className="text-2xl font-bold">{sessionsCompleted}</p>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-none shadow-sm ${distractions > 0 ? "bg-red-50/60" : "bg-gray-50/60"}`}>
          <CardContent className="p-5 flex items-center gap-3">
            <AlertTriangle className={`h-7 w-7 ${distractions > 0 ? "text-red-500" : "text-gray-400"}`} />
            <div>
              <p className="text-xs text-muted-foreground font-medium">Distractions</p>
              <p className={`text-2xl font-bold ${distractions > 0 ? "text-red-600" : ""}`}>{distractions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {MODES.map((m, i) => (
          <Button
            key={m.label}
            variant={modeIdx === i ? "default" : "outline"}
            size="sm"
            onClick={() => selectMode(i)}
            className={modeIdx === i ? "bg-primary" : ""}
          >
            {m.label === "Focus" ? <Shield className="h-4 w-4 mr-1" /> : <Coffee className="h-4 w-4 mr-1" />}
            {m.label}
          </Button>
        ))}
      </div>

      <Card className={`border-none shadow-md ${mode.bg} ${running && modeIdx === 0 ? "ring-2 ring-green-500 ring-offset-2" : ""}`}>
        <CardContent className="p-10 flex flex-col items-center gap-8">
          {running && modeIdx === 0 && (
            <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold">
              <Lock className="h-3.5 w-3.5" />
              FOCUS MODE ACTIVE — Screen locked, stay on task
            </div>
          )}

          <div className="relative flex items-center justify-center w-52 h-52">
            <svg className="w-52 h-52 -rotate-90 absolute" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={modeIdx === 0 ? "#16a34a" : modeIdx === 1 ? "#2563eb" : "#9333ea"}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset 0.5s ease" }}
              />
            </svg>
            <div className="text-center z-10">
              <p className={`text-6xl font-bold tabular-nums ${mode.color}`}>{fmt(secondsLeft)}</p>
              <p className="text-sm text-muted-foreground mt-1">{mode.label}</p>
            </div>
          </div>

          <Progress value={progress} className="w-full max-w-xs h-2" />

          <div className="flex gap-4">
            <Button variant="outline" size="icon" onClick={reset}>
              <RotateCcw className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              className={`px-10 font-bold text-lg ${running ? "bg-red-500 hover:bg-red-600" : "bg-primary"}`}
              onClick={handleStartPause}
            >
              {running
                ? <><Pause className="h-5 w-5 mr-2" /> Pause</>
                : <><Play className="h-5 w-5 mr-2" /> {secondsLeft === mode.duration ? "Start" : "Resume"}</>
              }
            </Button>
          </div>

          <AnimatePresence>
            {running && modeIdx === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-sm text-green-700 font-medium">You're in the zone! All distractions blocked. 🦁</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Earn 15 XP + SmartCoins when you finish · Switching apps will pause timer
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showDistracted && !running && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center bg-red-50 border border-red-200 rounded-xl px-6 py-4"
              >
                <p className="text-red-600 font-bold text-base">⚠️ You left the app!</p>
                <p className="text-red-500 text-sm mt-1">Timer paused. Distraction #{distractions} recorded.</p>
                <p className="text-muted-foreground text-xs mt-1">Press Resume to continue your session.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" /> Recent Focus Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No sessions yet. Start your first focus session above!</p>
          ) : (
            <div className="space-y-3">
              {(history as Array<{ id: number; durationMinutes: number; type: string; completedAt: string }>).slice(0, 8).map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div className="flex items-center gap-2">
                    {s.type === "study" ? <Shield className="h-4 w-4 text-green-600" /> : <Coffee className="h-4 w-4 text-blue-500" />}
                    <span className="text-sm font-medium capitalize">{s.type.replace("_", " ")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{s.durationMinutes} min</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(s.completedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
