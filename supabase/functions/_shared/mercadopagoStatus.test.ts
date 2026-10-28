import { describe, it, expect } from "vitest";
import { mapPaymentStatus, shouldApply, parseNotification, pickBestPayment } from "./mercadopagoStatus";

describe("Mercado Pago status rules", () => {
  it("approved payment marks appointment as confirmed and paid", () => {
    expect(mapPaymentStatus("approved")).toEqual({ status: "confirmado", payment_status: "paid" });
  });
  it("rejected payment marks appointment as cancelled and failed", () => {
    expect(mapPaymentStatus("rejected")).toEqual({ status: "cancelado", payment_status: "failed" });
  });
  it("a paid appointment is never downgraded", () => {
    expect(shouldApply("paid", { status: "pendente", payment_status: "pending_payment" })).toBe(false);
    expect(shouldApply("pending_payment", { status: "confirmado", payment_status: "paid" })).toBe(true);
  });
  it("approved payment wins when several exist", () => {
    expect(pickBestPayment([{ status: "rejected" }, { status: "approved" }])?.status).toBe("approved");
  });
  it("understands IPN query format and webhook v2 format", () => {
    expect(parseNotification({}, new URLSearchParams("topic=payment&id=123"))).toEqual({ kind: "payment", id: "123" });
    expect(parseNotification({ action: "payment.updated", data: { id: 9 } }, new URLSearchParams())).toEqual({ kind: "payment", id: "9" });
    expect(parseNotification({ topic: "merchant_order", resource: "https://api.mercadolibre.com/merchant_orders/77" }, new URLSearchParams())).toEqual({ kind: "merchant_order", id: "77" });
  });
});
