-- ============================================================
-- LearnTrack Production Schema for Supabase
-- 
-- INSTRUCTIONS:
-- 1. Open your Supabase Dashboard → SQL Editor
-- 2. Paste this entire file
-- 3. Click "Run"
-- 4. Verify all tables appear in the Table Editor
--
-- This script is IDEMPOTENT — safe to run multiple times.
-- ============================================================

-- ============================================================
-- 1. USERS (public profile extending auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================
-- 2. SYLLABUS IMPORTS (audit trail for AI-generated goals)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.syllabus_imports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    file_name       TEXT NOT NULL,
    raw_text        TEXT NOT NULL,
    goals_generated INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_imports_user ON public.syllabus_imports(user_id);

-- ============================================================
-- 3. GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    syllabus_import_id  UUID REFERENCES public.syllabus_imports(id) ON DELETE SET NULL,
    title               TEXT NOT NULL,
    description         TEXT NOT NULL DEFAULT '',
    category            TEXT NOT NULL DEFAULT 'General',
    difficulty          TEXT NOT NULL DEFAULT 'Medium'
                        CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
    xp_reward           INTEGER NOT NULL DEFAULT 100
                        CHECK (xp_reward >= 0 AND xp_reward <= 10000),
    progress            INTEGER NOT NULL DEFAULT 0
                        CHECK (progress >= 0 AND progress <= 100),
    status              TEXT NOT NULL DEFAULT 'To Do'
                        CHECK (status IN ('To Do', 'In Progress', 'Completed')),
    time_spent          TEXT NOT NULL DEFAULT '0h',
    target_date         TEXT,
    deadline            TEXT,
    sub_tasks           JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes               TEXT NOT NULL DEFAULT '',
    links               TEXT[] NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON public.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_syllabus ON public.goals(syllabus_import_id);

-- Prevent exact duplicate goals from same syllabus import
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_no_dup_import
    ON public.goals(user_id, syllabus_import_id, title)
    WHERE syllabus_import_id IS NOT NULL;

-- ============================================================
-- 4. GOAL PROGRESS (completion receipt)
-- The UNIQUE constraint on goal_id is the CORE mechanism
-- that prevents double-completion and double XP.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goal_progress (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id         UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    xp_awarded      INTEGER NOT NULL CHECK (xp_awarded >= 0),
    completed_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    -- CRITICAL: one completion per goal, ever
    CONSTRAINT uq_goal_progress_goal UNIQUE (goal_id)
);

CREATE INDEX IF NOT EXISTS idx_goal_progress_user ON public.goal_progress(user_id);

-- ============================================================
-- 5. USER XP (aggregated stats — 1:1 with users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_xp (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_xp                INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
    level                   INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
    current_streak          INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
    longest_streak          INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
    total_goals_completed   INTEGER NOT NULL DEFAULT 0 CHECK (total_goals_completed >= 0),
    last_activity_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_user_xp_user UNIQUE (user_id)
);

-- ============================================================
-- 6. ACHIEVEMENTS (reference/definition table — seeded once)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT NOT NULL,
    icon        TEXT NOT NULL DEFAULT '🏆',
    category    TEXT NOT NULL CHECK (category IN ('streak', 'milestone', 'special', 'speed', 'consistency')),
    max_progress INTEGER NOT NULL CHECK (max_progress > 0),
    rarity      TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    xp_reward   INTEGER NOT NULL DEFAULT 0 CHECK (xp_reward >= 0)
);

-- ============================================================
-- 7. USER ACHIEVEMENTS (per-user progress tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    achievement_id  TEXT NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    progress        INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
    unlocked_at     TIMESTAMPTZ,
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);

-- ============================================================
-- 8. QUIZ ATTEMPTS (tracks every quiz taken per goal)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    goal_id     UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    score       INTEGER NOT NULL CHECK (score >= 0),
    total       INTEGER NOT NULL DEFAULT 5 CHECK (total > 0),
    passed      BOOLEAN NOT NULL DEFAULT false,
    questions   JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_goal ON public.quiz_attempts(goal_id);

-- ============================================================
-- SEED ACHIEVEMENTS
-- ============================================================
INSERT INTO public.achievements (id, title, description, icon, category, max_progress, rarity, xp_reward) VALUES
    ('first-goal',    'First Steps',        'Complete your first learning goal',                '🎯', 'milestone',   1,   'common',    50),
    ('streak-3',      'Getting Started',    'Maintain a 3-day learning streak',                 '🔥', 'streak',      3,   'common',    100),
    ('streak-7',      'Week Warrior',       'Maintain a 7-day learning streak',                 '⚡', 'streak',      7,   'rare',      250),
    ('streak-30',     'Monthly Master',     'Maintain a 30-day learning streak',                '👑', 'streak',      30,  'epic',      1000),
    ('streak-100',    'Century Champion',   'Maintain a 100-day learning streak',               '🏆', 'streak',      100, 'legendary', 5000),
    ('complete-5',    'Goal Getter',        'Complete 5 learning goals',                        '🎉', 'milestone',   5,   'common',    200),
    ('complete-25',   'Goal Guru',          'Complete 25 learning goals',                       '💎', 'milestone',   25,  'rare',      500),
    ('complete-100',  'Goal Grandmaster',   'Complete 100 learning goals',                      '🌟', 'milestone',   100, 'epic',      2000),
    ('speed-demon',   'Speed Demon',        'Complete a goal within 24 hours of creating it',   '🚀', 'speed',       1,   'rare',      300),
    ('perfect-week',  'Perfect Week',       'Complete at least one goal every day for a week',  '✨', 'consistency', 7,   'epic',      750),
    ('early-bird',    'Early Bird',         'Complete a goal before 8 AM',                      '🌅', 'special',     1,   'rare',      150),
    ('night-owl',     'Night Owl',          'Complete a goal after 10 PM',                      '🦉', 'special',     1,   'rare',      150)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AUTO-CREATE USER PROFILE + XP ROW ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_xp (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Initialize all achievements for the new user
    INSERT INTO public.user_achievements (user_id, achievement_id, progress)
    SELECT NEW.id, a.id, 0
    FROM public.achievements a
    ON CONFLICT (user_id, achievement_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- BACKFILL: Run handle_new_user for existing auth users
-- ============================================================
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id, email, raw_user_meta_data FROM auth.users
    LOOP
        INSERT INTO public.users (id, email, display_name)
        VALUES (
            u.id,
            u.email,
            COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
        )
        ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.user_xp (user_id)
        VALUES (u.id)
        ON CONFLICT (user_id) DO NOTHING;

        INSERT INTO public.user_achievements (user_id, achievement_id, progress)
        SELECT u.id, a.id, 0
        FROM public.achievements a
        ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END LOOP;
END $$;

-- ============================================================
-- ATOMIC GOAL COMPLETION RPC
-- This single function handles:
--   1. Goal status update
--   2. XP award (difficulty-based)
--   3. Streak calculation
--   4. Achievement progress
--   5. Achievement unlock + bonus XP
-- All atomically. Double-completion is impossible.
-- ============================================================
CREATE OR REPLACE FUNCTION public.complete_goal(p_goal_id UUID, p_user_id UUID)
RETURNS jsonb AS $$
DECLARE
    v_goal         RECORD;
    v_xp_reward    INTEGER;
    v_new_total_xp INTEGER;
    v_new_level    INTEGER;
    v_new_streak   INTEGER;
    v_longest      INTEGER;
    v_last_date    DATE;
    v_today        DATE := CURRENT_DATE;
    v_completed_count INTEGER;
    v_achievement_xp  INTEGER := 0;
BEGIN
    -- 1. Lock and fetch goal (FOR UPDATE prevents concurrent completion)
    SELECT id, user_id, xp_reward, status, difficulty, created_at
    INTO v_goal
    FROM public.goals
    WHERE id = p_goal_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Goal not found or access denied');
    END IF;

    -- 2. Already completed? Return early (idempotent)
    IF v_goal.status = 'Completed' THEN
        RETURN jsonb_build_object('error', 'Goal already completed', 'already_completed', true);
    END IF;

    -- Calculate XP based on difficulty
    v_xp_reward := CASE v_goal.difficulty
        WHEN 'Easy' THEN 50
        WHEN 'Hard' THEN 150
        ELSE 100
    END;

    -- 3. Mark goal as completed
    UPDATE public.goals
    SET status = 'Completed',
        progress = 100,
        completed_at = now()
    WHERE id = p_goal_id;

    -- 4. Insert completion receipt (UNIQUE constraint prevents duplicates)
    INSERT INTO public.goal_progress (goal_id, user_id, xp_awarded)
    VALUES (p_goal_id, p_user_id, v_xp_reward);

    -- 5. Update XP atomically
    SELECT last_activity_date, current_streak, longest_streak
    INTO v_last_date, v_new_streak, v_longest
    FROM public.user_xp
    WHERE user_id = p_user_id
    FOR UPDATE;

    -- Calculate streak
    IF v_last_date = (v_today - 1) THEN
        v_new_streak := v_new_streak + 1;
    ELSIF v_last_date = v_today THEN
        -- Same day, keep streak (no change)
        NULL;
    ELSE
        v_new_streak := 1;
    END IF;

    IF v_new_streak > v_longest THEN
        v_longest := v_new_streak;
    END IF;

    UPDATE public.user_xp
    SET total_xp = total_xp + v_xp_reward,
        level = CASE
            WHEN total_xp + v_xp_reward >= 20000 THEN 10
            WHEN total_xp + v_xp_reward >= 12000 THEN 9
            WHEN total_xp + v_xp_reward >= 8000 THEN 8
            WHEN total_xp + v_xp_reward >= 5000 THEN 7
            WHEN total_xp + v_xp_reward >= 3000 THEN 6
            WHEN total_xp + v_xp_reward >= 1500 THEN 5
            WHEN total_xp + v_xp_reward >= 700 THEN 4
            WHEN total_xp + v_xp_reward >= 300 THEN 3
            WHEN total_xp + v_xp_reward >= 100 THEN 2
            ELSE 1
        END,
        current_streak = v_new_streak,
        longest_streak = v_longest,
        total_goals_completed = total_goals_completed + 1,
        last_activity_date = v_today,
        updated_at = now()
    WHERE user_id = p_user_id
    RETURNING total_xp, level INTO v_new_total_xp, v_new_level;

    -- 6. Count total completed for achievement checks
    SELECT COUNT(*) INTO v_completed_count
    FROM public.goal_progress WHERE user_id = p_user_id;

    -- 7. Update milestone achievement progress
    UPDATE public.user_achievements
    SET progress = LEAST(v_completed_count, (SELECT max_progress FROM public.achievements WHERE id = achievement_id))
    WHERE user_id = p_user_id
      AND achievement_id IN ('first-goal', 'complete-5', 'complete-25', 'complete-100');

    -- 8. Update streak achievement progress
    UPDATE public.user_achievements
    SET progress = LEAST(v_new_streak, (SELECT max_progress FROM public.achievements WHERE id = achievement_id))
    WHERE user_id = p_user_id
      AND achievement_id IN ('streak-3', 'streak-7', 'streak-30', 'streak-100');

    -- 9. Check speed demon (completed within 24h of creation)
    IF (now() - v_goal.created_at) < INTERVAL '24 hours' THEN
        UPDATE public.user_achievements
        SET progress = 1
        WHERE user_id = p_user_id AND achievement_id = 'speed-demon' AND progress < 1;
    END IF;

    -- 10. Check time-of-day achievements
    IF EXTRACT(HOUR FROM now()) < 8 THEN
        UPDATE public.user_achievements
        SET progress = 1
        WHERE user_id = p_user_id AND achievement_id = 'early-bird' AND progress < 1;
    END IF;
    IF EXTRACT(HOUR FROM now()) >= 22 THEN
        UPDATE public.user_achievements
        SET progress = 1
        WHERE user_id = p_user_id AND achievement_id = 'night-owl' AND progress < 1;
    END IF;

    -- 11. Auto-unlock newly maxed achievements
    UPDATE public.user_achievements ua
    SET unlocked_at = now()
    WHERE ua.user_id = p_user_id
      AND ua.unlocked_at IS NULL
      AND ua.progress >= (SELECT a.max_progress FROM public.achievements a WHERE a.id = ua.achievement_id);

    -- 12. Award achievement XP for newly unlocked
    SELECT COALESCE(SUM(a.xp_reward), 0) INTO v_achievement_xp
    FROM public.user_achievements ua
    JOIN public.achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = p_user_id
      AND ua.unlocked_at IS NOT NULL
      AND ua.unlocked_at >= now() - INTERVAL '1 second';

    IF v_achievement_xp > 0 THEN
        UPDATE public.user_xp
        SET total_xp = total_xp + v_achievement_xp,
            level = FLOOR((total_xp + v_achievement_xp)::numeric / 1000) + 1,
            updated_at = now()
        WHERE user_id = p_user_id
        RETURNING total_xp, level INTO v_new_total_xp, v_new_level;
    END IF;

    -- 13. Return complete updated state
    RETURN jsonb_build_object(
        'success', true,
        'goal_id', p_goal_id,
        'xp_awarded', v_xp_reward,
        'achievement_xp', v_achievement_xp,
        'total_xp', v_new_total_xp,
        'level', v_new_level,
        'streak', v_new_streak,
        'completed_count', v_completed_count
    );

EXCEPTION
    WHEN unique_violation THEN
        -- goal_progress UNIQUE constraint fired — already completed (concurrent request)
        RETURN jsonb_build_object('error', 'Goal already completed (concurrent request caught)', 'already_completed', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.syllabus_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- USERS: own profile access
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- GOALS: full CRUD on own goals
DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
CREATE POLICY "Users can view own goals" ON public.goals
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own goals" ON public.goals;
CREATE POLICY "Users can create own goals" ON public.goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
CREATE POLICY "Users can update own goals" ON public.goals
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON public.goals;
CREATE POLICY "Users can delete own goals" ON public.goals
    FOR DELETE USING (auth.uid() = user_id);

-- GOAL_PROGRESS: read-only for own records (writes via RPC)
DROP POLICY IF EXISTS "Users can view own progress" ON public.goal_progress;
CREATE POLICY "Users can view own progress" ON public.goal_progress
    FOR SELECT USING (auth.uid() = user_id);

-- USER_XP: read-only for own records (writes via RPC)
DROP POLICY IF EXISTS "Users can view own xp" ON public.user_xp;
CREATE POLICY "Users can view own xp" ON public.user_xp
    FOR SELECT USING (auth.uid() = user_id);

-- USER_ACHIEVEMENTS: read-only for own records (writes via RPC)
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
    FOR SELECT USING (auth.uid() = user_id);

-- ACHIEVEMENTS: read-only definitions (accessible by all authenticated users)
DROP POLICY IF EXISTS "Anyone can view achievements" ON public.achievements;
CREATE POLICY "Anyone can view achievements" ON public.achievements
    FOR SELECT USING (true);

-- SYLLABUS_IMPORTS: own imports only
DROP POLICY IF EXISTS "Users can view own imports" ON public.syllabus_imports;
CREATE POLICY "Users can view own imports" ON public.syllabus_imports
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own imports" ON public.syllabus_imports;
CREATE POLICY "Users can create own imports" ON public.syllabus_imports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- QUIZ_ATTEMPTS: own attempts only
DROP POLICY IF EXISTS "Users can view own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own quiz attempts" ON public.quiz_attempts;
CREATE POLICY "Users can create own quiz attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DONE! All tables, indexes, constraints, triggers, RPC 
-- functions, and RLS policies are now active.
-- ============================================================
