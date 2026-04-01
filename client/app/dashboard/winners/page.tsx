"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, Loader2, Trophy, XCircle } from "lucide-react";
import {
  approveVerification,
  approveWinner,
  getPayoutRecords,
  getWinnerAuditLogs,
  getPendingVerifications,
  getWinners,
  payWinner,
  rejectVerification,
  rejectWinner,
  type PayoutRecordItem,
  type VerificationItem,
  type WinnerAuditLogItem,
  type WinnerItem,
  type WinnerStatus,
} from "@/services/api";

const statusStyles: Record<WinnerStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-sky-100 text-sky-700",
  rejected: "bg-rose-100 text-rose-700",
  paid: "bg-emerald-100 text-emerald-700",
};

const normalizeStatus = (status: string): WinnerStatus => {
  if (status === "approved" || status === "rejected" || status === "paid") {
    return status;
  }

  return "pending";
};

const formatStatusLabel = (status: WinnerStatus) =>
  `${status.charAt(0).toUpperCase()}${status.slice(1)}`;

const canApprove = (status: WinnerStatus) => status === "pending";
const canReject = (status: WinnerStatus) => status === "pending";
const canMarkPaid = (status: WinnerStatus) => status === "approved";

export default function WinnersPage() {
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [payoutRecords, setPayoutRecords] = useState<PayoutRecordItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<WinnerAuditLogItem[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [updating, setUpdating] = useState<{
    id: string;
    action: "approve" | "reject" | "pay";
  } | null>(null);
  const [updatingVerificationId, setUpdatingVerificationId] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 2200);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [toastMessage]);

  useEffect(() => {
    const loadWinners = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getWinners();
        setWinners(response.winners ?? []);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load winners.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadWinners();
  }, []);

  useEffect(() => {
    const loadVerifications = async () => {
      try {
        setVerificationLoading(true);
        const response = await getPendingVerifications();
        setVerifications(response.verifications ?? []);
      } catch {
        setVerifications([]);
      } finally {
        setVerificationLoading(false);
      }
    };

    loadVerifications();
  }, []);

  useEffect(() => {
    const loadLedger = async () => {
      try {
        setLedgerLoading(true);
        const [payoutResponse, auditResponse] = await Promise.all([
          getPayoutRecords(),
          getWinnerAuditLogs(),
        ]);

        setPayoutRecords(payoutResponse.payoutRecords || []);
        setAuditLogs(auditResponse.auditLogs || []);
      } catch {
        setPayoutRecords([]);
        setAuditLogs([]);
      } finally {
        setLedgerLoading(false);
      }
    };

    loadLedger();
  }, []);

  const pendingCount = useMemo(
    () => winners.filter((winner) => normalizeStatus(winner.status) === "pending").length,
    [winners],
  );

  const applyWinnerUpdate = (updatedWinner: WinnerItem) => {
    setWinners((prev) =>
      prev.map((winner) =>
        winner.id === updatedWinner.id ? { ...winner, ...updatedWinner } : winner,
      ),
    );
  };

  const handleStatusUpdate = async (
    winner: WinnerItem,
    nextStatus: WinnerStatus,
    request: (winnerId: string) => Promise<{ winner: WinnerItem }>,
    action: "approve" | "reject" | "pay",
    successMessage: string,
    confirmMessage?: string,
  ) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    const previousStatus = winner.status;
    setActionError("");
    setUpdating({ id: winner.id, action });

    // Optimistic update for instant feedback.
    applyWinnerUpdate({ ...winner, status: nextStatus });

    try {
      const response = await request(winner.id);
      applyWinnerUpdate(response.winner);
      setToastMessage(successMessage);
    } catch (updateError) {
      applyWinnerUpdate({ ...winner, status: previousStatus });
      const message =
        updateError instanceof Error ? updateError.message : "Failed to update winner status.";
      setActionError(message);
    } finally {
      setUpdating(null);
    }
  };

  const handleVerificationAction = async (
    verification: VerificationItem,
    action: "approve" | "reject",
  ) => {
    try {
      setUpdatingVerificationId(verification.id);
      setActionError("");

      if (action === "approve") {
        await approveVerification(verification.id);
        setToastMessage("Verification approved");
      } else {
        await rejectVerification(verification.id);
        setToastMessage("Verification rejected");
      }

      setVerifications((prev) => prev.filter((item) => item.id !== verification.id));
    } catch (verificationError) {
      const message =
        verificationError instanceof Error
          ? verificationError.message
          : "Failed to update verification.";
      setActionError(message);
    } finally {
      setUpdatingVerificationId(null);
    }
  };

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Winner Management
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review and manage winner payout lifecycle across draws.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
            <Trophy className="h-4 w-4 text-amber-500" />
            Pending approvals: {pendingCount}
          </div>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      {actionError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {actionError}
        </p>
      ) : null}

      {toastMessage ? (
        <div className="fixed right-6 top-20 z-50 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Winner ID</th>
                <th className="px-5 py-3 font-semibold">User ID</th>
                <th className="px-5 py-3 font-semibold">Draw ID</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500" colSpan={5}>
                    Loading winners...
                  </td>
                </tr>
              ) : winners.length === 0 ? (
                <tr>
                  <td className="px-5 py-10 text-center text-slate-500" colSpan={5}>
                    No winners available yet.
                  </td>
                </tr>
              ) : (
                winners.map((winner) => {
                  const normalizedStatus = normalizeStatus(winner.status);
                  const isRowUpdating = updating?.id === winner.id;
                  const isApproving = isRowUpdating && updating?.action === "approve";
                  const isRejecting = isRowUpdating && updating?.action === "reject";
                  const isPaying = isRowUpdating && updating?.action === "pay";

                  return (
                    <tr key={winner.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-medium text-slate-800">{winner.id}</td>
                      <td className="px-5 py-4 text-slate-700">{winner.user_id}</td>
                      <td className="px-5 py-4 text-slate-700">{winner.draw_id}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[normalizedStatus]}`}
                        >
                          {formatStatusLabel(normalizedStatus)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {normalizedStatus === "pending" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusUpdate(
                                  winner,
                                  "approved",
                                  approveWinner,
                                  "approve",
                                  "Winner approved",
                                )
                              }
                              disabled={isRowUpdating || !canApprove(normalizedStatus)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isApproving ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              Approve
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleStatusUpdate(
                                  winner,
                                  "rejected",
                                  rejectWinner,
                                  "reject",
                                  "Winner rejected",
                                  "Reject this winner? This action removes them from payout flow.",
                                )
                              }
                              disabled={isRowUpdating || !canReject(normalizedStatus)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isRejecting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              Reject
                            </button>
                          </div>
                        ) : null}

                        {normalizedStatus === "approved" ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusUpdate(
                                  winner,
                                  "paid",
                                  payWinner,
                                  "pay",
                                  "Payment completed",
                                  "Mark this winner as paid? This should be done after payment is confirmed.",
                                )
                              }
                              disabled={isRowUpdating || !canMarkPaid(normalizedStatus)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPaying ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CircleDollarSign className="h-3.5 w-3.5" />
                              )}
                              Mark as Paid
                            </button>
                          </div>
                        ) : null}

                        {normalizedStatus === "rejected" || normalizedStatus === "paid" ? (
                          <span className="text-xs font-medium text-slate-400">No actions</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-900">Pending Winner Verifications</h2>
          <p className="mt-1 text-sm text-slate-500">Review uploaded proof and decide approval status.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Verification ID</th>
                <th className="px-5 py-3 font-semibold">Winner ID</th>
                <th className="px-5 py-3 font-semibold">Proof</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {verificationLoading ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={4}>
                    Loading verifications...
                  </td>
                </tr>
              ) : verifications.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={4}>
                    No pending verifications.
                  </td>
                </tr>
              ) : (
                verifications.map((verification) => (
                  <tr key={verification.id} className="transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-slate-800">{verification.id}</td>
                    <td className="px-5 py-4 text-slate-700">{verification.winner_id}</td>
                    <td className="px-5 py-4">
                      <a
                        href={verification.proof_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-700 underline-offset-2 hover:underline"
                      >
                        View Proof
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerificationAction(verification, "approve")}
                          disabled={updatingVerificationId === verification.id}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Approve Proof
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerificationAction(verification, "reject")}
                          disabled={updatingVerificationId === verification.id}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Reject Proof
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Payout Records</h2>
            <p className="mt-1 text-sm text-slate-500">Financial trail of processed winner payouts.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Winner</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={4}>
                      Loading payout records...
                    </td>
                  </tr>
                ) : payoutRecords.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={4}>
                      No payout records yet.
                    </td>
                  </tr>
                ) : (
                  payoutRecords.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-slate-700">{row.winner_id}</td>
                      <td className="px-4 py-3 text-slate-700">${Number(row.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-700">{row.status}</td>
                      <td className="px-4 py-3 text-slate-700">{row.reference_code || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-900">Winner Audit Trail</h2>
            <p className="mt-1 text-sm text-slate-500">Status transition logs for governance and audits.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Winner</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">From</th>
                  <th className="px-4 py-3 font-semibold">To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ledgerLoading ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={4}>
                      Loading audit logs...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td className="px-4 py-4 text-slate-500" colSpan={4}>
                      No audit logs yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 text-slate-700">{row.winner_id}</td>
                      <td className="px-4 py-3 text-slate-700">{row.action}</td>
                      <td className="px-4 py-3 text-slate-700">{row.from_status || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{row.to_status || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
