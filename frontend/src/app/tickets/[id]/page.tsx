"use client";

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import ImpactComparisonChart from "@/components/ImpactComparisonChart";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ProofLog = {
  id: number;
  ticket_id: number;
  before_image_path?: string;
  after_image_path?: string;
  remarks?: string;
  uploaded_at: string;
};

type ImpactReport = {
  id: number;
  ticket_id: number;

  before_pm25_avg: number;
  after_pm25_avg: number;

  before_pm10_avg: number;
  after_pm10_avg: number;

  before_noise_avg: number;
  after_noise_avg: number;

  pm25_improvement_percent: number;
  pm10_improvement_percent: number;
  noise_improvement_percent: number;

  improvement_percent: number;
  effectiveness_score: number;
  verdict: string;
  created_at: string;
};

type ActionTicket = {
  id: number;
  node_id: string;
  location_name: string;
};

type RecoveryReading = {
  node_id: string;
  timestamp: string;
  pm25: number;
  pm10: number;
  temperature: number;
  humidity: number;
  battery: number;
  noise_db: number;
};

const demoSimulationEnabled =
  process.env.NEXT_PUBLIC_DEMO_SIMULATION_ENABLED !== "false";

const demoRecoveryRanges = {
  pm25: [92, 116],
  pm10: [158, 205],
  noise_db: [60, 72],
  temperature: [29, 33],
  humidity: [38, 48],
  battery: [84, 94],
} as const;

function getVerdictColor(verdict: string) {
  const v = verdict.toLowerCase();
  if (v.includes("effective") || v.includes("highly") || v.includes("success")) {
    return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  }
  if (v.includes("moderate") || v.includes("marginal") || v.includes("partial")) {
    return "bg-amber-500/10 border-amber-500/20 text-amber-400";
  }
  return "bg-red-500/10 border-red-500/20 text-red-400";
}

function getDeltaColor(value: number) {
  return value > 0 ? "text-emerald-400" : "text-red-400";
}

type NoticeTone = "success" | "warning" | "error";

type Notice = {
  tone: NoticeTone;
  message: string;
};

const apiOrigin = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000")
  .replace(/\/api\/v1\/?$/, "")
  .replace(/\/$/, "");

function getUploadUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${apiOrigin}${path}`;
}

function getNoticeClass(tone: NoticeTone) {
  if (tone === "success") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  if (tone === "warning") return "border-amber-500/20 bg-amber-500/10 text-amber-300";
  return "border-red-500/20 bg-red-500/10 text-red-300";
}

function formatImpact(value: number) {
  if (value > 0) return `${value}% reduction`;
  if (value < 0) return `${Math.abs(value)}% increase`;
  return "No change";
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    const data = error.response.data as { detail?: unknown };
    if (typeof data.detail === "string") return data.detail;
  }

  return fallback;
}

function sampleRange([min, max]: readonly [number, number]) {
  return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function buildDemoRecoveryReading(nodeId: string, offsetSeconds: number): RecoveryReading {
  return {
    node_id: nodeId,
    timestamp: new Date(Date.now() + offsetSeconds * 1000).toISOString(),
    pm25: sampleRange(demoRecoveryRanges.pm25),
    pm10: sampleRange(demoRecoveryRanges.pm10),
    temperature: sampleRange(demoRecoveryRanges.temperature),
    humidity: sampleRange(demoRecoveryRanges.humidity),
    battery: sampleRange(demoRecoveryRanges.battery),
    noise_db: sampleRange(demoRecoveryRanges.noise_db),
  };
}

export default function TicketProofPage() {
  const params = useParams();
  const ticketId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [ticket, setTicket] = useState<ActionTicket | null>(null);
  const [proofs, setProofs] = useState<ProofLog[]>([]);
  const [impact, setImpact] = useState<ImpactReport | null>(null);
  const [remarks, setRemarks] = useState("");
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [demoingRecovery, setDemoingRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  const beforePreviewUrl = useMemo(
    () => (beforeImage ? URL.createObjectURL(beforeImage) : null),
    [beforeImage]
  );
  const afterPreviewUrl = useMemo(
    () => (afterImage ? URL.createObjectURL(afterImage) : null),
    [afterImage]
  );

  const fetchProofs = useCallback(async () => {
    try {
      const res = await api.get(`/proofs/${ticketId}`);
      setProofs(res.data);
    } catch (error) {
      console.error("Failed to fetch proofs:", error);
    }
  }, [ticketId]);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await api.get<ActionTicket[]>("/tickets");
      const currentTicket = res.data.find((item) => String(item.id) === String(ticketId));
      setTicket(currentTicket ?? null);
    } catch (error) {
      console.error("Failed to fetch ticket:", error);
    }
  }, [ticketId]);

  const fetchImpact = useCallback(async () => {
    try {
      const res = await api.get(`/impact/${ticketId}`);
      setImpact(res.data);
    } catch (error) {
      setImpact(null);
      console.info("Impact report not available yet:", error);
    }
  }, [ticketId]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchTicket(), fetchProofs(), fetchImpact()]);
    setIsLoading(false);
  }, [fetchImpact, fetchProofs, fetchTicket]);

  const evaluateImpact = useCallback(async (successMessage = "Impact report generated from latest proof and sensor readings.") => {
    try {
      setEvaluating(true);
      const res = await api.post(`/impact/${ticketId}`);
      setImpact(res.data);
      setNotice({
        tone: "success",
        message: successMessage,
      });
    } catch (error) {
      console.error("Impact evaluation failed:", error);
      setNotice({
        tone: "warning",
        message: getErrorMessage(
          error,
          "Proof is logged, but impact needs sensor readings on both sides of the cleanup timestamp."
        ),
      });
    } finally {
      setEvaluating(false);
    }
  }, [ticketId]);

  const handleUpload = async () => {
    try {
      setUploading(true);
      setNotice(null);

      const formData = new FormData();
      formData.append("remarks", remarks);
      if (beforeImage) formData.append("before_image", beforeImage);
      if (afterImage) formData.append("after_image", afterImage);

      await api.post(`/proofs/${ticketId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setRemarks("");
      setBeforeImage(null);
      setAfterImage(null);
      await fetchProofs();
      setNotice({
        tone: "success",
        message: "Proof logged. Checking before and after sensor readings now.",
      });
      await evaluateImpact("Proof logged and impact report refreshed from the latest sensor window.");
    } catch (error) {
      console.error("Proof upload failed:", error);
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Failed to upload proof. Please try again."),
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEvaluateImpact = async () => {
    setNotice(null);
    await evaluateImpact();
  };

  const handleDemoRecovery = async () => {
    if (!ticket) {
      setNotice({
        tone: "warning",
        message: "Ticket details are still loading. Try again in a moment.",
      });
      return;
    }

    try {
      setDemoingRecovery(true);
      setNotice({
        tone: "success",
        message: "Posting demo recovery readings for the cleanup window.",
      });

      for (let index = 0; index < 5; index += 1) {
        await api.post("/readings/", buildDemoRecoveryReading(ticket.node_id, index + 1));
      }

      await evaluateImpact("Demo recovery readings posted. Before and after impact is ready.");
    } catch (error) {
      console.error("Demo recovery failed:", error);
      setNotice({
        tone: "error",
        message: getErrorMessage(error, "Could not generate demo recovery readings."),
      });
    } finally {
      setDemoingRecovery(false);
    }
  };

  useEffect(() => {
    if (ticketId) loadData();
  }, [loadData, ticketId]);

  useEffect(() => {
    return () => {
      if (beforePreviewUrl) URL.revokeObjectURL(beforePreviewUrl);
    };
  }, [beforePreviewUrl]);

  useEffect(() => {
    return () => {
      if (afterPreviewUrl) URL.revokeObjectURL(afterPreviewUrl);
    };
  }, [afterPreviewUrl]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-400"></div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Decrypting Evidence...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 font-sans text-zinc-50 selection:bg-indigo-500/30 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-8 animate-in fade-in duration-500">
        <header className="flex flex-col gap-4 border-b border-zinc-800/60 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Link
              href="/tickets"
              className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-300"
            >
              <span className="font-mono text-xs">←</span> Action Queue
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                Verification & Impact Report
              </h1>
              <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-xs font-mono font-medium text-zinc-400">
                TKT-{ticketId}
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-500">
              Upload field evidence and trigger AI-driven telemetry evaluation.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <Card className="animate-in slide-in-from-bottom-4 border-zinc-800 bg-zinc-900/40 shadow-xl backdrop-blur-sm fade-in">
              <CardHeader className="border-b border-zinc-800/60 pb-4">
                <CardTitle className="text-base tracking-wide text-zinc-200 uppercase text-[13px]">
                  Log Field Evidence
                </CardTitle>
              </CardHeader>

              <CardContent className="flex flex-col gap-5 pt-5">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  {[
                    { step: "01", label: "Before photo", detail: beforeImage ? "Ready" : "Awaiting capture" },
                    { step: "02", label: "After photo", detail: afterImage ? "Ready" : "Awaiting capture" },
                    { step: "03", label: "Sensor impact", detail: impact ? formatImpact(impact.improvement_percent) : "Pending readings" },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-3 rounded border border-zinc-800/70 bg-zinc-950/40 px-3 py-2.5"
                    >
                      <span className="font-mono text-[10px] font-bold text-zinc-600">{item.step}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                          {item.label}
                        </p>
                        <p className="truncate text-[10px] font-medium text-zinc-500">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="relative flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center transition-all hover:border-zinc-500 hover:bg-zinc-900 focus-within:ring-2 focus-within:ring-zinc-600 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950">
                    {beforePreviewUrl && (
                      <img
                        src={beforePreviewUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-45"
                      />
                    )}
                    <span className="relative z-10 rounded border border-zinc-800/70 bg-zinc-950/75 px-2 py-1 text-xs font-bold uppercase tracking-widest text-zinc-300">
                      Before Cleaning
                    </span>
                    <span className="relative z-10 mt-2 max-w-full truncate rounded bg-zinc-950/75 px-2 py-1 font-mono text-[10px] text-zinc-500">
                      {beforeImage ? beforeImage.name : "Select Image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setBeforeImage(e.target.files?.[0] || null)}
                    />
                  </label>

                  <label className="relative flex min-h-44 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center transition-all hover:border-zinc-500 hover:bg-zinc-900 focus-within:ring-2 focus-within:ring-zinc-600 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950">
                    {afterPreviewUrl && (
                      <img
                        src={afterPreviewUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-45"
                      />
                    )}
                    <span className="relative z-10 rounded border border-zinc-800/70 bg-zinc-950/75 px-2 py-1 text-xs font-bold uppercase tracking-widest text-zinc-300">
                      After Cleaning
                    </span>
                    <span className="relative z-10 mt-2 max-w-full truncate rounded bg-zinc-950/75 px-2 py-1 font-mono text-[10px] text-zinc-500">
                      {afterImage ? afterImage.name : "Select Image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setAfterImage(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Field Protocol Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950/50 p-3 font-mono text-sm text-zinc-300 transition-colors placeholder:text-zinc-700 focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600"
                    rows={3}
                    placeholder="Input execution log..."
                  />
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-stretch gap-3 border-t border-zinc-800/60 bg-zinc-900/20 py-3 sm:flex-row sm:items-center sm:justify-between">
                {notice ? (
                  <div className={`rounded border px-3 py-2 text-[10px] font-semibold uppercase tracking-widest ${getNoticeClass(notice.tone)}`}>
                    {notice.message}
                  </div>
                ) : (
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">
                    Proof timestamp anchors the before and after sensor window.
                  </div>
                )}
                <button
                  onClick={handleUpload}
                  disabled={uploading || evaluating || (!beforeImage && !afterImage && !remarks)}
                  className="shrink-0 rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-100 shadow-sm transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
                >
                  {uploading ? "LOGGING..." : evaluating ? "ANALYZING..." : "SUBMIT PROOF"}
                </button>
              </CardFooter>
            </Card>

            {proofs.length > 0 && (
              <div className="animate-in slide-in-from-bottom-8 flex flex-col gap-4 fade-in duration-700">
                <h3 className="mt-4 text-[11px] font-bold tracking-widest text-zinc-500 uppercase">
                  Verified Proof Ledger
                </h3>

                {proofs.map((proof) => (
                  <Card key={proof.id} className="overflow-hidden border-zinc-800 bg-zinc-900/40">
                    <div className="grid grid-cols-2 gap-px bg-zinc-800">
                      <div className="relative aspect-video bg-zinc-950">
                        <div className="absolute top-2 left-2 z-10 rounded border border-zinc-700/50 bg-zinc-900/80 px-2 py-0.5 text-[9px] font-bold tracking-widest text-zinc-300 uppercase shadow-sm backdrop-blur-md">
                          Before
                        </div>
                        {proof.before_image_path ? (
                          <img
                            src={getUploadUrl(proof.before_image_path)}
                            alt="Before"
                            className="h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] tracking-widest text-zinc-700 uppercase">
                            No Signal
                          </div>
                        )}
                      </div>

                      <div className="relative aspect-video bg-zinc-950">
                        <div className="absolute top-2 left-2 z-10 rounded border border-zinc-700/50 bg-zinc-900/80 px-2 py-0.5 text-[9px] font-bold tracking-widest text-zinc-300 uppercase shadow-sm backdrop-blur-md">
                          After
                        </div>
                        {proof.after_image_path ? (
                          <img
                            src={getUploadUrl(proof.after_image_path)}
                            alt="After"
                            className="h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center font-mono text-[10px] tracking-widest text-zinc-700 uppercase">
                            No Signal
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-zinc-900/30 p-4">
                      <p className="text-sm font-medium text-zinc-300">
                        <span className="mr-2 text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
                          Logs:
                        </span>
                        {proof.remarks || "Null."}
                      </p>
                      <p className="mt-3 font-mono text-[9px] font-medium tracking-widest text-zinc-600 uppercase">
                        TIMESTAMP: {new Date(proof.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="animate-in slide-in-from-right-8 sticky top-8 fade-in duration-700 lg:col-span-5">
            <Card className="relative overflow-hidden border-zinc-800 bg-zinc-900/60 shadow-2xl backdrop-blur-md">
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0"></div>

              <CardHeader className="border-b border-zinc-800/60 bg-zinc-950/30 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base tracking-wide text-zinc-100 uppercase text-[13px]">
                    Cleanup Impact
                  </CardTitle>
                  <Badge className="border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] tracking-widest text-indigo-400 uppercase">
                    Sensor Eval
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-6 pt-5">
                {!impact ? (
                  <div className="flex flex-col items-center gap-4 py-10 text-center">
                    <p className="max-w-[80%] font-mono text-xs leading-relaxed text-zinc-500">
                      Upload cleanup proof first. The report compares recent readings before the proof timestamp
                      with readings collected after it.
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={handleEvaluateImpact}
                        disabled={evaluating || demoingRecovery || proofs.length === 0}
                        className="rounded border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-[10px] font-bold tracking-widest text-indigo-400 uppercase shadow-sm transition-all hover:bg-indigo-500/20 disabled:opacity-40 focus:outline-none"
                      >
                        {evaluating ? "COMPUTING..." : proofs.length === 0 ? "PROOF REQUIRED" : "TRIGGER ANALYSIS"}
                      </button>

                      {demoSimulationEnabled && (
                        <button
                          onClick={handleDemoRecovery}
                          disabled={evaluating || demoingRecovery || proofs.length === 0 || !ticket}
                          className="rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[10px] font-bold tracking-widest text-emerald-400 uppercase shadow-sm transition-all hover:bg-emerald-500/20 disabled:opacity-40 focus:outline-none"
                        >
                          {demoingRecovery ? "GENERATING..." : "DEMO BEFORE/AFTER"}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`rounded-lg border p-4 ${getVerdictColor(impact.verdict)}`}>
                      <p className="mb-1 font-mono text-[9px] font-bold tracking-widest opacity-60 uppercase">
                        Algorithm Verdict
                      </p>
                      <p className="text-lg font-bold tracking-tight capitalize font-sans">
                        {impact.verdict.replaceAll("_", " ")}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-y border-zinc-800/60 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                          Weighted Impact
                        </p>
                        <p className={`text-2xl font-mono font-bold tracking-tight ${getDeltaColor(impact.improvement_percent)}`}>
                          {formatImpact(impact.improvement_percent)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1 border-l border-zinc-800/60 pl-4">
                        <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                          Efficacy
                        </p>
                        <p className="text-2xl font-mono font-bold tracking-tight text-indigo-400">
                          {impact.effectiveness_score}
                          <span className="text-sm text-zinc-600">/100</span>
                        </p>
                      </div>

                      <div className="col-span-2 mt-2 grid grid-cols-1 gap-3">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="flex flex-col gap-1.5 rounded border border-zinc-800/50 bg-zinc-950/50 p-2.5">
                            <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                              PM2.5 Shift
                            </p>
                            <p className="text-xs font-mono font-semibold text-zinc-300">
                              <span className="mr-1.5 opacity-40 line-through">
                                {impact.before_pm25_avg}
                              </span>
                              <span className="font-bold text-zinc-100">
                                → {impact.after_pm25_avg}
                              </span>
                            </p>
                            <p className={`text-[10px] font-mono font-bold ${getDeltaColor(impact.pm25_improvement_percent)}`}>
                              {formatImpact(impact.pm25_improvement_percent)}
                            </p>
                          </div>

                          <div className="flex flex-col gap-1.5 rounded border border-zinc-800/50 bg-zinc-950/50 p-2.5">
                            <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                              PM10 Shift
                            </p>
                            <p className="text-xs font-mono font-semibold text-zinc-300">
                              <span className="mr-1.5 opacity-40 line-through">
                                {impact.before_pm10_avg}
                              </span>
                              <span className="font-bold text-zinc-100">
                                → {impact.after_pm10_avg}
                              </span>
                            </p>
                            <p className={`text-[10px] font-mono font-bold ${getDeltaColor(impact.pm10_improvement_percent)}`}>
                              {formatImpact(impact.pm10_improvement_percent)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                          <div className="flex flex-col gap-1.5 rounded border border-zinc-800/50 bg-zinc-950/50 p-2.5">
                            <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
                              Noise Shift
                            </p>
                            <p className="text-xs font-mono font-semibold text-zinc-300">
                              <span className="mr-1.5 opacity-40 line-through">
                                {impact.before_noise_avg} dB
                              </span>
                              <span className="font-bold text-zinc-100">
                                → {impact.after_noise_avg} dB
                              </span>
                            </p>
                            <p className={`text-[10px] font-mono font-bold ${getDeltaColor(impact.noise_improvement_percent)}`}>
                              {formatImpact(impact.noise_improvement_percent)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="mb-4 text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                        Telemetry Baseline Comparison
                      </p>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-2">
                        <ImpactComparisonChart
                          before_pm25_avg={impact.before_pm25_avg}
                          after_pm25_avg={impact.after_pm25_avg}
                          before_pm10_avg={impact.before_pm10_avg}
                          after_pm10_avg={impact.after_pm10_avg}
                          before_noise_avg={impact.before_noise_avg}
                          after_noise_avg={impact.after_noise_avg}
                        />
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <button
                        onClick={handleEvaluateImpact}
                        disabled={evaluating || demoingRecovery}
                        className="rounded border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-[10px] font-bold tracking-widest text-zinc-300 uppercase shadow-sm transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-40 focus:outline-none"
                      >
                        {evaluating ? "RECALCULATING..." : "RECALCULATE IMPACT"}
                      </button>

                      {demoSimulationEnabled && (
                        <button
                          onClick={handleDemoRecovery}
                          disabled={evaluating || demoingRecovery || proofs.length === 0 || !ticket}
                          className="rounded border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-[10px] font-bold tracking-widest text-emerald-400 uppercase shadow-sm transition-colors hover:bg-emerald-500/20 hover:text-emerald-300 disabled:opacity-40 focus:outline-none"
                        >
                          {demoingRecovery ? "GENERATING..." : "DEMO BEFORE/AFTER"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
