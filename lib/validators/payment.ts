import { z } from "zod";
import { PaymentMethod, PaymentStatus } from "@/lib/generated/prisma/enums";

const requiredText = (fieldName: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} is too long`);

const optionalText = (maxLength: number) =>
  z
    .string()
    .trim()
    .max(maxLength)
    .optional()
    .catch(undefined)
    .transform((value) => (value === "" ? undefined : value));

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .catch(undefined)
  .transform((value) => (value === "" ? undefined : value))
  .pipe(z.string().url("Proof URL must be a valid URL").optional());

export const manualPaymentMethodSchema = z.enum([
  PaymentMethod.MANUAL_TRANSFER,
  PaymentMethod.PROMPTPAY,
]);

export const paymentCreateSchema = z
  .object({
    enrollmentId: requiredText("Enrollment", 120),
    amount: z.coerce
      .number()
      .finite("Amount must be a valid number")
      .positive("Amount must be greater than 0")
      .max(1_000_000, "Amount is too high"),
    method: manualPaymentMethodSchema,
    proofUrl: optionalUrl,
    note: optionalText(1_000),
  })
  .refine((input) => Boolean(input.proofUrl || input.note), {
    message: "Provide either proof URL or payment note",
    path: ["proofUrl"],
  });

export const parentPaymentCreateSchema = paymentCreateSchema.extend({
  studentId: requiredText("Student", 120),
});

export const paymentStatusUpdateSchema = z.object({
  paymentId: requiredText("Payment", 120),
  status: z.enum([
    PaymentStatus.PAID,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
  ]),
  returnTo: z.string().trim().max(500).optional().catch(undefined),
});

export const paymentFilterSchema = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  status: z
    .enum([
      PaymentStatus.PENDING,
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ])
    .optional()
    .catch(undefined),
  method: z
    .enum([
      PaymentMethod.MANUAL_TRANSFER,
      PaymentMethod.PROMPTPAY,
      PaymentMethod.CARD,
    ])
    .optional()
    .catch(undefined),
  studentId: z.string().trim().max(120).optional().catch(undefined),
  payerId: z.string().trim().max(120).optional().catch(undefined),
  courseId: z.string().trim().max(120).optional().catch(undefined),
  tutorId: z.string().trim().max(120).optional().catch(undefined),
  dateFrom: z.coerce.date().optional().catch(undefined),
  dateTo: z.coerce.date().optional().catch(undefined),
});

export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type ParentPaymentCreateInput = z.infer<typeof parentPaymentCreateSchema>;
export type PaymentStatusUpdateInput = z.infer<
  typeof paymentStatusUpdateSchema
>;
export type PaymentFilterInput = z.infer<typeof paymentFilterSchema>;
