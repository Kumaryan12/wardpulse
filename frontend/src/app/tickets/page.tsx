"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

type Ticket = {
  id: number;
  node_id: string;
  location_name: string;
  ward_id: string;
  likely_source: string;
  urgency: string;
  target_team: string;
  status: string;
  assigned_to?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
};

const statusOptions = ["open", "assigned", "in_progress", "resolved", "closed"];

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  };

  const updateStatus = async (ticketId: number, current: Ticket, newStatus: string) => {
    try {
      await api.patch(`/tickets/${ticketId}`, {
        status: newStatus,
        assigned_to: current.assigned_to || current.target_team,
        remarks: current.remarks || "",
      });
      fetchTickets();
    } catch (error) {
      console.error("Failed to update ticket:", error);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="mb-6 text-3xl font-bold text-gray-900">WardPulse Action Tickets</h1>

      <div className="space-y-4">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Ticket #{ticket.id} — {ticket.node_id}
                </h2>
                <p className="text-sm text-gray-600">{ticket.location_name}</p>
                <p className="mt-2 text-sm text-gray-700">
                  <strong>Source:</strong> {ticket.likely_source.replaceAll("_", " ")}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Urgency:</strong> {ticket.urgency}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Target Team:</strong> {ticket.target_team}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Assigned To:</strong> {ticket.assigned_to || "Not assigned"}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Remarks:</strong> {ticket.remarks || "None"}
                </p>

                <div className="mt-4 flex gap-3">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Upload / View Proof
                  </Link>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                  {ticket.status}
                </span>

                <select
                  className="rounded-lg border px-3 py-2 text-sm"
                  value={ticket.status}
                  onChange={(e) => updateStatus(ticket.id, ticket, e.target.value)}
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Created: {new Date(ticket.created_at).toLocaleString()} | Updated:{" "}
              {new Date(ticket.updated_at).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}