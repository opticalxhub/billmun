import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const EMAIL_SCHEMA = z.string().trim().email().max(254);
export const UUID_SCHEMA = z.string().uuid();

const OPTIONAL_TRIMMED_TEXT = (maxLength: number) =>
  z.string().optional().transform((value) => normalizeOptionalText(value, maxLength));

const REQUIRED_TRIMMED_TEXT = (maxLength: number, message: string) =>
  z.string().transform((value) => sanitizeText(value, maxLength)).refine(Boolean, message);

export function sanitizeText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

export function normalizeOptionalText(value: unknown, maxLength: number) {
  return sanitizeText(value, maxLength) ?? null;
}

export function enforceSameOrigin(request: NextRequest) {
  const method = request.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  if (!origin) {
    return null;
  }

  const requestOrigin = request.nextUrl.origin;
  if (origin !== requestOrigin) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  return null;
}

export const contactSubmissionSchema = z.object({
  name: REQUIRED_TRIMMED_TEXT(120, 'Name is required'),
  email: EMAIL_SCHEMA,
  subject: OPTIONAL_TRIMMED_TEXT(160),
  message: REQUIRED_TRIMMED_TEXT(4000, 'Message is required'),
});

export const reportSubmissionSchema = z.object({
  category: z.enum(['PORTAL', 'IN_PERSON', 'MEDICAL']),
  issue_type: REQUIRED_TRIMMED_TEXT(120, 'Issue type is required'),
  description: REQUIRED_TRIMMED_TEXT(4000, 'Description is required'),
  metadata: z.object({
    committee: z.string().optional(),
    request_engineer: z.boolean().optional(),
    person_responsible: z.string().optional(),
    location: z.string().optional(),
    time: z.string().optional(),
    witnesses: z.string().optional(),
    patient_name: z.string().optional(),
    immediate_assistance: z.boolean().optional(),
  }).optional().default({}),
});

export const messageAttachmentSchema = z.object({
  file_url: z.string().url(),
  file_name: OPTIONAL_TRIMMED_TEXT(160),
  file_size: z.coerce.number().int().min(0).max(25 * 1024 * 1024).optional(),
  mime_type: OPTIONAL_TRIMMED_TEXT(120),
});

export const messageSendSchema = z.object({
  channel_id: UUID_SCHEMA,
  content: REQUIRED_TRIMMED_TEXT(4000, 'Message content is required'),
  type: z.enum(['TEXT', 'IMAGE', 'FILE']).optional().default('TEXT'),
  reply_to_id: UUID_SCHEMA.optional().nullable(),
  attachments: z.array(messageAttachmentSchema).max(5).optional().default([]),
});

export const messageReactionSchema = z.object({
  message_id: UUID_SCHEMA,
  emoji: REQUIRED_TRIMMED_TEXT(16, 'Emoji is required'),
});

export const chairPreparationSchema = z.object({
  committee_id: UUID_SCHEMA.optional().nullable(),
  checklist: z.record(z.string(), z.boolean()).optional().default({}),
  research_notes: z.array(
    z.object({
      id: REQUIRED_TRIMMED_TEXT(80, 'Research note id is required'),
      topic: REQUIRED_TRIMMED_TEXT(160, 'Research note topic is required'),
      content: OPTIONAL_TRIMMED_TEXT(4000).transform((value) => value ?? ''),
    }),
  ).max(100).optional().default([]),
  country_positions: z.array(
    z.object({
      country: REQUIRED_TRIMMED_TEXT(120, 'Country is required'),
      stance: OPTIONAL_TRIMMED_TEXT(500).transform((value) => value ?? ''),
      notes: OPTIONAL_TRIMMED_TEXT(2000).transform((value) => value ?? ''),
    }),
  ).max(500).optional().default([]),
});

export const chairCrisisSchema = z.object({
  action: z.literal('inject_crisis').optional().default('inject_crisis'),
  committee_id: UUID_SCHEMA.optional().nullable(),
  title: REQUIRED_TRIMMED_TEXT(160, 'Title is required'),
  body: REQUIRED_TRIMMED_TEXT(4000, 'Body is required'),
});
