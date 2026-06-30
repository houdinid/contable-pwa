-- Migration: Add payment_link column to tax_deadlines table
ALTER TABLE public.tax_deadlines ADD COLUMN IF NOT EXISTS payment_link TEXT;
