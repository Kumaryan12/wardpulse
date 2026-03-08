"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import ImpactComparisonChart from "@/components/ImpactComparisonChart";
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

  const handleUpload = async () => {
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("remarks", remarks);
      if (beforeImage) formData.append("before_image", beforeImage);
      if (afterImage) formData.append("after_image", afterImage);

      await api.post(`/proofs/${ticketId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
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
    fetchProofs();
    fetchImpact();
  }, [ticketId]);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Proof Logs for Ticket #{ticketId}
        </h1>
        <Link
          href="/tickets"
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Back to Tickets
        </Link>
      </div>

      <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Upload Proof</h2>

        <div className="mt-4 grid gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Before Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBeforeImage(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              After Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAfterImage(e.target.files?.[0] || null)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full rounded-xl border p-3"
              rows={4}
              placeholder="Describe action taken..."
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Proof"}
            </button>

            <button
              onClick={handleEvaluateImpact}
              disabled={evaluating}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {evaluating ? "Evaluating..." : "Generate Impact Report"}
            </button>
          </div>
        </div>
      </div>

      {impact && (
        <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">Impact Report</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Before PM2.5 Avg</p>
              <p className="text-lg font-bold text-gray-900">{impact.before_pm25_avg}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">After PM2.5 Avg</p>
              <p className="text-lg font-bold text-gray-900">{impact.after_pm25_avg}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Improvement %</p>
              <p className="text-lg font-bold text-gray-900">{impact.improvement_percent}%</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Before PM10 Avg</p>
              <p className="text-lg font-bold text-gray-900">{impact.before_pm10_avg}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">After PM10 Avg</p>
              <p className="text-lg font-bold text-gray-900">{impact.after_pm10_avg}</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-600">Effectiveness Score</p>
              <p className="text-lg font-bold text-gray-900">{impact.effectiveness_score}</p>
            </div>
          </div>
          <div className="mt-6">
  <ImpactComparisonChart
    before_pm25_avg={impact.before_pm25_avg}
    after_pm25_avg={impact.after_pm25_avg}
    before_pm10_avg={impact.before_pm10_avg}
    after_pm10_avg={impact.after_pm10_avg}
  />
</div>

          <div className="mt-4 rounded-xl bg-green-50 p-4">
            <p className="text-sm text-gray-600">Verdict</p>
            <p className="text-lg font-bold capitalize text-green-800">
              {impact.verdict.replaceAll("_", " ")}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {proofs.map((proof) => (
          <div key={proof.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-700">
              <strong>Remarks:</strong> {proof.remarks || "None"}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Before</p>
                {proof.before_image_path ? (
                  <img
                    src={`http://localhost:8000${proof.before_image_path}`}
                    alt="Before"
                    className="rounded-xl border"
                  />
                ) : (
                  <p className="text-sm text-gray-500">No before image</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">After</p>
                {proof.after_image_path ? (
                  <img
                    src={`http://localhost:8000${proof.after_image_path}`}
                    alt="After"
                    className="rounded-xl border"
                  />
                ) : (
                  <p className="text-sm text-gray-500">No after image</p>
                )}
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Uploaded: {new Date(proof.uploaded_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}