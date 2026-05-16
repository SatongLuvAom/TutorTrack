import { describe, expect, it } from "vitest";
import {
  EnrollmentStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  UserRole,
} from "../lib/generated/prisma/enums";
import {
  paymentCreateSchema,
  paymentStatusUpdateSchema,
} from "../lib/validators/payment";
import {
  adminVerifyPayment,
  applyGatewayChargeStatus,
  canTransitionPaymentStatus,
  createPromptPayPayment,
  createParentChildPayment,
  createStudentPayment,
  PaymentManagementError,
  type PaymentListItem,
  type PaymentWriteStore,
} from "../services/payment.service";
import type { OmiseClient, OmiseCharge } from "../services/payment-gateway/omise.service";

const validPaymentInput = {
  enrollmentId: "enrollment-1",
  amount: 1200,
  method: PaymentMethod.MANUAL_TRANSFER,
  proofUrl: "https://files.tutortrack.test/slip.jpg",
  note: undefined,
} as const;

const studentUser = {
  id: "student-user-1",
  role: UserRole.STUDENT,
  studentProfileId: "student-1",
};

const parentUser = {
  id: "parent-user-1",
  role: UserRole.PARENT,
  parentProfileId: "parent-1",
};

const tutorUser = {
  id: "tutor-user-1",
  role: UserRole.TUTOR,
  tutorProfileId: "tutor-1",
};

function createFakeOmiseCharge(overrides: Partial<OmiseCharge> = {}): OmiseCharge {
  return {
    id: "chrg_test_promptpay",
    amount: 120000,
    currency: "THB",
    status: "pending",
    paid: false,
    expired: false,
    paid_at: null,
    expires_at: "2026-05-10T02:00:00Z",
    authorize_uri: null,
    source: {
      id: "src_test_promptpay",
      type: "promptpay",
      scannable_code: {
        image: {
          download_uri: "https://api.omise.co/qrcode.png",
        },
      },
    },
    ...overrides,
  };
}

function createFakeOmiseClient(charge: OmiseCharge): OmiseClient {
  return {
    async createPromptPayCharge() {
      return charge;
    },
    async retrieveCharge() {
      return charge;
    },
  };
}

function makePaymentStore(): PaymentWriteStore {
  type FakeEnrollment = NonNullable<
    Awaited<ReturnType<PaymentWriteStore["getEnrollmentForPayment"]>>
  >;
  const enrollments = new Map<string, FakeEnrollment>([
    [
      "enrollment-1",
      {
        id: "enrollment-1",
        studentId: "student-1",
        courseId: "course-1",
        status: EnrollmentStatus.PENDING,
        course: {
          id: "course-1",
          title: "Math M.4 Intensive",
          priceCents: 120000,
          tutor: {
            id: "tutor-1",
            user: { name: "Tutor One", email: "tutor1@tutortrack.test" },
          },
        },
        student: {
          id: "student-1",
          displayName: "Student One",
          user: { name: "Student One", email: "student1@tutortrack.test" },
        },
      },
    ],
    [
      "enrollment-2",
      {
        id: "enrollment-2",
        studentId: "student-2",
        courseId: "course-1",
        status: EnrollmentStatus.PENDING,
        course: {
          id: "course-1",
          title: "Math M.4 Intensive",
          priceCents: 120000,
          tutor: {
            id: "tutor-1",
            user: { name: "Tutor One", email: "tutor1@tutortrack.test" },
          },
        },
        student: {
          id: "student-2",
          displayName: "Student Two",
          user: { name: "Student Two", email: "student2@tutortrack.test" },
        },
      },
    ],
    [
      "enrollment-cancelled",
      {
        id: "enrollment-cancelled",
        studentId: "student-1",
        courseId: "course-1",
        status: EnrollmentStatus.CANCELLED,
        course: {
          id: "course-1",
          title: "Math M.4 Intensive",
          priceCents: 120000,
          tutor: {
            id: "tutor-1",
            user: { name: "Tutor One", email: "tutor1@tutortrack.test" },
          },
        },
        student: {
          id: "student-1",
          displayName: "Student One",
          user: { name: "Student One", email: "student1@tutortrack.test" },
        },
      },
    ],
  ]);
  const payments = new Map<string, PaymentListItem>();
  let nextPaymentNumber = 1;

  const store: PaymentWriteStore = {
    async getStudentProfileByUserId(studentUserId) {
      if (studentUserId === "student-user-1") {
        return { id: "student-1" };
      }

      if (studentUserId === "student-user-2") {
        return { id: "student-2" };
      }

      return null;
    },

    async getParentProfileByUserId(parentUserId) {
      if (parentUserId === "parent-user-1") {
        return { id: "parent-1" };
      }

      if (parentUserId === "parent-user-inactive") {
        return { id: "parent-inactive" };
      }

      return null;
    },

    async hasActiveParentStudentLink(parentId, studentId) {
      return parentId === "parent-1" && studentId === "student-1";
    },

    async getEnrollmentForPayment(enrollmentId) {
      return enrollments.get(enrollmentId) ?? null;
    },

    async countPendingPaymentsForEnrollment(enrollmentId) {
      return Array.from(payments.values()).filter(
        (payment) =>
          payment.enrollmentId === enrollmentId &&
          payment.status === PaymentStatus.PENDING,
      ).length;
    },

    async createPayment(data) {
      const enrollment = enrollments.get(data.enrollmentId);

      if (!enrollment) {
        throw new Error("Missing fake enrollment");
      }

      const payment: PaymentListItem = {
        id: `payment-${nextPaymentNumber++}`,
        payer: {
          id: data.payerId,
          name: data.payerId,
          email: `${data.payerId}@example.test`,
        },
        student: {
          id: enrollment.student.id,
          name: enrollment.student.user.name,
          email: enrollment.student.user.email,
          displayName: enrollment.student.displayName,
        },
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          tutor: {
            id: enrollment.course.tutor.id,
            name: enrollment.course.tutor.user.name,
            email: enrollment.course.tutor.user.email,
          },
        },
        enrollmentId: data.enrollmentId,
        enrollmentStatus: enrollment.status,
        amountCents: data.amountCents,
        method: data.method,
        status: data.status,
        provider: data.provider ?? PaymentProvider.MANUAL,
        providerChargeId: null,
        providerSourceId: null,
        providerStatus: null,
        expiresAt: null,
        failedAt: null,
        webhookEventId: null,
        lastWebhookAt: null,
        proofUrl: data.proofUrl,
        note: data.note,
        paidAt: null,
        createdAt: new Date("2026-05-10T00:00:00.000Z"),
        updatedAt: new Date("2026-05-10T00:00:00.000Z"),
      };

      payments.set(payment.id, payment);

      return payment;
    },

    async getPaymentForVerification(paymentId) {
      const payment = payments.get(paymentId);

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        status: payment.status,
        provider: payment.provider,
        paidAt: payment.paidAt,
        enrollmentId: payment.enrollmentId,
        enrollmentStatus: payment.enrollmentStatus,
      };
    },

    async updatePaymentStatus(paymentId, data) {
      const payment = payments.get(paymentId);

      if (!payment) {
        throw new Error("Missing fake payment");
      }

      const updated: PaymentListItem = {
        ...payment,
        status: data.status,
        paidAt: "paidAt" in data ? (data.paidAt ?? null) : payment.paidAt,
        updatedAt: new Date("2026-05-10T01:00:00.000Z"),
      };

      payments.set(paymentId, updated);

      return updated;
    },

    async updatePaymentGatewayReference(paymentId, data) {
      const payment = payments.get(paymentId);

      if (!payment) {
        throw new Error("Missing fake payment");
      }

      const updated: PaymentListItem = {
        ...payment,
        providerChargeId: data.providerChargeId,
        providerSourceId: data.providerSourceId,
        providerStatus: data.providerStatus,
        expiresAt: data.expiresAt,
        updatedAt: new Date("2026-05-10T01:00:00.000Z"),
      };

      payments.set(paymentId, updated);

      return updated;
    },

    async getPaymentForGatewayCharge(providerChargeId) {
      const payment = Array.from(payments.values()).find(
        (candidate) => candidate.providerChargeId === providerChargeId,
      );

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        status: payment.status,
        provider: payment.provider,
        paidAt: payment.paidAt,
        enrollmentId: payment.enrollmentId,
        enrollmentStatus: payment.enrollmentStatus,
      };
    },

    async updatePaymentFromGateway(paymentId, data) {
      const payment = payments.get(paymentId);

      if (!payment) {
        throw new Error("Missing fake payment");
      }

      const updated: PaymentListItem = {
        ...payment,
        status: data.status,
        paidAt: "paidAt" in data ? (data.paidAt ?? null) : payment.paidAt,
        failedAt: "failedAt" in data ? (data.failedAt ?? null) : payment.failedAt,
        providerStatus: data.providerStatus,
        webhookEventId: data.webhookEventId,
        lastWebhookAt: data.lastWebhookAt,
        updatedAt: new Date("2026-05-10T01:00:00.000Z"),
      };

      payments.set(paymentId, updated);

      return updated;
    },

    async updateEnrollmentStatus(enrollmentId, data) {
      const enrollment = enrollments.get(enrollmentId);

      if (enrollment) {
        enrollments.set(enrollmentId, {
          ...enrollment,
          status: data.status,
        });
      }

      for (const [paymentId, payment] of payments.entries()) {
        if (payment.enrollmentId === enrollmentId) {
          payments.set(paymentId, {
            ...payment,
            enrollmentStatus: data.status,
          });
        }
      }
    },

    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

describe("payment validation", () => {
  it("rejects invalid payment input", () => {
    expect(paymentCreateSchema.safeParse(validPaymentInput).success).toBe(true);
    expect(
      paymentCreateSchema.safeParse({ ...validPaymentInput, amount: 0 }).success,
    ).toBe(false);
    expect(
      paymentCreateSchema.safeParse({
        ...validPaymentInput,
        proofUrl: "not-a-url",
      }).success,
    ).toBe(false);
    expect(
      paymentCreateSchema.safeParse({
        ...validPaymentInput,
        proofUrl: undefined,
        note: undefined,
      }).success,
    ).toBe(false);
    expect(
      paymentCreateSchema.safeParse({
        ...validPaymentInput,
        method: PaymentMethod.CARD,
      }).success,
    ).toBe(false);
  });

  it("validates admin status updates", () => {
    expect(
      paymentStatusUpdateSchema.safeParse({
        paymentId: "payment-1",
        status: PaymentStatus.PAID,
      }).success,
    ).toBe(true);
    expect(
      paymentStatusUpdateSchema.safeParse({
        paymentId: "payment-1",
        status: PaymentStatus.PENDING,
      }).success,
    ).toBe(false);
  });
});

describe("manual payment service", () => {
  it("allows a student to create a pending payment for own enrollment", async () => {
    const store = makePaymentStore();
    const payment = await createStudentPayment(
      "student-user-1",
      "enrollment-1",
      validPaymentInput,
      store,
    );

    expect(payment.status).toBe(PaymentStatus.PENDING);
    expect(payment.amountCents).toBe(120000);
    expect(payment.payer.id).toBe("student-user-1");
  });

  it("blocks student payments for another student's enrollment", async () => {
    const store = makePaymentStore();

    await expect(
      createStudentPayment(
        "student-user-2",
        "enrollment-1",
        validPaymentInput,
        store,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("allows a parent to create payment for an active linked child", async () => {
    const store = makePaymentStore();
    const payment = await createParentChildPayment(
      "parent-user-1",
      "student-1",
      "enrollment-1",
      validPaymentInput,
      store,
    );

    expect(payment.payer.id).toBe("parent-user-1");
    expect(payment.student?.id).toBe("student-1");
  });

  it("blocks parent payments for unrelated or inactive child links", async () => {
    const store = makePaymentStore();

    await expect(
      createParentChildPayment(
        "parent-user-1",
        "student-2",
        "enrollment-2",
        validPaymentInput,
        store,
      ),
    ).rejects.toMatchObject({ code: "PARENT_CHILD_LINK_REQUIRED" });

    await expect(
      createParentChildPayment(
        "parent-user-inactive",
        "student-1",
        "enrollment-1",
        validPaymentInput,
        store,
      ),
    ).rejects.toMatchObject({ code: "PARENT_CHILD_LINK_REQUIRED" });
  });

  it("blocks cancelled enrollments and duplicate pending payments", async () => {
    const store = makePaymentStore();

    await expect(
      createStudentPayment(
        "student-user-1",
        "enrollment-cancelled",
        { ...validPaymentInput, enrollmentId: "enrollment-cancelled" },
        store,
      ),
    ).rejects.toMatchObject({ code: "ENROLLMENT_NOT_PAYABLE" });

    await createStudentPayment(
      "student-user-1",
      "enrollment-1",
      validPaymentInput,
      store,
    );

    await expect(
      createStudentPayment(
        "student-user-1",
        "enrollment-1",
        validPaymentInput,
        store,
      ),
    ).rejects.toMatchObject({ code: "DUPLICATE_PENDING_PAYMENT" });
  });

  it("enforces payment status transitions", () => {
    expect(
      canTransitionPaymentStatus(PaymentStatus.PENDING, PaymentStatus.PAID),
    ).toBe(true);
    expect(
      canTransitionPaymentStatus(PaymentStatus.PENDING, PaymentStatus.FAILED),
    ).toBe(true);
    expect(
      canTransitionPaymentStatus(PaymentStatus.PAID, PaymentStatus.REFUNDED),
    ).toBe(true);
    expect(
      canTransitionPaymentStatus(PaymentStatus.FAILED, PaymentStatus.PAID),
    ).toBe(false);
    expect(
      canTransitionPaymentStatus(PaymentStatus.REFUNDED, PaymentStatus.PAID),
    ).toBe(false);
  });

  it("lets admin mark pending payments as paid and activates pending enrollment", async () => {
    const store = makePaymentStore();
    const pending = await createStudentPayment(
      "student-user-1",
      "enrollment-1",
      validPaymentInput,
      store,
    );
    const paid = await adminVerifyPayment(
      "admin-user",
      pending.id,
      PaymentStatus.PAID,
      store,
    );
    const verified = await store.getPaymentForVerification(pending.id);

    expect(paid.status).toBe(PaymentStatus.PAID);
    expect(paid.paidAt).toBeInstanceOf(Date);
    expect(paid.enrollmentStatus).toBe(EnrollmentStatus.ACTIVE);
    expect(verified?.enrollmentStatus).toBe(EnrollmentStatus.ACTIVE);
  });

  it("lets admin mark pending payment as failed", async () => {
    const store = makePaymentStore();
    const pending = await createStudentPayment(
      "student-user-1",
      "enrollment-1",
      validPaymentInput,
      store,
    );
    const failed = await adminVerifyPayment(
      "admin-user",
      pending.id,
      PaymentStatus.FAILED,
      store,
    );

    expect(failed.status).toBe(PaymentStatus.FAILED);
    expect(failed.paidAt).toBeNull();
  });

  it("lets admin refund paid payments without deleting records", async () => {
    const store = makePaymentStore();
    const pending = await createStudentPayment(
      "student-user-1",
      "enrollment-1",
      validPaymentInput,
      store,
    );
    const paid = await adminVerifyPayment(
      "admin-user",
      pending.id,
      PaymentStatus.PAID,
      store,
    );
    const refunded = await adminVerifyPayment(
      "admin-user",
      pending.id,
      PaymentStatus.REFUNDED,
      store,
    );

    expect(refunded.id).toBe(pending.id);
    expect(refunded.status).toBe(PaymentStatus.REFUNDED);
    expect(refunded.paidAt?.getTime()).toBe(paid.paidAt?.getTime());
  });

  it("blocks invalid admin payment transitions", async () => {
    const store = makePaymentStore();
    const pending = await createStudentPayment(
      "student-user-1",
      "enrollment-1",
      validPaymentInput,
      store,
    );
    await adminVerifyPayment("admin-user", pending.id, PaymentStatus.FAILED, store);

    await expect(
      adminVerifyPayment("admin-user", pending.id, PaymentStatus.PAID, store),
    ).rejects.toBeInstanceOf(PaymentManagementError);
  });
});

describe("omise promptpay payment service", () => {
  it("creates a pending PromptPay payment for a student's own enrollment", async () => {
    const store = makePaymentStore();
    const result = await createPromptPayPayment(
      studentUser,
      "enrollment-1",
      { enrollmentId: "enrollment-1" },
      createFakeOmiseClient(createFakeOmiseCharge()),
      store,
    );

    expect(result.payment.status).toBe(PaymentStatus.PENDING);
    expect(result.payment.provider).toBe(PaymentProvider.OMISE);
    expect(result.payment.method).toBe(PaymentMethod.PROMPTPAY);
    expect(result.providerChargeId).toBe("chrg_test_promptpay");
    expect(result.qrCodeImageUrl).toBe("https://api.omise.co/qrcode.png");
  });

  it("allows a parent to create a PromptPay payment for an active linked child", async () => {
    const store = makePaymentStore();
    const result = await createPromptPayPayment(
      parentUser,
      "enrollment-1",
      { enrollmentId: "enrollment-1" },
      createFakeOmiseClient(createFakeOmiseCharge()),
      store,
    );

    expect(result.payment.payer.id).toBe("parent-user-1");
    expect(result.payment.student?.id).toBe("student-1");
  });

  it("blocks tutors and amount mismatches from creating PromptPay payments", async () => {
    const store = makePaymentStore();

    await expect(
      createPromptPayPayment(
        tutorUser,
        "enrollment-1",
        { enrollmentId: "enrollment-1" },
        createFakeOmiseClient(createFakeOmiseCharge()),
        store,
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(
      createPromptPayPayment(
        studentUser,
        "enrollment-1",
        { enrollmentId: "enrollment-1", amount: 1 },
        createFakeOmiseClient(createFakeOmiseCharge()),
        store,
      ),
    ).rejects.toMatchObject({ code: "AMOUNT_MISMATCH" });
  });

  it("marks gateway payments paid and activates enrollment only from provider confirmation", async () => {
    const store = makePaymentStore();
    const result = await createPromptPayPayment(
      studentUser,
      "enrollment-1",
      { enrollmentId: "enrollment-1" },
      createFakeOmiseClient(createFakeOmiseCharge()),
      store,
    );

    await expect(
      adminVerifyPayment("admin-user", result.payment.id, PaymentStatus.PAID, store),
    ).rejects.toMatchObject({
      code: "GATEWAY_PAYMENT_MANUAL_OVERRIDE_BLOCKED",
    });

    const paid = await applyGatewayChargeStatus(
      "chrg_test_promptpay",
      createFakeOmiseCharge({
        status: "successful",
        paid: true,
        paid_at: "2026-05-10T01:00:00Z",
      }),
      "evnt_test_charge_complete",
      store,
    );
    const duplicate = await applyGatewayChargeStatus(
      "chrg_test_promptpay",
      createFakeOmiseCharge({
        status: "successful",
        paid: true,
        paid_at: "2026-05-10T01:00:00Z",
      }),
      "evnt_test_charge_complete",
      store,
    );

    expect(paid?.status).toBe(PaymentStatus.PAID);
    expect(paid?.paidAt).toBeInstanceOf(Date);
    expect(paid?.enrollmentStatus).toBe(EnrollmentStatus.ACTIVE);
    expect(duplicate?.status).toBe(PaymentStatus.PAID);
    expect(duplicate?.enrollmentStatus).toBe(EnrollmentStatus.ACTIVE);
  });

  it("marks failed provider statuses as failed without activating enrollment", async () => {
    const store = makePaymentStore();
    await createPromptPayPayment(
      studentUser,
      "enrollment-1",
      { enrollmentId: "enrollment-1" },
      createFakeOmiseClient(createFakeOmiseCharge()),
      store,
    );

    const failed = await applyGatewayChargeStatus(
      "chrg_test_promptpay",
      createFakeOmiseCharge({
        status: "failed",
        paid: false,
        failure_code: "failed_processing",
      }),
      "evnt_test_charge_complete",
      store,
    );

    expect(failed?.status).toBe(PaymentStatus.FAILED);
    expect(failed?.failedAt).toBeInstanceOf(Date);
    expect(failed?.enrollmentStatus).toBe(EnrollmentStatus.PENDING);
  });
});
