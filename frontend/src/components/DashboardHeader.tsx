import Link from "next/link";

export default function DashboardHeader() {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WardPulse Command Center</h1>
        <p className="mt-2 text-gray-600">
          Hyperlocal Pollution Attribution + Mitigation Copilot
        </p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/"
          className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          Dashboard
        </Link>
        <Link
          href="/tickets"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          View Tickets
        </Link>
      </div>
    </div>
  );
}