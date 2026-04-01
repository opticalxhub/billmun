-- Direct fix for missing columns
-- Use this if ALTER TABLE with multiple columns fails

-- Check and add columns one by one
DO $$
BEGIN
    -- Add to media_gallery if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_gallery' AND column_name = 'created_at') THEN
        ALTER TABLE media_gallery ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_gallery' AND column_name = 'is_hidden') THEN
        ALTER TABLE media_gallery ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_gallery' AND column_name = 'title') THEN
        ALTER TABLE media_gallery ADD COLUMN title TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_gallery' AND column_name = 'media_type') THEN
        ALTER TABLE media_gallery ADD COLUMN media_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_gallery' AND column_name = 'mime_type') THEN
        ALTER TABLE media_gallery ADD COLUMN mime_type TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_gallery' AND column_name = 'reviewed_by') THEN
        ALTER TABLE media_gallery ADD COLUMN reviewed_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_gallery' AND column_name = 'reviewed_at') THEN
        ALTER TABLE media_gallery ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add to press_releases if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'press_releases' AND column_name = 'created_at') THEN
        ALTER TABLE press_releases ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'press_releases' AND column_name = 'is_hidden') THEN
        ALTER TABLE press_releases ADD COLUMN is_hidden BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'press_releases' AND column_name = 'reviewed_by') THEN
        ALTER TABLE press_releases ADD COLUMN reviewed_by UUID REFERENCES users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'press_releases' AND column_name = 'reviewed_at') THEN
        ALTER TABLE press_releases ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    -- Add to conference_config if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'conference_config' AND column_name = 'countdown_target') THEN
        ALTER TABLE conference_config ADD COLUMN countdown_target TIMESTAMP WITH TIME ZONE;
        UPDATE conference_config SET countdown_target = '2026-04-03 09:30:00+00' WHERE id = '1';
    END IF;
END $$;
