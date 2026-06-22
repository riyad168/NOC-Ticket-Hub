export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";

// ─── Transfer hooks (not in generated client) ────────────────────────────────

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface TicketTransferRecord {
  id: number;
  ticketId: number;
  transferById: number;
  toUserId: number | null;
  toDeptId: number | null;
  remark: string;
  createdAt: string;
  transferBy: { id: number; name: string; email: string; role: string };
  toUser: { id: number; name: string; email: string; role: string } | null;
  toDept: { id: number; name: string } | null;
}

export interface TransferTicketInput {
  type: "user" | "department";
  targetId: number;
  remark: string;
}

export const getTicketTransfersQueryKey = (ticketId: number) =>
  [`/api/tickets/${ticketId}/transfers`] as const;

export function useGetTicketTransfers(ticketId: number) {
  return useQuery({
    queryKey: getTicketTransfersQueryKey(ticketId),
    queryFn: () =>
      customFetch<TicketTransferRecord[]>(`/api/tickets/${ticketId}/transfers`),
    enabled: !!ticketId,
  });
}

export function useTransferTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: number; data: TransferTicketInput }) =>
      customFetch<TicketTransferRecord>(`/api/tickets/${ticketId}/transfer`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, { ticketId }) => {
      qc.invalidateQueries({ queryKey: getTicketTransfersQueryKey(ticketId) });
      qc.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/recent-activity"] });
    },
  });
}
