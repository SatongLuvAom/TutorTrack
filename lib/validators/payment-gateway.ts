import { z } from "zod";

const requiredId = (fieldName: string) =>
  z.string().trim().min(1, `${fieldName} is required`).max(120);

export const createPromptPayPaymentSchema = z.object({
  enrollmentId: requiredId("Enrollment"),
  amount: z.coerce
    .number()
    .finite("Amount must be a valid number")
    .positive("Amount must be greater than 0")
    .max(1_000_000, "Amount is too high")
    .optional(),
});

export const paymentStatusQuerySchema = z.object({
  paymentId: requiredId("Payment"),
});

export const omiseWebhookSchema = z.object({
  id: requiredId("Webhook event").optional(),
  key: z.string().trim().min(1).max(120),
  data: z.object({
    id: requiredId("Charge"),
    object: z.string().trim().optional(),
  }),
});

export type CreatePromptPayPaymentInput = z.infer<
  typeof createPromptPayPaymentSchema
>;
export type PaymentStatusQueryInput = z.infer<typeof paymentStatusQuerySchema>;
export type OmiseWebhookInput = z.infer<typeof omiseWebhookSchema>;
