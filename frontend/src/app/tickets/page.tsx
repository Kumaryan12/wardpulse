"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

function formatText(text: string) {
  return text.replaceAll("_", " ");
}

// Map urgency levels to our Badge variants
function getUrgencyVariant(urgency: string) {
  switch (urgency.toLowerCase()) {
    case "critical": return "critical";
    case "high": return "warning";
    case "medium": return "neutral";
    default: return "default"; // low
  }
}

// Map status levels to our Badge variants to give visual cues
function getStatusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "resolved": 
    case "closed": return "stable";
    case "open": return "critical";
    case "in_progress": return "warning";
    default: return "neutral"; // assigned
  }
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/tickets");
      setTickets(res.data);
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    } finally {
      setIsLoading(false);
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
    <main className="min-h-screen bg-slate-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-[1200px] flex flex-col gap-6">
        
        {/* TICKETS HEADER */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-1.5">
            <Link 
              href="/" 
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 mb-2 inline-flex items-center gap-1 transition-colors"
            >
              ← Back to Command Center
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Action Tickets
              </h1>
              <Badge variant="neutral" className="text-xs">
                {tickets.length} Total
              </Badge>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Manage, assign, and verify mitigation workflows.
            </p>
          </div>
        </header>

        {/* LOADING STATE */}
        {isLoading && tickets.length === 0 && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 py-16 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No active tickets</h3>
            <p className="mt-1 text-sm text-slate-500">
              The mitigation queue is currently empty.
            </p>
          </div>
        )}

        {/* TICKET LIST */}
        <div className="flex flex-col gap-3">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="transition-all hover:shadow-md hover:border-slate-300 overflow-hidden">
              <div className="flex flex-col p-5 gap-5 lg:flex-row lg:items-center lg:justify-between">
                
                {/* Left Area: Identification & Details */}
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      TKT-{ticket.id}
                    </span>
                    <Badge variant={getUrgencyVariant(ticket.urgency)} className="capitalize px-1.5 py-0.5 text-[10px]">
                      {ticket.urgency} Urgency
                    </Badge>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Ward {ticket.ward_id}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-semibold text-slate-900 truncate" title={ticket.location_name}>
                      {ticket.location_name}
                    </h2>
                    <p className="text-xs font-medium text-slate-500 mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono">{ticket.node_id}</span>
                      <span>•</span>
                      <span className="capitalize">Source: {formatText(ticket.likely_source)}</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Target Team</span>
                      <span className="font-medium text-slate-700 capitalize">{formatText(ticket.target_team)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-4">
                      <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Assigned To</span>
                      <span className="font-medium text-slate-700">{ticket.assigned_to || "Unassigned"}</span>
                    </div>
                    {ticket.remarks && (
                       <div className="flex flex-col gap-0.5 border-l border-slate-200 pl-4 max-w-[200px]">
                         <span className="font-bold uppercase tracking-wider text-slate-400 text-[9px]">Remarks</span>
                         <span className="font-medium text-slate-700 truncate" title={ticket.remarks}>{ticket.remarks}</span>
                       </div>
                    )}
                  </div>
                </div>

                {/* Right Area: Actions & Status */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:w-auto shrink-0 border-t border-slate-100 lg:border-t-0 pt-4 lg:pt-0">
                  
                  {/* Status Dropdown */}
                  <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Workflow Status</label>
                    <div className="relative">
                      <select
                        className={`w-full appearance-none rounded-md border py-1.5 pl-3 pr-8 text-xs font-semibold capitalize transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          ticket.status === 'open' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                          ticket.status === 'resolved' || ticket.status === 'closed' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                        value={ticket.status}
                        onChange={(e) => updateStatus(ticket.id, ticket, e.target.value)}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {formatText(status)}
                          </option>
                        ))}
                      </select>
                      {/* Custom Arrow for Select */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-3 w-3 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Verification Action */}
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="w-full sm:w-auto mt-1 sm:mt-4 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    View / Verify Proof
                  </Link>

                </div>
              </div>
              
              {/* Footer Meta */}
              <div className="bg-slate-50/50 border-t border-slate-100 px-5 py-2 flex items-center justify-between">
                <p className="text-[10px] font-medium text-slate-400">
                  Opened: {new Date(ticket.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                </p>
                <p className="text-[10px] font-medium text-slate-400">
                  Updated: {new Date(ticket.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                </p>
              </div>
            </Card>
          ))}
        </div>

      </div>
    </main>
  );
}