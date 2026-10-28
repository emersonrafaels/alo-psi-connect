// Pure rules for turning Mercado Pago notifications/payments into appointment updates.

export type AppointmentPaymentUpdate = {
  status: string;
  payment_status: "pending_payment" | "paid" | "failed";
};

/** Maps a Mercado Pago payment status to the appointment fields. Null = leave as is. */
export function mapPaymentStatus(mpStatus: string | null | undefined): AppointmentPaymentUpdate | null {
  switch (mpStatus) {
    case "approved":
    case "authorized":
      return { status: "confirmado", payment_status: "paid" };
    case "rejected":
    case "cancelled":
    case "refunded":
    case "charged_back":
      return { status: "cancelado", payment_status: "failed" };
    case "pending":
    case "in_process":
    case "in_mediation":
      return { status: "pendente", payment_status: "pending_payment" };
    default:
      return null;
  }
}

/** Never downgrade an already paid appointment because of a late pending/rejected event. */
export function shouldApply(currentPaymentStatus: string | null | undefined, update: AppointmentPaymentUpdate): boolean {
  if (currentPaymentStatus === "paid" && update.payment_status !== "paid") return false;
  return true;
}

/** Picks the most relevant payment from a list (approved wins). */
export function pickBestPayment<T extends { status?: string }>(payments: T[]): T | null {
  if (!payments?.length) return null;
  return payments.find((p) => p.status === "approved") ?? payments[0];
}

export type ParsedNotification =
  | { kind: "payment"; id: string }
  | { kind: "merchant_order"; id: string }
  | { kind: "ignore" };

/** Accepts every Mercado Pago notification format (webhook v2, IPN query params, merchant_order). */
export function parseNotification(body: any, query: URLSearchParams): ParsedNotification {
  const topic = String(body?.type ?? body?.topic ?? query.get("type") ?? query.get("topic") ?? "");
  const action = String(body?.action ?? "");
  const id =
    body?.data?.id ?? query.get("data.id") ?? query.get("id") ??
    (typeof body?.resource === "string" ? body.resource.split("/").pop() : body?.resource);
  if (!id) return { kind: "ignore" };
  if (topic === "payment" || action.startsWith("payment.")) return { kind: "payment", id: String(id) };
  if (topic === "merchant_order" || topic === "topic_merchant_order_wh") return { kind: "merchant_order", id: String(id) };
  return { kind: "ignore" };
}
