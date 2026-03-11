-- =====================================================
-- PrepAI Database Setup for Supabase
-- =====================================================
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- This creates the tables the app actually uses.
-- =====================================================

-- 1. Users table (stores logged-in students)
CREATE TABLE IF NOT EXISTS "Users" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Interviews table (stores practice sessions & questions)
CREATE TABLE IF NOT EXISTS "Interviews" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    "jobPosition" VARCHAR(255),
    "jobDescription" TEXT,
    duration VARCHAR(50),
    type TEXT,
    "questionList" JSONB,
    "userEmail" VARCHAR(255) NOT NULL,
    interview_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. interview-feedback table (stores AI feedback after sessions)
CREATE TABLE IF NOT EXISTS "interview-feedback" (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    interview_id VARCHAR(255) NOT NULL,
    "userEmail" VARCHAR(255),
    "userName" VARCHAR(255),
    feedback JSONB,
    candidate_photo_url TEXT,
    photo_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- Row Level Security (RLS) — IMPORTANT
-- Supabase blocks all access by default when RLS is on.
-- For simplicity we allow all operations via the anon key.
-- Tighten these policies for production.
-- =====================================================

-- Enable RLS
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Interviews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "interview-feedback" ENABLE ROW LEVEL SECURITY;

-- Users: allow read/insert/update from anyone (anon key)
CREATE POLICY "Allow all on Users" ON "Users"
    FOR ALL USING (true) WITH CHECK (true);

-- Interviews: allow read/insert/update from anyone
CREATE POLICY "Allow all on Interviews" ON "Interviews"
    FOR ALL USING (true) WITH CHECK (true);

-- interview-feedback: allow read/insert/update from anyone
CREATE POLICY "Allow all on interview-feedback" ON "interview-feedback"
    FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_interviews_user_email ON "Interviews" ("userEmail");
CREATE INDEX IF NOT EXISTS idx_interviews_interview_id ON "Interviews" (interview_id);
CREATE INDEX IF NOT EXISTS idx_feedback_interview_id ON "interview-feedback" (interview_id);
CREATE INDEX IF NOT EXISTS idx_feedback_user_email ON "interview-feedback" ("userEmail");

-- =====================================================
-- (Optional) Storage bucket for candidate photos
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'candidate-photos',
    'candidate-photos',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read candidate photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-photos');

CREATE POLICY "Anyone can upload candidate photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'candidate-photos');

-- =====================================================
-- Verify setup
-- =====================================================
SELECT 'Users' AS table_name, COUNT(*) AS rows FROM "Users"
UNION ALL
SELECT 'Interviews', COUNT(*) FROM "Interviews"
UNION ALL
SELECT 'interview-feedback', COUNT(*) FROM "interview-feedback";
