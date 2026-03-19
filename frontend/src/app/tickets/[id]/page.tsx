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
  improvement_percent: number;
  effectiveness_score: number;
  verdict: string;
  created_at: string;
};

// Premium dark mode translucent badges for AI verdicts
function getVerdictColor(verdict: string) {
  const v = verdict.toLowerCase();
  if (v.includes("highly") || v.includes("success")) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
  if (v.includes("marginal") || v.includes("partial")) return "bg-amber-500/10 border-amber-500/20 text-amber-400";
  return "bg-red-500/10 border-red-500/20 text-red-400"; // failed or negative
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
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Decrypting Evidence...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 p-4 md:p-6 lg:p-8 text-zinc-50 font-sans selection:bg-indigo-500/30">
      <div className="mx-auto max-w-[1400px] flex flex-col gap-8 animate-in fade-in duration-500">
        
        {/* PAGE HEADER */}
        <header className="flex flex-col gap-4 border-b border-zinc-800/60 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <Link 
              href="/tickets" 
              className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 mb-2 inline-flex items-center gap-1.5 transition-colors"
            >
              <span className="font-mono text-xs">←</span> Action Queue
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                Verification & Impact Report
              </h1>
              <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-xs font-mono font-medium text-zinc-400">
                TKT-{ticketId}
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-500">
              Upload field evidence and trigger AI-driven telemetry evaluation.
            </p>
          </div>
        </header>

        {/* SPLIT BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Field Operations (Spans 7 columns) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* UPLOAD PANEL */}
            <Card className="border-zinc-800 bg-zinc-900/40 shadow-xl backdrop-blur-sm animate-in slide-in-from-bottom-4 fade-in">
              <CardHeader className="border-b border-zinc-800/60 pb-4">
                <CardTitle className="text-base tracking-wide text-zinc-200 uppercase text-[13px]">Log Field Evidence</CardTitle>
              </CardHeader>
              <CardContent className="pt-5 flex flex-col gap-5">
                
                {/* Premium Dark Drop-Zones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center transition-all hover:bg-zinc-900 hover:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-600 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">Before Intervention</span>
                    <span className="mt-2 text-[10px] font-mono text-zinc-500 truncate max-w-full px-2">
                      {beforeImage ? beforeImage.name : "Select Image"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setBeforeImage(e.target.files?.[0] || null)} />
                  </label>

                  <label className="relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/50 p-6 text-center transition-all hover:bg-zinc-900 hover:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-600 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">After Intervention</span>
                    <span className="mt-2 text-[10px] font-mono text-zinc-500 truncate max-w-full px-2">
                      {afterImage ? afterImage.name : "Select Image"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setAfterImage(e.target.files?.[0] || null)} />
                  </label>
                </div>

                {/* Remarks Textarea */}
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    Field Protocol Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full rounded-md border border-zinc-800 bg-zinc-950/50 p-3 text-sm text-zinc-300 font-mono focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-700 transition-colors"
                    rows={3}
                    placeholder="Input execution log..."
                  />
                </div>

              </CardContent>
              <CardFooter className="border-t border-zinc-800/60 bg-zinc-900/20 py-3 flex justify-end gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading || (!beforeImage && !afterImage && !remarks)}
                  className="rounded px-4 py-2 text-xs font-bold uppercase tracking-widest text-zinc-100 bg-zinc-800 border border-zinc-700 transition-all hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm focus:outline-none"
                >
                  {uploading ? "ENCRYPTING..." : "SUBMIT PROOF"}
                </button>
              </CardFooter>
            </Card>

            {/* PROOF HISTORY LOG */}
            {proofs.length > 0 && (
              <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-8 fade-in duration-700">
                <h3 className="text-[11px] font-bold tracking-widest text-zinc-500 uppercase mt-4">Verified Proof Ledger</h3>
                {proofs.map((proof) => (
                  <Card key={proof.id} className="overflow-hidden border-zinc-800 bg-zinc-900/40">
                    <div className="grid grid-cols-2 gap-px bg-zinc-800">
                      
                      {/* Before Image */}
                      <div className="relative aspect-video bg-zinc-950">
                        <div className="absolute top-2 left-2 z-10 rounded border border-zinc-700/50 bg-zinc-900/80 px-2 py-0.5 text-[9px] font-bold tracking-widest text-zinc-300 backdrop-blur-md uppercase shadow-sm">
                          Before
                        </div>
                        {proof.before_image_path ? (
                          <img src={`http://localhost:8000${proof.before_image_path}`} alt="Before" className="h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-mono text-zinc-700 uppercase tracking-widest">No Signal</div>
                        )}
                      </div>

                      {/* After Image */}
                      <div className="relative aspect-video bg-zinc-950">
                        <div className="absolute top-2 left-2 z-10 rounded border border-zinc-700/50 bg-zinc-900/80 px-2 py-0.5 text-[9px] font-bold tracking-widest text-zinc-300 backdrop-blur-md uppercase shadow-sm">
                          After
                        </div>
                        {proof.after_image_path ? (
                          <img src={`http://localhost:8000${proof.after_image_path}`} alt="After" className="h-full w-full object-cover opacity-80 transition-opacity hover:opacity-100" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] font-mono text-zinc-700 uppercase tracking-widest">No Signal</div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-zinc-900/30">
                      <p className="text-sm font-medium text-zinc-300">
                        <span className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mr-2">Logs:</span>
                        {proof.remarks || "Null."}
                      </p>
                      <p className="mt-3 text-[9px] font-mono font-medium uppercase text-zinc-600 tracking-widest">
                        TIMESTAMP: {new Date(proof.uploaded_at).toLocaleString()}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: AI Impact Report (Spans 5 columns, sticky) */}
          <div className="lg:col-span-5 sticky top-8 animate-in slide-in-from-right-8 fade-in duration-700">
            <Card className="border-zinc-800 shadow-2xl bg-zinc-900/60 backdrop-blur-md overflow-hidden relative">
              
              {/* Subtle AI Top Glow */}
              <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0"></div>

              <CardHeader className="bg-zinc-950/30 border-b border-zinc-800/60 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base tracking-wide text-zinc-100 uppercase text-[13px]">Telemetry Impact</CardTitle>
                  <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 text-[9px] uppercase tracking-widest">
                    ✨ AI Eval
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-5 flex flex-col gap-6">
                {!impact ? (
                  <div className="flex flex-col items-center text-center py-10 gap-4">
                    <p className="text-xs font-mono text-zinc-500 leading-relaxed max-w-[80%]">
                      System standing by. Upload field proof and ensure delta telemetry data exists to generate automated impact analysis.
                    </p>
                    <button
                      onClick={handleEvaluateImpact}
                      disabled={evaluating}
                      className="rounded border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 shadow-sm transition-all hover:bg-indigo-500/20 disabled:opacity-40 focus:outline-none mt-2"
                    >
                      {evaluating ? "COMPUTING..." : "TRIGGER ANALYSIS"}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Primary Verdict Banner */}
                    <div className={`rounded-lg border p-4 ${getVerdictColor(impact.verdict)}`}>
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 mb-1 font-mono">Algorithm Verdict</p>
                      <p className="text-lg font-bold capitalize tracking-tight font-sans">
                        {impact.verdict.replaceAll("_", " ")}
                      </p>
                    </div>

                    {/* Dense Data Grid */}
                    <div className="grid grid-cols-2 gap-4 border-y border-zinc-800/60 py-5">
                      <div className="flex flex-col gap-1">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Delta</p>
                        <p className={`text-2xl font-mono font-bold tracking-tight ${impact.improvement_percent > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {impact.improvement_percent > 0 ? '+' : ''}{impact.improvement_percent}%
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 border-l border-zinc-800/60 pl-4">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Efficacy</p>
                        <p className="text-2xl font-mono font-bold tracking-tight text-indigo-400">
                          {impact.effectiveness_score}<span className="text-sm text-zinc-600">/100</span>
                        </p>
                      </div>
                      
                      <div className="col-span-2 grid grid-cols-2 gap-3 mt-2">
                        <div className="bg-zinc-950/50 border border-zinc-800/50 p-2.5 rounded flex flex-col gap-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">PM2.5 Shift</p>
                          <p className="text-xs font-mono font-semibold text-zinc-300">
                            <span className="line-through opacity-40 mr-1.5">{impact.before_pm25_avg}</span>
                            <span className="text-zinc-100 font-bold">→ {impact.after_pm25_avg}</span>
                          </p>
                        </div>
                        <div className="bg-zinc-950/50 border border-zinc-800/50 p-2.5 rounded flex flex-col gap-1.5">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">PM10 Shift</p>
                          <p className="text-xs font-mono font-semibold text-zinc-300">
                            <span className="line-through opacity-40 mr-1.5">{impact.before_pm10_avg}</span>
                            <span className="text-zinc-100 font-bold">→ {impact.after_pm10_avg}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Chart Container */}
                    <div className="pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4">Telemetry Baseline Comparison</p>
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
                      className="mt-2 w-full rounded border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 shadow-sm transition-colors hover:bg-zinc-700 hover:text-white disabled:opacity-40 focus:outline-none"
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