"use client";

type BriefData = {
  node_id: string;
  location_name: string;
  officer_brief: string;
  citizen_advisory: string;
  escalation_note: string;
};

type AIBriefPanelProps = {
  data: BriefData;
  onClose: () => void;
};

export default function AIBriefPanel({ data, onClose }: AIBriefPanelProps) {
  return (
    <div className="mt-4 rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">AI Brief Generator</h3>
          <p className="text-sm text-gray-600">
            Generated response bundle for {data.node_id} — {data.location_name}
          </p>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
        >
          Close
        </button>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="mb-2 text-sm font-semibold text-blue-800">Officer Brief</p>
          <p className="text-sm leading-6 text-gray-800">{data.officer_brief}</p>
        </div>

        <div className="rounded-xl bg-green-50 p-4">
          <p className="mb-2 text-sm font-semibold text-green-800">Citizen Advisory</p>
          <p className="text-sm leading-6 text-gray-800">{data.citizen_advisory}</p>
        </div>

        <div className="rounded-xl bg-red-50 p-4">
          <p className="mb-2 text-sm font-semibold text-red-800">Escalation Note</p>
          <p className="text-sm leading-6 text-gray-800">{data.escalation_note}</p>
        </div>
      </div>
    </div>
  );
}