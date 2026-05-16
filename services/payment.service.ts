import {
  EnrollmentStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  UserRole,
  type PrismaClient,
} from "@/lib/generated/prisma/client";
import { getDb } from "@/lib/db";
import {
  canCreatePayment as canCreatePaymentPermission,
  canVerifyPayment as canVerifyPaymentPermission,
  canViewPayment as canViewPaymentPermission,
  type PermissionUser,
} from "@/lib/permissions";
import {
  paymentCreateSchema,
  paymentFilterSchema,
  paymentStatusUpdateSchema,
  type PaymentCreateInput,
  type PaymentFilterInput,
} from "@/lib/validators/payment";
import {
  createPromptPayPaymentSchema,
  type CreatePromptPayPaymentInput,
} from "@/lib/validators/payment-gateway";
import { normalizeSearchText } from "@/services/marketplace-utils";
import {
  createPromptPayCharge,
  mapOmiseChargeToPaymentStatus,
  sanitizeOmiseChargePayload,
  type OmiseCharge,
  type OmiseClient,
  type PromptPayChargeResult,
} from "@/services/payment-gateway/omise.service";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export type PaymentFilters = {
  search?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  studentId?: string;
  payerId?: string;
  courseId?: string;
  tutorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type PaymentCourseSummary = {
  id: string;
  title: string;
  tutor: {
    id: string;
    name: string;
    email: string;
  };
};

export type PaymentStudentSummary = {
  id: string;
  name: string;
  email: string;
  displayName: string | null;
};

export type PaymentPayerSummary = {
  id: string;
  name: string;
  email: string;
};

export type PaymentEnrollmentSummary = {
  id: string;
  status: EnrollmentStatus;
  student: PaymentStudentSummary;
  course: PaymentCourseSummary;
  amountDueCents: number;
};

export type PaymentListItem = {
  id: string;
  payer: PaymentPayerSummary;
  student: PaymentStudentSummary | null;
  course: PaymentCourseSummary;
  enrollmentId: string | null;
  enrollmentStatus: EnrollmentStatus | null;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: PaymentProvider;
  providerChargeId: string | null;
  providerSourceId: string | null;
  providerStatus: string | null;
  expiresAt: Date | null;
  failedAt: Date | null;
  webhookEventId: string | null;
  lastWebhookAt: Date | null;
  proofUrl: string | null;
  note: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type TutorPaymentSummary = Pick<
  PaymentListItem,
  | "id"
  | "student"
  | "course"
  | "enrollmentId"
  | "enrollmentStatus"
  | "amountCents"
  | "method"
  | "status"
  | "provider"
  | "providerStatus"
  | "paidAt"
  | "createdAt"
  | "updatedAt"
>;

export type PaymentCreateData = {
  payerId: string;
  courseId: string;
  enrollmentId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  provider?: PaymentProvider;
  amountCents: number;
  proofUrl: string | null;
  note: string | null;
};

type EnrollmentForPayment = {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  course: {
    id: string;
    title: string;
    priceCents: number;
    tutor: {
      id: string;
      user: {
        name: string;
        email: string;
      };
    };
  };
  student: {
    id: string;
    displayName: string | null;
    user: {
      name: string;
      email: string;
    };
  };
};

type PaymentForVerification = {
  id: string;
  status: PaymentStatus;
  provider: PaymentProvider;
  paidAt: Date | null;
  enrollmentId: string | null;
  enrollmentStatus: EnrollmentStatus | null;
};

type PaymentStatusData = {
  status: PaymentStatus;
  paidAt?: Date | null;
};

type GatewayReferenceData = {
  providerChargeId: string;
  providerSourceId: string | null;
  providerStatus: string | null;
  expiresAt: Date | null;
  providerPayload: Prisma.InputJsonValue;
};

type GatewayStatusData = {
  status: PaymentStatus;
  paidAt?: Date | null;
  failedAt?: Date | null;
  providerStatus: string | null;
  providerPayload: Prisma.InputJsonValue;
  webhookEventId: string | null;
  lastWebhookAt: Date;
};

export type PaymentWriteStore = {
  getStudentProfileByUserId(
    studentUserId: string,
  ): Promise<{ id: string } | null>;
  getParentProfileByUserId(
    parentUserId: string,
  ): Promise<{ id: string } | null>;
  hasActiveParentStudentLink(
    parentId: string,
    studentId: string,
  ): Promise<boolean>;
  getEnrollmentForPayment(
    enrollmentId: string,
  ): Promise<EnrollmentForPayment | null>;
  countPendingPaymentsForEnrollment(enrollmentId: string): Promise<number>;
  createPayment(data: PaymentCreateData): Promise<PaymentListItem>;
  getPaymentForVerification(
    paymentId: string,
  ): Promise<PaymentForVerification | null>;
  updatePaymentStatus(
    paymentId: string,
    data: PaymentStatusData,
  ): Promise<PaymentListItem>;
  updatePaymentGatewayReference(
    paymentId: string,
    data: GatewayReferenceData,
  ): Promise<PaymentListItem>;
  getPaymentForGatewayCharge(
    providerChargeId: string,
  ): Promise<PaymentForVerification | null>;
  updatePaymentFromGateway(
    paymentId: string,
    data: GatewayStatusData,
  ): Promise<PaymentListItem>;
  updateEnrollmentStatus(
    enrollmentId: string,
    data: { status: EnrollmentStatus },
  ): Promise<void>;
  runInTransaction<T>(callback: (store: PaymentWriteStore) => Promise<T>): Promise<T>;
};

export type PaymentManagementErrorCode =
  | "STUDENT_PROFILE_REQUIRED"
  | "PARENT_PROFILE_REQUIRED"
  | "PARENT_CHILD_LINK_REQUIRED"
  | "ENROLLMENT_NOT_FOUND"
  | "ENROLLMENT_NOT_PAYABLE"
  | "FORBIDDEN"
  | "DUPLICATE_PENDING_PAYMENT"
  | "PAYMENT_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "GATEWAY_PAYMENT_MANUAL_OVERRIDE_BLOCKED"
  | "GATEWAY_NOT_CONFIGURED"
  | "GATEWAY_CHARGE_FAILED"
  | "AMOUNT_MISMATCH";

export class PaymentManagementError extends Error {
  constructor(
    readonly code: PaymentManagementErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PaymentManagementError";
  }
}

type PrismaPaymentClient = Pick<
  PrismaClient,
  "enrollment" | "parentProfile" | "parentStudentLink" | "payment" | "studentProfile"
>;

const paymentListSelect = {
  id: true,
  payerId: true,
  courseId: true,
  enrollmentId: true,
  method: true,
  status: true,
  provider: true,
  providerChargeId: true,
  providerSourceId: true,
  providerStatus: true,
  expiresAt: true,
  failedAt: true,
  webhookEventId: true,
  lastWebhookAt: true,
  amountCents: true,
  proofUrl: true,
  note: true,
  paidAt: true,
  createdAt: true,
  updatedAt: true,
  payer: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  course: {
    select: {
      id: true,
      title: true,
      tutor: {
        select: {
          id: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  },
  enrollment: {
    select: {
      id: true,
      status: true,
      student: {
        select: {
          id: true,
          displayName: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

type PaymentRow = Prisma.PaymentGetPayload<{
  select: typeof paymentListSelect;
}>;

function firstValue(value: string | string[] | undefined): string | undefined {
  const selected = Array.isArray(value) ? value[0] : value;

  return selected === "" ? undefined : selected;
}

function toAmountCents(amount: number): number {
  return Math.round(amount * 100);
}

function mapStudent(row: EnrollmentForPayment["student"]): PaymentStudentSummary {
  return {
    id: row.id,
    name: row.user.name,
    email: row.user.email,
    displayName: row.displayName,
  };
}

function mapCourse(row: EnrollmentForPayment["course"]): PaymentCourseSummary {
  return {
    id: row.id,
    title: row.title,
    tutor: {
      id: row.tutor.id,
      name: row.tutor.user.name,
      email: row.tutor.user.email,
    },
  };
}

function mapEnrollmentSummary(row: EnrollmentForPayment): PaymentEnrollmentSummary {
  return {
    id: row.id,
    status: row.status,
    student: mapStudent(row.student),
    course: mapCourse(row.course),
    amountDueCents: row.course.priceCents,
  };
}

function mapPayment(row: PaymentRow): PaymentListItem {
  return {
    id: row.id,
    payer: {
      id: row.payer.id,
      name: row.payer.name,
      email: row.payer.email,
    },
    student: row.enrollment
      ? {
          id: row.enrollment.student.id,
          name: row.enrollment.student.user.name,
          email: row.enrollment.student.user.email,
          displayName: row.enrollment.student.displayName,
        }
      : null,
    course: {
      id: row.course.id,
      title: row.course.title,
      tutor: {
        id: row.course.tutor.id,
        name: row.course.tutor.user.name,
        email: row.course.tutor.user.email,
      },
    },
    enrollmentId: row.enrollmentId,
    enrollmentStatus: row.enrollment?.status ?? null,
    amountCents: row.amountCents,
    method: row.method,
    status: row.status,
    provider: row.provider,
    providerChargeId: row.providerChargeId,
    providerSourceId: row.providerSourceId,
    providerStatus: row.providerStatus,
    expiresAt: row.expiresAt,
    failedAt: row.failedAt,
    webhookEventId: row.webhookEventId,
    lastWebhookAt: row.lastWebhookAt,
    proofUrl: row.proofUrl,
    note: row.note,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function createPrismaPaymentStore(client: PrismaPaymentClient): PaymentWriteStore {
  const store: PaymentWriteStore = {
    async getStudentProfileByUserId(studentUserId) {
      return client.studentProfile.findUnique({
        where: { userId: studentUserId },
        select: { id: true },
      });
    },

    async getParentProfileByUserId(parentUserId) {
      return client.parentProfile.findUnique({
        where: { userId: parentUserId },
        select: { id: true },
      });
    },

    async hasActiveParentStudentLink(parentId, studentId) {
      const count = await client.parentStudentLink.count({
        where: { parentId, studentId, isActive: true, endedAt: null },
      });

      return count > 0;
    },

    async getEnrollmentForPayment(enrollmentId) {
      return client.enrollment.findUnique({
        where: { id: enrollmentId },
        select: {
          id: true,
          studentId: true,
          courseId: true,
          status: true,
          course: {
            select: {
              id: true,
              title: true,
              priceCents: true,
              tutor: {
                select: {
                  id: true,
                  user: { select: { name: true, email: true } },
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              displayName: true,
              user: { select: { name: true, email: true } },
            },
          },
        },
      });
    },

    async countPendingPaymentsForEnrollment(enrollmentId) {
      return client.payment.count({
        where: { enrollmentId, status: PaymentStatus.PENDING },
      });
    },

    async createPayment(data) {
      const row = await client.payment.create({
        data,
        select: paymentListSelect,
      });

      return mapPayment(row);
    },

    async getPaymentForVerification(paymentId) {
      const payment = await client.payment.findUnique({
        where: { id: paymentId },
        select: {
          id: true,
          status: true,
          provider: true,
          paidAt: true,
          enrollmentId: true,
          enrollment: { select: { status: true } },
        },
      });

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        status: payment.status,
        provider: payment.provider,
        paidAt: payment.paidAt,
        enrollmentId: payment.enrollmentId,
        enrollmentStatus: payment.enrollment?.status ?? null,
      };
    },

    async updatePaymentStatus(paymentId, data) {
      const row = await client.payment.update({
        where: { id: paymentId },
        data,
        select: paymentListSelect,
      });

      return mapPayment(row);
    },

    async updatePaymentGatewayReference(paymentId, data) {
      const row = await client.payment.update({
        where: { id: paymentId },
        data,
        select: paymentListSelect,
      });

      return mapPayment(row);
    },

    async getPaymentForGatewayCharge(providerChargeId) {
      const payment = await client.payment.findUnique({
        where: { providerChargeId },
        select: {
          id: true,
          status: true,
          provider: true,
          paidAt: true,
          enrollmentId: true,
          enrollment: { select: { status: true } },
        },
      });

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        status: payment.status,
        provider: payment.provider,
        paidAt: payment.paidAt,
        enrollmentId: payment.enrollmentId,
        enrollmentStatus: payment.enrollment?.status ?? null,
      };
    },

    async updatePaymentFromGateway(paymentId, data) {
      const row = await client.payment.update({
        where: { id: paymentId },
        data,
        select: paymentListSelect,
      });

      return mapPayment(row);
    },

    async updateEnrollmentStatus(enrollmentId, data) {
      await client.enrollment.update({
        where: { id: enrollmentId },
        data,
      });
    },

    async runInTransaction(callback) {
      return callback(store);
    },
  };

  return store;
}

const prismaPaymentWriteStore: PaymentWriteStore = {
  async getStudentProfileByUserId(studentUserId) {
    return createPrismaPaymentStore(getDb()).getStudentProfileByUserId(
      studentUserId,
    );
  },
  async getParentProfileByUserId(parentUserId) {
    return createPrismaPaymentStore(getDb()).getParentProfileByUserId(
      parentUserId,
    );
  },
  async hasActiveParentStudentLink(parentId, studentId) {
    return createPrismaPaymentStore(getDb()).hasActiveParentStudentLink(
      parentId,
      studentId,
    );
  },
  async getEnrollmentForPayment(enrollmentId) {
    return createPrismaPaymentStore(getDb()).getEnrollmentForPayment(enrollmentId);
  },
  async countPendingPaymentsForEnrollment(enrollmentId) {
    return createPrismaPaymentStore(getDb()).countPendingPaymentsForEnrollment(
      enrollmentId,
    );
  },
  async createPayment(data) {
    return createPrismaPaymentStore(getDb()).createPayment(data);
  },
  async getPaymentForVerification(paymentId) {
    return createPrismaPaymentStore(getDb()).getPaymentForVerification(paymentId);
  },
  async updatePaymentStatus(paymentId, data) {
    return createPrismaPaymentStore(getDb()).updatePaymentStatus(paymentId, data);
  },
  async updatePaymentGatewayReference(paymentId, data) {
    return createPrismaPaymentStore(getDb()).updatePaymentGatewayReference(
      paymentId,
      data,
    );
  },
  async getPaymentForGatewayCharge(providerChargeId) {
    return createPrismaPaymentStore(getDb()).getPaymentForGatewayCharge(
      providerChargeId,
    );
  },
  async updatePaymentFromGateway(paymentId, data) {
    return createPrismaPaymentStore(getDb()).updatePaymentFromGateway(
      paymentId,
      data,
    );
  },
  async updateEnrollmentStatus(enrollmentId, data) {
    return createPrismaPaymentStore(getDb()).updateEnrollmentStatus(
      enrollmentId,
      data,
    );
  },
  async runInTransaction(callback) {
    return getDb().$transaction(
      async (tx) =>
        callback(createPrismaPaymentStore(tx as PrismaPaymentClient)),
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  },
};

export function parsePaymentFilters(params: SearchParamsInput): PaymentFilters {
  const parsed: PaymentFilterInput = paymentFilterSchema.parse({
    search: firstValue(params.search),
    status: firstValue(params.status),
    method: firstValue(params.method),
    studentId: firstValue(params.studentId) ?? firstValue(params.student),
    payerId: firstValue(params.payerId) ?? firstValue(params.payer),
    courseId: firstValue(params.courseId) ?? firstValue(params.course),
    tutorId: firstValue(params.tutorId) ?? firstValue(params.tutor),
    dateFrom: firstValue(params.dateFrom),
    dateTo: firstValue(params.dateTo),
  });

  return {
    search: normalizeSearchText(parsed.search),
    status: parsed.status,
    method: parsed.method,
    studentId: normalizeSearchText(parsed.studentId),
    payerId: normalizeSearchText(parsed.payerId),
    courseId: normalizeSearchText(parsed.courseId),
    tutorId: normalizeSearchText(parsed.tutorId),
    dateFrom: parsed.dateFrom,
    dateTo: parsed.dateTo,
  };
}

function buildPaymentWhere(
  filters: PaymentFilters,
  base: Prisma.PaymentWhereInput = {},
): Prisma.PaymentWhereInput {
  const and: Prisma.PaymentWhereInput[] = [base];

  if (filters.search) {
    and.push({
      OR: [
        { course: { title: { contains: filters.search, mode: "insensitive" } } },
        { payer: { name: { contains: filters.search, mode: "insensitive" } } },
        { payer: { email: { contains: filters.search, mode: "insensitive" } } },
        { enrollment: { student: { displayName: { contains: filters.search, mode: "insensitive" } } } },
        { enrollment: { student: { user: { name: { contains: filters.search, mode: "insensitive" } } } } },
        { enrollment: { student: { user: { email: { contains: filters.search, mode: "insensitive" } } } } },
      ],
    });
  }

  if (filters.status) {
    and.push({ status: filters.status });
  }

  if (filters.method) {
    and.push({ method: filters.method });
  }

  if (filters.studentId) {
    and.push({ enrollment: { studentId: filters.studentId } });
  }

  if (filters.payerId) {
    and.push({ payerId: filters.payerId });
  }

  if (filters.courseId) {
    and.push({ courseId: filters.courseId });
  }

  if (filters.tutorId) {
    and.push({ course: { tutorId: filters.tutorId } });
  }

  if (filters.dateFrom || filters.dateTo) {
    and.push({
      createdAt: {
        ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { lte: filters.dateTo } : {}),
      },
    });
  }

  return { AND: and };
}

function assertPayableEnrollment(
  enrollment: EnrollmentForPayment | null,
): asserts enrollment is EnrollmentForPayment {
  if (!enrollment) {
    throw new PaymentManagementError(
      "ENROLLMENT_NOT_FOUND",
      "Enrollment not found.",
    );
  }

  if (
    enrollment.status !== EnrollmentStatus.PENDING &&
    enrollment.status !== EnrollmentStatus.ACTIVE
  ) {
    throw new PaymentManagementError(
      "ENROLLMENT_NOT_PAYABLE",
      "Payments can be created only for PENDING or ACTIVE enrollments.",
    );
  }
}

async function assertNoPendingPayment(
  enrollmentId: string,
  store: PaymentWriteStore,
): Promise<void> {
  const pendingCount = await store.countPendingPaymentsForEnrollment(enrollmentId);

  if (pendingCount > 0) {
    throw new PaymentManagementError(
      "DUPLICATE_PENDING_PAYMENT",
      "This enrollment already has a pending payment.",
    );
  }
}

function buildPaymentCreateData(
  payerId: string,
  enrollment: EnrollmentForPayment,
  input: PaymentCreateInput,
): PaymentCreateData {
  const parsed = paymentCreateSchema.parse(input);

  return {
    payerId,
    courseId: enrollment.courseId,
    enrollmentId: enrollment.id,
    amountCents: toAmountCents(parsed.amount),
    method: parsed.method,
    status: PaymentStatus.PENDING,
    proofUrl: parsed.proofUrl ?? null,
    note: parsed.note ?? null,
  };
}

async function createPaymentForEnrollment(
  payerId: string,
  enrollmentId: string,
  input: PaymentCreateInput,
  assertEnrollmentOwner: (enrollment: EnrollmentForPayment) => Promise<void>,
  store: PaymentWriteStore,
): Promise<PaymentListItem> {
  return store.runInTransaction(async (tx) => {
    const enrollment = await tx.getEnrollmentForPayment(enrollmentId);
    assertPayableEnrollment(enrollment);
    await assertEnrollmentOwner(enrollment);
    await assertNoPendingPayment(enrollment.id, tx);

    return tx.createPayment(buildPaymentCreateData(payerId, enrollment, input));
  });
}

export async function getPaymentEnrollmentForStudent(
  studentUserId: string,
  enrollmentId: string,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PaymentEnrollmentSummary | null> {
  const [student, enrollment] = await Promise.all([
    store.getStudentProfileByUserId(studentUserId),
    store.getEnrollmentForPayment(enrollmentId),
  ]);

  if (!student || !enrollment || enrollment.studentId !== student.id) {
    return null;
  }

  return mapEnrollmentSummary(enrollment);
}

export async function getPaymentEnrollmentForParentChild(
  parentUserId: string,
  studentId: string,
  enrollmentId: string,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PaymentEnrollmentSummary | null> {
  const [parent, enrollment] = await Promise.all([
    store.getParentProfileByUserId(parentUserId),
    store.getEnrollmentForPayment(enrollmentId),
  ]);

  if (!parent || !enrollment || enrollment.studentId !== studentId) {
    return null;
  }

  const isLinked = await store.hasActiveParentStudentLink(parent.id, studentId);

  return isLinked ? mapEnrollmentSummary(enrollment) : null;
}

export async function createStudentPayment(
  studentUserId: string,
  enrollmentId: string,
  input: PaymentCreateInput,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PaymentListItem> {
  const student = await store.getStudentProfileByUserId(studentUserId);

  if (!student) {
    throw new PaymentManagementError(
      "STUDENT_PROFILE_REQUIRED",
      "Student profile is required to create a payment.",
    );
  }

  return createPaymentForEnrollment(
    studentUserId,
    enrollmentId,
    input,
    async (enrollment) => {
      if (enrollment.studentId !== student.id) {
        throw new PaymentManagementError(
          "FORBIDDEN",
          "Students can create payments only for their own enrollments.",
        );
      }
    },
    store,
  );
}

export async function createParentChildPayment(
  parentUserId: string,
  studentId: string,
  enrollmentId: string,
  input: PaymentCreateInput,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PaymentListItem> {
  const parent = await store.getParentProfileByUserId(parentUserId);

  if (!parent) {
    throw new PaymentManagementError(
      "PARENT_PROFILE_REQUIRED",
      "Parent profile is required to create a child payment.",
    );
  }

  const isLinked = await store.hasActiveParentStudentLink(parent.id, studentId);

  if (!isLinked) {
    throw new PaymentManagementError(
      "PARENT_CHILD_LINK_REQUIRED",
      "Parents can create payments only for active linked children.",
    );
  }

  return createPaymentForEnrollment(
    parentUserId,
    enrollmentId,
    input,
    async (enrollment) => {
      if (enrollment.studentId !== studentId) {
        throw new PaymentManagementError(
          "FORBIDDEN",
          "Parents can create payments only for the selected child enrollment.",
        );
      }
    },
    store,
  );
}

export type PromptPayPaymentResult = {
  payment: PaymentListItem;
  providerChargeId: string;
  providerSourceId: string | null;
  providerStatus: string | null;
  authorizeUri: string | null;
  qrCodeImageUrl: string | null;
  expiresAt: Date | null;
};

function assertGatewayAmount(
  input: CreatePromptPayPaymentInput,
  enrollment: EnrollmentForPayment,
): void {
  if (enrollment.course.priceCents <= 0) {
    throw new PaymentManagementError(
      "AMOUNT_MISMATCH",
      "PromptPay payments require a positive course price.",
    );
  }

  if (
    input.amount !== undefined &&
    toAmountCents(input.amount) !== enrollment.course.priceCents
  ) {
    throw new PaymentManagementError(
      "AMOUNT_MISMATCH",
      "Payment amount must match the enrollment course price.",
    );
  }
}

async function assertGatewayPaymentOwner(
  user: PermissionUser,
  enrollment: EnrollmentForPayment,
  store: PaymentWriteStore,
): Promise<void> {
  if (user.role === UserRole.STUDENT && user.studentProfileId) {
    if (enrollment.studentId !== user.studentProfileId) {
      throw new PaymentManagementError(
        "FORBIDDEN",
        "Students can pay only their own enrollments.",
      );
    }

    return;
  }

  if (user.role === UserRole.PARENT && user.parentProfileId) {
    const isLinked = await store.hasActiveParentStudentLink(
      user.parentProfileId,
      enrollment.studentId,
    );

    if (!isLinked) {
      throw new PaymentManagementError(
        "PARENT_CHILD_LINK_REQUIRED",
        "Parents can pay only active linked child enrollments.",
      );
    }

    return;
  }

  throw new PaymentManagementError(
    "FORBIDDEN",
    "Only students and linked parents can create PromptPay payments.",
  );
}

function buildGatewayPaymentCreateData(
  payerId: string,
  enrollment: EnrollmentForPayment,
): PaymentCreateData {
  return {
    payerId,
    courseId: enrollment.courseId,
    enrollmentId: enrollment.id,
    amountCents: enrollment.course.priceCents,
    method: PaymentMethod.PROMPTPAY,
    status: PaymentStatus.PENDING,
    provider: PaymentProvider.OMISE,
    proofUrl: null,
    note: "Omise PromptPay charge pending provider confirmation.",
  };
}

function mapPromptPayResult(
  payment: PaymentListItem,
  charge: PromptPayChargeResult,
): PromptPayPaymentResult {
  return {
    payment,
    providerChargeId: charge.id,
    providerSourceId: charge.sourceId,
    providerStatus: charge.status,
    authorizeUri: charge.authorizeUri,
    qrCodeImageUrl: charge.qrCodeImageUrl,
    expiresAt: charge.expiresAt,
  };
}

export async function createPromptPayPayment(
  user: PermissionUser,
  enrollmentId: string,
  input: CreatePromptPayPaymentInput = { enrollmentId },
  gatewayClient?: OmiseClient,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PromptPayPaymentResult> {
  const parsed = createPromptPayPaymentSchema.parse({
    ...input,
    enrollmentId,
  });

  const localPayment = await store.runInTransaction(async (tx) => {
    const enrollment = await tx.getEnrollmentForPayment(parsed.enrollmentId);
    assertPayableEnrollment(enrollment);
    assertGatewayAmount(parsed, enrollment);
    await assertGatewayPaymentOwner(user, enrollment, tx);
    await assertNoPendingPayment(enrollment.id, tx);

    return tx.createPayment(buildGatewayPaymentCreateData(user.id, enrollment));
  });

  try {
    const charge = await createPromptPayCharge(
      {
        amountCents: localPayment.amountCents,
        currency: "THB",
        paymentId: localPayment.id,
        enrollmentId: localPayment.enrollmentId ?? parsed.enrollmentId,
        description: `TutorTrack enrollment ${localPayment.enrollmentId}`,
      },
      gatewayClient,
    );

    const updated = await store.updatePaymentGatewayReference(localPayment.id, {
      providerChargeId: charge.id,
      providerSourceId: charge.sourceId,
      providerStatus: charge.status,
      expiresAt: charge.expiresAt,
      providerPayload: sanitizeOmiseChargePayload(charge.raw),
    });

    return mapPromptPayResult(updated, charge);
  } catch (error) {
    await store.updatePaymentFromGateway(localPayment.id, {
      status: PaymentStatus.FAILED,
      failedAt: new Date(),
      providerStatus: "charge_create_failed",
      providerPayload: {
        provider: "OMISE",
        error: error instanceof Error ? error.message : "Gateway error",
      },
      webhookEventId: null,
      lastWebhookAt: new Date(),
    });

    throw new PaymentManagementError(
      "GATEWAY_CHARGE_FAILED",
      "Unable to create PromptPay charge.",
    );
  }
}

export async function getStudentPayments(
  studentUserId: string,
  filters: PaymentFilters = {},
): Promise<PaymentListItem[]> {
  const student = await getDb().studentProfile.findUnique({
    where: { userId: studentUserId },
    select: { id: true },
  });

  if (!student) {
    return [];
  }

  const rows = await getDb().payment.findMany({
    where: buildPaymentWhere(filters, {
      enrollment: { studentId: student.id },
    }),
    orderBy: [{ createdAt: "desc" }],
    select: paymentListSelect,
  });

  return rows.map(mapPayment);
}

export async function getParentChildPayments(
  parentUserId: string,
  studentId: string,
  filters: PaymentFilters = {},
): Promise<PaymentListItem[]> {
  const parent = await getDb().parentProfile.findUnique({
    where: { userId: parentUserId },
    select: { id: true },
  });

  if (!parent) {
    return [];
  }

  const isLinked = await getDb().parentStudentLink.count({
    where: { parentId: parent.id, studentId, isActive: true, endedAt: null },
  });

  if (isLinked === 0) {
    return [];
  }

  const rows = await getDb().payment.findMany({
    where: buildPaymentWhere(filters, { enrollment: { studentId } }),
    orderBy: [{ createdAt: "desc" }],
    select: paymentListSelect,
  });

  return rows.map(mapPayment);
}

export async function getTutorPaymentSummaries(
  tutorUserId: string,
  filters: PaymentFilters = {},
): Promise<TutorPaymentSummary[]> {
  const rows = await getDb().payment.findMany({
    where: buildPaymentWhere(filters, { course: { tutor: { userId: tutorUserId } } }),
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: paymentListSelect,
  });

  return rows.map((row) => {
    const payment = mapPayment(row);

    return {
      id: payment.id,
      student: payment.student,
      course: payment.course,
      enrollmentId: payment.enrollmentId,
      enrollmentStatus: payment.enrollmentStatus,
      amountCents: payment.amountCents,
      method: payment.method,
      status: payment.status,
      provider: payment.provider,
      providerStatus: payment.providerStatus,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  });
}

export async function getAdminPayments(
  filters: PaymentFilters = {},
): Promise<PaymentListItem[]> {
  const rows = await getDb().payment.findMany({
    where: buildPaymentWhere(filters),
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    select: paymentListSelect,
  });

  return rows.map(mapPayment);
}

export async function getAdminPaymentById(
  paymentId: string,
): Promise<PaymentListItem | null> {
  const row = await getDb().payment.findUnique({
    where: { id: paymentId },
    select: paymentListSelect,
  });

  return row ? mapPayment(row) : null;
}

export async function getAdminPaymentFilterOptions(): Promise<{
  courses: Array<{ id: string; title: string }>;
  tutors: Array<{ id: string; name: string; email: string }>;
  students: Array<{ id: string; name: string; email: string }>;
  payers: Array<{ id: string; name: string; email: string }>;
}> {
  const [courses, tutors, students, payers] = await Promise.all([
    getDb().course.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    getDb().tutorProfile.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        user: { select: { name: true, email: true } },
      },
    }),
    getDb().studentProfile.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        user: { select: { name: true, email: true } },
      },
    }),
    getDb().user.findMany({
      where: { payments: { some: {} } },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return {
    courses,
    tutors: tutors.map((tutor) => ({
      id: tutor.id,
      name: tutor.user.name,
      email: tutor.user.email,
    })),
    students: students.map((student) => ({
      id: student.id,
      name: student.user.name,
      email: student.user.email,
    })),
    payers,
  };
}

export function canTransitionPaymentStatus(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  if (from === to) {
    return true;
  }

  if (from === PaymentStatus.PENDING) {
    return to === PaymentStatus.PAID || to === PaymentStatus.FAILED;
  }

  if (from === PaymentStatus.PAID) {
    return to === PaymentStatus.REFUNDED;
  }

  return false;
}

function buildPaymentStatusData(
  payment: PaymentForVerification,
  status: PaymentStatus,
): PaymentStatusData {
  if (payment.provider !== PaymentProvider.MANUAL) {
    throw new PaymentManagementError(
      "GATEWAY_PAYMENT_MANUAL_OVERRIDE_BLOCKED",
      "Gateway payments can only be confirmed by provider webhook.",
    );
  }

  const parsed = paymentStatusUpdateSchema.parse({
    paymentId: payment.id,
    status,
  });

  if (!canTransitionPaymentStatus(payment.status, parsed.status)) {
    throw new PaymentManagementError(
      "INVALID_STATUS_TRANSITION",
      `Cannot change payment status from ${payment.status} to ${parsed.status}.`,
    );
  }

  if (parsed.status === PaymentStatus.PAID) {
    return {
      status: parsed.status,
      paidAt: payment.paidAt ?? new Date(),
    };
  }

  if (parsed.status === PaymentStatus.FAILED) {
    return { status: parsed.status, paidAt: null };
  }

  return { status: parsed.status };
}

export async function adminVerifyPayment(
  adminUserId: string,
  paymentId: string,
  status: PaymentStatus,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PaymentListItem> {
  if (!adminUserId) {
    throw new PaymentManagementError(
      "FORBIDDEN",
      "Admin user id is required to verify payments.",
    );
  }

  return store.runInTransaction(async (tx) => {
    const payment = await tx.getPaymentForVerification(paymentId);

    if (!payment) {
      throw new PaymentManagementError(
        "PAYMENT_NOT_FOUND",
        "Payment not found.",
      );
    }

    const data = buildPaymentStatusData(payment, status);
    const updated = await tx.updatePaymentStatus(paymentId, data);

    if (
      status === PaymentStatus.PAID &&
      payment.enrollmentId &&
      payment.enrollmentStatus === EnrollmentStatus.PENDING
    ) {
      await tx.updateEnrollmentStatus(payment.enrollmentId, {
        status: EnrollmentStatus.ACTIVE,
      });

      return {
        ...updated,
        enrollmentStatus: EnrollmentStatus.ACTIVE,
      };
    }

    return updated;
  });
}

export async function markPaymentPaidFromGateway(
  paymentId: string,
  charge: OmiseCharge,
  webhookEventId: string | null,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PaymentListItem> {
  return store.runInTransaction(async (tx) => {
    const payment = await tx.getPaymentForVerification(paymentId);

    if (!payment) {
      throw new PaymentManagementError(
        "PAYMENT_NOT_FOUND",
        "Payment not found.",
      );
    }

    if (payment.status === PaymentStatus.REFUNDED) {
      return tx.updatePaymentFromGateway(paymentId, {
        status: payment.status,
        providerStatus: charge.status ?? null,
        providerPayload: sanitizeOmiseChargePayload(charge),
        webhookEventId,
        lastWebhookAt: new Date(),
      });
    }

    const paidAt = charge.paid_at ? new Date(charge.paid_at) : new Date();
    const updated = await tx.updatePaymentFromGateway(paymentId, {
      status: PaymentStatus.PAID,
      paidAt,
      failedAt: null,
      providerStatus: charge.status ?? "successful",
      providerPayload: sanitizeOmiseChargePayload(charge),
      webhookEventId,
      lastWebhookAt: new Date(),
    });

    if (
      payment.enrollmentId &&
      payment.enrollmentStatus === EnrollmentStatus.PENDING
    ) {
      await tx.updateEnrollmentStatus(payment.enrollmentId, {
        status: EnrollmentStatus.ACTIVE,
      });

      return {
        ...updated,
        enrollmentStatus: EnrollmentStatus.ACTIVE,
      };
    }

    return updated;
  });
}

export async function markPaymentFailedFromGateway(
  paymentId: string,
  charge: OmiseCharge,
  webhookEventId: string | null,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PaymentListItem> {
  return store.runInTransaction(async (tx) => {
    const payment = await tx.getPaymentForVerification(paymentId);

    if (!payment) {
      throw new PaymentManagementError(
        "PAYMENT_NOT_FOUND",
        "Payment not found.",
      );
    }

    if (payment.status === PaymentStatus.PAID) {
      return tx.updatePaymentFromGateway(paymentId, {
        status: PaymentStatus.PAID,
        providerStatus: charge.status ?? null,
        providerPayload: sanitizeOmiseChargePayload(charge),
        webhookEventId,
        lastWebhookAt: new Date(),
      });
    }

    return tx.updatePaymentFromGateway(paymentId, {
      status: PaymentStatus.FAILED,
      failedAt: new Date(),
      providerStatus: charge.status ?? "failed",
      providerPayload: sanitizeOmiseChargePayload(charge),
      webhookEventId,
      lastWebhookAt: new Date(),
    });
  });
}

export async function applyGatewayChargeStatus(
  providerChargeId: string,
  charge: OmiseCharge,
  webhookEventId: string | null,
  store: PaymentWriteStore = prismaPaymentWriteStore,
): Promise<PaymentListItem | null> {
  const payment = await store.getPaymentForGatewayCharge(providerChargeId);

  if (!payment) {
    return null;
  }

  const status = mapOmiseChargeToPaymentStatus(charge);

  if (status === PaymentStatus.PAID) {
    return markPaymentPaidFromGateway(payment.id, charge, webhookEventId, store);
  }

  if (status === PaymentStatus.FAILED) {
    return markPaymentFailedFromGateway(payment.id, charge, webhookEventId, store);
  }

  return store.updatePaymentFromGateway(payment.id, {
    status: payment.status,
    providerStatus: charge.status ?? null,
    providerPayload: sanitizeOmiseChargePayload(charge),
    webhookEventId,
    lastWebhookAt: new Date(),
  });
}

export async function getPaymentStatus(
  paymentId: string,
): Promise<Pick<
  PaymentListItem,
  | "id"
  | "status"
  | "provider"
  | "providerStatus"
  | "method"
  | "amountCents"
  | "paidAt"
  | "failedAt"
  | "expiresAt"
  | "updatedAt"
> | null> {
  const payment = await getAdminPaymentById(paymentId);

  if (!payment) {
    return null;
  }

  return {
    id: payment.id,
    status: payment.status,
    provider: payment.provider,
    providerStatus: payment.providerStatus,
    method: payment.method,
    amountCents: payment.amountCents,
    paidAt: payment.paidAt,
    failedAt: payment.failedAt,
    expiresAt: payment.expiresAt,
    updatedAt: payment.updatedAt,
  };
}

export function canCreatePaymentForEnrollment(
  user: PermissionUser | null | undefined,
  enrollmentId: string,
): Promise<boolean> {
  return canCreatePaymentPermission(user, enrollmentId);
}

export function canViewPaymentRecord(
  user: PermissionUser | null | undefined,
  paymentId: string,
): Promise<boolean> {
  return canViewPaymentPermission(user, paymentId);
}

export function canVerifyPaymentRecord(
  user: PermissionUser | null | undefined,
  paymentId: string,
): boolean {
  return canVerifyPaymentPermission(user, paymentId);
}
