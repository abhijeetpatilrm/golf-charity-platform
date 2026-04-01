const { z } = require("zod");

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
  role: z.enum(["subscriber", "admin", "administrator"]).optional(),
  charityId: z.string().min(1).optional(),
  contributionPercent: z.number().min(10).max(100).optional(),
}).superRefine((value, ctx) => {
  if (value.charityId && value.contributionPercent === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contributionPercent"],
      message: "contributionPercent is required when charityId is provided",
    });
  }
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const scoreCreateSchema = z.object({
  score: z.number().int().min(1).max(45),
  date: z.string().min(1),
});

const drawRunSchema = z.object({
  drawType: z.enum(["3", "4", "5"]).optional(),
  mode: z.enum(["random", "algorithmic"]).optional(),
});

const drawSimulationSchema = z.object({
  drawType: z.enum(["3", "4", "5"]).optional(),
  mode: z.enum(["random", "algorithmic"]).optional(),
});

const subscriptionUpdateSchema = z.object({
  action: z.enum(["renew", "cancel"]),
  plan: z.enum(["monthly", "yearly"]).optional(),
}).superRefine((value, ctx) => {
  if (value.action === "renew" && !value.plan) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["plan"],
      message: "plan is required when action is renew",
    });
  }
});

const checkoutSessionSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
});

const webhookEventSchema = z.object({
  id: z.string().optional(),
  type: z.string().optional(),
  data: z
    .object({
      userId: z.string().optional(),
      plan: z.enum(["monthly", "yearly"]).optional(),
    })
    .partial()
    .optional(),
});

const verificationSubmitSchema = z.object({
  winnerId: z.string().min(1),
  proofUrl: z.string().url(),
  note: z.string().optional(),
});

const userUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.enum(["subscriber", "admin", "administrator"]).optional(),
    subscription_status: z.enum(["inactive", "active", "canceled", "expired"]).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

const charityCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  website_url: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  is_active: z.boolean().optional(),
});

const charityUpdateSchema = z
  .object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    website_url: z.string().url().optional(),
    logo_url: z.string().url().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

const charityPreferenceSchema = z.object({
  charityId: z.string().min(1),
  contributionPercent: z.number().min(10).max(100),
});

const resourceIdParamSchema = z.object({
  id: z.string().min(1),
});

module.exports = {
  signUpSchema,
  signInSchema,
  scoreCreateSchema,
  drawRunSchema,
  drawSimulationSchema,
  subscriptionUpdateSchema,
  checkoutSessionSchema,
  webhookEventSchema,
  verificationSubmitSchema,
  userUpdateSchema,
  charityCreateSchema,
  charityUpdateSchema,
  charityPreferenceSchema,
  resourceIdParamSchema,
};
