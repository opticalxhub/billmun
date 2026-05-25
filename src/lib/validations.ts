import { z } from 'zod';

export const DocumentSubmitSchema = z.object({
  committee_id: z.string().uuid().optional().nullable(),
  title: z.string().min(1, "Title is required").max(200),
  type: z.string().min(1, "Type is required"),
  content: z.string().optional().nullable(),
  url: z.string().url("Invalid URL").optional().nullable(),
});

export type DocumentSubmitInput = z.infer<typeof DocumentSubmitSchema>;

export const ResolutionSchema = z.object({
  title: z.string().min(5, "Title too short").max(200),
  topic: z.string().min(5, "Topic too short").max(200),
  committee_id: z.string().uuid(),
  co_sponsors: z.array(z.string()).optional(),
});

export const ProfileUpdateSchema = z.object({
  full_name: z.string().min(2, "Name too short").max(100).optional(),
  bio: z.string().max(500).optional(),
  whatsapp_number: z.string().max(20).optional(),
});

export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Full name is required").max(100),
  date_of_birth: z.string().optional().nullable(),
  grade: z.string().optional().nullable(),
  phone_number: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_relation: z.string().optional().nullable(),
  emergency_contact_phone: z.string().optional().nullable(),
  dietary_restrictions: z.string().optional().nullable(),
  preferred_committee: z.string().optional().nullable(),
  allocated_country: z.string().optional().nullable(),
  department: z.enum(['DELEGATE', 'CHAIR', 'CO_CHAIR', 'EXECUTIVE_BOARD', 'SECRETARY_GENERAL', 'DEPUTY_SECRETARY_GENERAL']).default('DELEGATE'),
});

export const ApproveUserSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  approve: z.boolean(),
  reason: z.string().max(500).optional().nullable(),
});

