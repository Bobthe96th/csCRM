-- iCal Management Schema
-- This schema handles iCal links for different booking platforms

-- Table to store iCal links for each property
CREATE TABLE IF NOT EXISTS public.ical_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id TEXT NOT NULL REFERENCES public."Listingdata"(property_id) ON DELETE CASCADE,
    platform_name TEXT NOT NULL CHECK (platform_name IN ('airbnb', 'booking', 'agoda', 'tripadvisor', 'nomads', 'hive', 'other')),
    ical_url TEXT NOT NULL,
    display_name TEXT,
    is_active BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table to store parsed calendar events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ical_link_id UUID REFERENCES public.ical_links(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL REFERENCES public."Listingdata"(property_id) ON DELETE CASCADE,
    event_id TEXT NOT NULL, -- Unique identifier from the iCal
    title TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, tentative
    platform TEXT NOT NULL,
    guest_name TEXT,
    guest_email TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ical_link_id, event_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ical_links_property_id ON public.ical_links(property_id);
CREATE INDEX IF NOT EXISTS idx_ical_links_platform ON public.ical_links(platform_name);
CREATE INDEX IF NOT EXISTS idx_calendar_events_property_id ON public.calendar_events(property_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON public.calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_ical_link_id ON public.calendar_events(ical_link_id);

-- Enable Row Level Security
ALTER TABLE public.ical_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ical_links
CREATE POLICY "Allow all operations on ical_links" ON public.ical_links
    FOR ALL USING (true);

-- RLS Policies for calendar_events
CREATE POLICY "Allow all operations on calendar_events" ON public.calendar_events
    FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_ical_links_updated_at BEFORE UPDATE ON public.ical_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get occupancy for a property
CREATE OR REPLACE FUNCTION get_property_occupancy(
    p_property_id TEXT,
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS TABLE (
    date DATE,
    is_occupied BOOLEAN,
    event_count INTEGER,
    platforms TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            p_start_date::date,
            p_end_date::date,
            '1 day'::interval
        )::date AS date
    ),
    occupancy_data AS (
        SELECT 
            ds.date,
            CASE WHEN COUNT(ce.id) > 0 THEN true ELSE false END as is_occupied,
            COUNT(ce.id) as event_count,
            ARRAY_AGG(DISTINCT ce.platform) FILTER (WHERE ce.id IS NOT NULL) as platforms
        FROM date_series ds
        LEFT JOIN public.calendar_events ce ON 
            ds.date >= ce.start_date::date AND 
            ds.date < ce.end_date::date AND 
            ce.property_id = p_property_id AND
            ce.status = 'confirmed'
        GROUP BY ds.date
    )
    SELECT 
        od.date,
        od.is_occupied,
        od.event_count,
        COALESCE(od.platforms, ARRAY[]::TEXT[]) as platforms
    FROM occupancy_data od
    ORDER BY od.date;
END;
$$ LANGUAGE plpgsql; 