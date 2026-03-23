"use client";

import { useEffect, useState } from "react";
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

export default function TicketProofPage() {
  const params = useParams();
  const ticketId = params.id;

  const [proofs, setProofs] = useState<ProofLog[]>([]);
  const [impact, setImpact] = useState<ImpactReport | null>(null);
  const [remarks, setRemarks] = useState("");
  const [beforeImage, setBeforeImage] = useState<File | null>(null);
  const [afterImage, setAfterImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProofs = async () => {
    try {
      const res = await api.get(`/proofs/${ticketId}`);
      setProofs(res.data);
    } catch (error) {
      console.error("Failed to fetch proofs:", error);
    }
  };

  const fetchImpact = async () => {
    try {
      const res = await api.get(`/impact/${ticketId}`);
      setImpact(res.data);
    } catch (error) {
      console.error("Impact report not available yet:", error);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    await Promise.all([fetchProofs(), fetchImpact()]);
    setIsLoading(false);
  };

  const handleUpload = async () => {
    try {
      setUploading(true);

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
      fetchProofs();
      alert("Proof uploaded successfully");
    } catch (error) {
      console.error("Proof upload failed:", error);
      alert("Failed to upload proof");
    } finally {
      setUploading(false);
    }
  };

  const handleEvaluateImpact = async () => {
    try {
      setEvaluating(true);
      const res = await api.post(`/impact/${ticketId}`);
      setImpact(res.data);
      alert("Impact report generated successfully");
    } catch (error) {
      console.error("Impact evaluation failed:", error);
      alert("Could not generate impact report yet. Ensure before and after readings exist.");
    } finally {
      setEvaluating(false);
    }
  };

  useEffect(() => {
    if (ticketId) loadData();
  }, [ticketId]);

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
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center transition-all hover:border-zinc-500 hover:bg-zinc-900 focus-within:ring-2 focus-within:ring-zinc-600 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      Before Intervention
                    </span>
                    <span className="mt-2 max-w-full truncate px-2 font-mono text-[10px] text-zinc-500">
                      {beforeImage ? beforeImage.name : "Select Image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setBeforeImage(e.target.files?.[0] || null)}
                    />
                  </label>

                  <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center transition-all hover:border-zinc-500 hover:bg-zinc-900 focus-within:ring-2 focus-within:ring-zinc-600 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                      After Intervention
                    </span>
                    <span className="mt-2 max-w-full truncate px-2 font-mono text-[10px] text-zinc-500">
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

              <CardFooter className="flex justify-end gap-3 border-t border-zinc-800/60 bg-zinc-900/20 py-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading || (!beforeImage && !afterImage && !remarks)}
                  className="rounded border border-zinc-700 bg-zinc-800 px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-100 shadow-sm transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
                >
                  {uploading ? "ENCRYPTING..." : "SUBMIT PROOF"}
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
                            src={`http://localhost:8000${proof.before_image_path}`}
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
                            src={`http://localhost:8000${proof.after_image_path}`}
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
                    Telemetry Impact
                  </CardTitle>
                  <Badge className="border border-indigo-500/20 bg-indigo-500/10 px-1.5 py-0.5 text-[9px] tracking-widest text-indigo-400 uppercase">
                    ✨ AI Eval
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-col gap-6 pt-5">
                {!impact ? (
                  <div className="flex flex-col items-center gap-4 py-10 text-center">
                    <p className="max-w-[80%] font-mono text-xs leading-relaxed text-zinc-500">
                      System standing by. Upload field proof and ensure delta telemetry
                      data exists to generate automated impact analysis.
                    </p>
                    <button
                      onClick={handleEvaluateImpact}
                      disabled={evaluating}
                      className="mt-2 rounded border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-[10px] font-bold tracking-widest text-indigo-400 uppercase shadow-sm transition-all hover:bg-indigo-500/20 disabled:opacity-40 focus:outline-none"
                    >
                      {evaluating ? "COMPUTING..." : "TRIGGER ANALYSIS"}
                    </button>
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
                          Combined Delta
                        </p>
                        <p className={`text-2xl font-mono font-bold tracking-tight ${getDeltaColor(impact.improvement_percent)}`}>
                          {impact.improvement_percent > 0 ? "+" : ""}
                          {impact.improvement_percent}%
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
                              {impact.pm25_improvement_percent > 0 ? "+" : ""}
                              {impact.pm25_improvement_percent}%
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
                              {impact.pm10_improvement_percent > 0 ? "+" : ""}
                              {impact.pm10_improvement_percent}%
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
                              {impact.noise_improvement_percent > 0 ? "+" : ""}
                              {impact.noise_improvement_percent}%
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
                        />
                      </div>
                    </div>

                    <button
                      onClick={handleEvaluateImpact}
                      disabled={evaluating}
                      className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-[10px] font-bold tracking-widest text-zinc-300 uppercase shadow-sm transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-40 focus:outline-none"
                    >
                      {evaluating ? "RECALCULATING..." : "RECALCULATE IMPACT DATA"}
                    </button>
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