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

function formatText(text: string) {
  return text.replaceAll("_", " ");
}

// Map urgency levels to our premium CSS variables
function getUrgencyStyles(urgency: string) {
  switch (urgency.toLowerCase()) {
    case "critical": return { color: "var(--wp-severe)", dim: "var(--wp-severe-dim)", border: "var(--wp-severe-border)" };
    case "high": return { color: "var(--wp-poor)", dim: "var(--wp-poor-dim)", border: "var(--wp-poor-border)" };
    case "medium": return { color: "var(--wp-moderate)", dim: "var(--wp-moderate-dim)", border: "var(--wp-moderate-border)" };
    default: return { color: "var(--wp-text-muted)", dim: "var(--wp-bg-overlay)", border: "var(--wp-border-hover)" }; // low
  }
}

// Map status levels to our premium CSS variables
function getStatusStyles(status: string) {
  switch (status.toLowerCase()) {
    case "resolved": 
    case "closed": return { color: "var(--wp-good)", dim: "var(--wp-good-dim)", border: "var(--wp-good-border)" };
    case "open": return { color: "var(--wp-severe)", dim: "var(--wp-severe-dim)", border: "var(--wp-severe-border)" };
    case "in_progress": return { color: "var(--wp-poor)", dim: "var(--wp-poor-dim)", border: "var(--wp-poor-border)" };
    default: return { color: "var(--wp-moderate)", dim: "var(--wp-moderate-dim)", border: "var(--wp-moderate-border)" }; // assigned
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
    <main className="min-h-screen bg-zinc-950 p-4 md:p-6 lg:p-8 text-zinc-50 font-sans selection:bg-indigo-500/30">
      <div className="mx-auto max-w-[1200px] flex flex-col gap-8">
        
        {/* TICKETS HEADER */}
        <header className="flex flex-col gap-4 border-b border-zinc-800/60 pb-6 md:flex-row md:items-end md:justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col gap-2">
            <Link 
              href="/" 
              className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-300 mb-2 inline-flex items-center gap-1.5 transition-colors"
            >
              <span className="font-mono text-xs">←</span> Command Center
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                Action Tickets
              </h1>
              <span className="rounded-md bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-xs font-mono font-medium text-zinc-400">
                {tickets.length} TOTAL
              </span>
            </div>
            <p className="text-sm font-medium text-zinc-500">
              Manage, assign, and verify mitigation workflows.
            </p>
          </div>
        </header>

        {/* LOADING STATE */}
        {isLoading && tickets.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-zinc-400"></div>
          </div>
        )}

        {/* EMPTY STATE */}
        {!isLoading && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-zinc-900/30 py-20 text-center animate-in fade-in duration-500">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Queue Empty</h3>
            <p className="mt-2 text-xs text-zinc-600">
              There are currently no active mitigation tickets.
            </p>
          </div>
        )}

        {/* TICKET LIST */}
        <div className="flex flex-col gap-4">
          {tickets.map((ticket, index) => {
            const urgencyStyles = getUrgencyStyles(ticket.urgency);
            const statusStyles = getStatusStyles(ticket.status);

            return (
              <div 
                key={ticket.id} 
                className="group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-0.5 animate-in slide-in-from-bottom-4 fade-in"
                style={{
                  background: "var(--wp-bg-panel)",
                  border: "1px solid var(--wp-border)",
                  borderRadius: 12,
                  boxShadow: "0 4px 20px -8px rgba(0,0,0,0.5)",
                  animationFillMode: "both",
                  animationDelay: `${index * 75}ms` // Cascading load effect
                }}
              >
                {/* Hover Glow */}
                <div 
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: `radial-gradient(circle at top right, var(--wp-bg-overlay), transparent 60%)` }}
                />

                <div className="relative z-10 flex flex-col p-5 gap-5 lg:flex-row lg:items-center lg:justify-between">
                  
                  {/* Left Area: Identification & Details */}
                  <div className="flex flex-col gap-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 px-1.5 py-0.5 rounded shadow-sm">
                        TKT-{ticket.id}
                      </span>
                      <span 
                        className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest shadow-sm"
                        style={{ background: urgencyStyles.dim, color: urgencyStyles.color, border: `1px solid ${urgencyStyles.border}` }}
                      >
                        {ticket.urgency} Urgency
                      </span>
                      
                    </div>

                    <div>
                      <h2 className="text-base font-semibold text-zinc-100 truncate" title={ticket.location_name}>
                        {ticket.location_name}
                      </h2>
                      <p className="text-[11px] font-medium text-zinc-400 mt-1 flex items-center gap-2">
                        <span className="font-mono text-zinc-500">{ticket.node_id}</span>
                        <span className="text-zinc-700">•</span>
                        <span className="capitalize">Source: <span className="text-zinc-300">{formatText(ticket.likely_source)}</span></span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs mt-1">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold uppercase tracking-widest text-zinc-600 text-[9px]">Target Team</span>
                        <span className="font-medium text-zinc-300 capitalize truncate">{formatText(ticket.target_team)}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-l border-zinc-800/60 pl-4">
                        <span className="font-bold uppercase tracking-widest text-zinc-600 text-[9px]">Assigned To</span>
                        <span className="font-medium text-zinc-300 truncate">{ticket.assigned_to || "Unassigned"}</span>
                      </div>
                      {ticket.remarks && (
                         <div className="flex flex-col gap-1 border-l border-zinc-800/60 pl-4 col-span-2 sm:col-span-1">
                           <span className="font-bold uppercase tracking-widest text-zinc-600 text-[9px]">Remarks</span>
                           <span className="font-medium text-zinc-400 truncate" title={ticket.remarks}>{ticket.remarks}</span>
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Right Area: Actions & Status */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:w-auto shrink-0 border-t border-zinc-800/60 lg:border-t-0 pt-4 lg:pt-0">
                    
                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                      <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Workflow Status</label>
                      <div className="relative">
                        <select
                          className="w-full sm:w-40 appearance-none rounded border py-1.5 pl-3 pr-8 text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none shadow-sm cursor-pointer"
                          style={{
                            background: statusStyles.dim,
                            color: statusStyles.color,
                            border: `1px solid ${statusStyles.border}`
                          }}
                          value={ticket.status}
                          onChange={(e) => updateStatus(ticket.id, ticket, e.target.value)}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status} className="bg-zinc-900 text-zinc-300 uppercase">
                              {formatText(status)}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2" style={{ color: statusStyles.color }}>
                          <svg className="h-3 w-3 fill-current opacity-70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Verification Action */}
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="w-full sm:w-auto mt-1 sm:mt-[22px] inline-flex items-center justify-center rounded border border-zinc-700 bg-zinc-800 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 shadow-sm transition-all hover:bg-zinc-700 hover:text-white focus:outline-none"
                    >
                      Verify Proof
                    </Link>

                  </div>
                </div>
                
                {/* Footer Meta */}
                <div 
                  className="px-5 py-2.5 flex items-center justify-between"
                  style={{ background: "var(--wp-bg-overlay)", borderTop: "1px solid var(--wp-border)" }}
                >
                  <p className="text-[9px] font-mono font-medium text-zinc-500 uppercase tracking-widest">
                    OPENED: {new Date(ticket.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                  </p>
                  <p className="text-[9px] font-mono font-medium text-zinc-500 uppercase tracking-widest">
                    UPDATED: {new Date(ticket.updated_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'})}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}