-- Property Management System Schema
-- Copy and paste this entire script into Supabase SQL Editor

-- 1. Create properties table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(50) DEFAULT 'USA',
    property_type VARCHAR(50) DEFAULT 'Apartment' CHECK (property_type IN ('Apartment', 'House', 'Condo', 'Villa', 'Cabin', 'Other')),
    bedrooms INTEGER DEFAULT 1,
    bathrooms INTEGER DEFAULT 1,
    max_guests INTEGER DEFAULT 2,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Maintenance', 'Booked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create property_details table for flexible property information
CREATE TABLE IF NOT EXISTS property_details (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    detail_type VARCHAR(50) NOT NULL CHECK (detail_type IN (
        'checkin_info', 'checkout_info', 'lockbox_code', 'wifi_info', 
        'parking_info', 'amenities', 'house_rules', 'emergency_contact',
        'cleaning_info', 'maintenance_contact', 'local_recommendations',
        'transportation', 'key_location', 'access_instructions'
    )),
    title VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    is_public BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(property_id, detail_type, title)
);

-- 3. Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type VARCHAR(20) DEFAULT 'main' CHECK (image_type IN ('main', 'interior', 'exterior', 'amenity', 'floor_plan')),
    caption TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create property_contacts table
CREATE TABLE IF NOT EXISTS property_contacts (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    contact_type VARCHAR(30) NOT NULL CHECK (contact_type IN (
        'owner', 'manager', 'cleaner', 'maintenance', 'emergency', 'concierge'
    )),
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    notes TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create property_amenities table
CREATE TABLE IF NOT EXISTS property_amenities (
    id SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    amenity_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_available BOOLEAN DEFAULT true,
    icon VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Enable Row Level Security
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_amenities ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for public access (for testing - make more restrictive later)
DROP POLICY IF EXISTS "Allow public access to properties" ON properties;
CREATE POLICY "Allow public access to properties" ON properties FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to property_details" ON property_details;
CREATE POLICY "Allow public access to property_details" ON property_details FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to property_images" ON property_images;
CREATE POLICY "Allow public access to property_images" ON property_images FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to property_contacts" ON property_contacts;
CREATE POLICY "Allow public access to property_contacts" ON property_contacts FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow public access to property_amenities" ON property_amenities;
CREATE POLICY "Allow public access to property_amenities" ON property_amenities FOR ALL USING (true);

-- 8. Enable realtime for all tables
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'properties') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE properties;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'property_details') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE property_details;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'property_images') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE property_images;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'property_contacts') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE property_contacts;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'property_amenities') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE property_amenities;
    END IF;
END $$;

-- 9. Insert sample properties
INSERT INTO properties (name, address, city, state, zip_code, property_type, bedrooms, bathrooms, max_guests, status) VALUES
('Sunset Beach Villa', '123 Ocean Drive', 'Miami Beach', 'FL', '33139', 'Villa', 3, 2, 6, 'Active'),
('Downtown Luxury Loft', '456 Main Street', 'New York', 'NY', '10001', 'Apartment', 2, 2, 4, 'Active'),
('Mountain View Cabin', '789 Pine Ridge Road', 'Aspen', 'CO', '81611', 'Cabin', 2, 1, 4, 'Active'),
('City Center Condo', '321 Urban Avenue', 'Chicago', 'IL', '60601', 'Condo', 1, 1, 2, 'Active'),
('Lakeside Family Home', '654 Lake View Drive', 'Seattle', 'WA', '98101', 'House', 4, 3, 8, 'Active')
ON CONFLICT DO NOTHING;

-- 10. Insert sample property details
INSERT INTO property_details (property_id, detail_type, title, value, priority) VALUES
-- Property 1: Sunset Beach Villa
(1, 'checkin_info', 'Check-in Time', '3:00 PM', 1),
(1, 'checkin_info', 'Check-out Time', '11:00 AM', 2),
(1, 'lockbox_code', 'Front Door Lockbox', '1234', 1),
(1, 'wifi_info', 'WiFi Network', 'SunsetVilla_5G', 1),
(1, 'wifi_info', 'WiFi Password', 'Beach2024!', 2),
(1, 'parking_info', 'Parking', 'Free street parking available. Garage space #3', 1),
(1, 'amenities', 'Pool Access', 'Heated pool open 7AM-10PM', 1),
(1, 'house_rules', 'No Smoking', 'Smoking is not allowed anywhere on the property', 1),
(1, 'house_rules', 'Quiet Hours', 'Quiet hours from 10 PM to 8 AM', 2),
(1, 'emergency_contact', 'Property Manager', 'Sarah Johnson - +1-555-0123', 1),
(1, 'emergency_contact', 'Emergency Services', '911 for emergencies, then call property manager', 2),

-- Property 2: Downtown Luxury Loft
(2, 'checkin_info', 'Check-in Time', '4:00 PM', 1),
(2, 'checkin_info', 'Check-out Time', '10:00 AM', 2),
(2, 'lockbox_code', 'Building Entrance', '5678', 1),
(2, 'lockbox_code', 'Apartment Door', '9012', 2),
(2, 'wifi_info', 'WiFi Network', 'DowntownLoft', 1),
(2, 'wifi_info', 'WiFi Password', 'Luxury2024!', 2),
(2, 'parking_info', 'Parking', 'Valet parking available at $25/day', 1),
(2, 'amenities', 'Gym Access', '24/7 fitness center on 3rd floor', 1),
(2, 'house_rules', 'No Parties', 'No parties or large gatherings', 1),
(2, 'emergency_contact', 'Building Security', '+1-555-0456', 1),

-- Property 3: Mountain View Cabin
(3, 'checkin_info', 'Check-in Time', '3:00 PM', 1),
(3, 'checkin_info', 'Check-out Time', '11:00 AM', 2),
(3, 'lockbox_code', 'Front Door', '3456', 1),
(3, 'wifi_info', 'WiFi Network', 'MountainCabin', 1),
(3, 'wifi_info', 'WiFi Password', 'Nature2024!', 2),
(3, 'parking_info', 'Parking', 'Free parking in driveway', 1),
(3, 'amenities', 'Fireplace', 'Wood-burning fireplace (wood provided)', 1),
(3, 'house_rules', 'Fire Safety', 'Never leave fireplace unattended', 1),
(3, 'emergency_contact', 'Local Emergency', '911 for emergencies', 1),

-- Property 4: City Center Condo
(4, 'checkin_info', 'Check-in Time', '3:00 PM', 1),
(4, 'checkin_info', 'Check-out Time', '11:00 AM', 2),
(4, 'lockbox_code', 'Building Lobby', '7890', 1),
(4, 'wifi_info', 'WiFi Network', 'CityCondo_WiFi', 1),
(4, 'wifi_info', 'WiFi Password', 'Urban2024!', 2),
(4, 'parking_info', 'Parking', 'Street parking only', 1),
(4, 'amenities', 'Rooftop Deck', 'Access to rooftop deck with city views', 1),
(4, 'house_rules', 'Building Rules', 'Follow all building rules and regulations', 1),
(4, 'emergency_contact', 'Building Manager', '+1-555-0789', 1),

-- Property 5: Lakeside Family Home
(5, 'checkin_info', 'Check-in Time', '4:00 PM', 1),
(5, 'checkin_info', 'Check-out Time', '10:00 AM', 2),
(5, 'lockbox_code', 'Front Door', '2345', 1),
(5, 'wifi_info', 'WiFi Network', 'LakesideHome', 1),
(5, 'wifi_info', 'WiFi Password', 'Family2024!', 2),
(5, 'parking_info', 'Parking', '2-car garage + street parking', 1),
(5, 'amenities', 'Boat Dock', 'Private boat dock available', 1),
(5, 'house_rules', 'Pet Policy', 'Pets allowed with $50 fee', 1),
(5, 'emergency_contact', 'Property Owner', 'Mike Wilson - +1-555-0321', 1)
ON CONFLICT DO NOTHING;

-- 11. Insert sample property contacts
INSERT INTO property_contacts (property_id, contact_type, name, phone, email, is_primary) VALUES
(1, 'owner', 'John Smith', '+1-555-0101', 'john@sunsetvilla.com', true),
(1, 'manager', 'Sarah Johnson', '+1-555-0123', 'sarah@sunsetvilla.com', true),
(1, 'cleaner', 'Maria Garcia', '+1-555-0124', 'maria@sunsetvilla.com', false),
(2, 'owner', 'Lisa Chen', '+1-555-0201', 'lisa@downtownloft.com', true),
(2, 'manager', 'David Kim', '+1-555-0223', 'david@downtownloft.com', true),
(3, 'owner', 'Robert Wilson', '+1-555-0301', 'robert@mountaincabin.com', true),
(4, 'owner', 'Jennifer Brown', '+1-555-0401', 'jennifer@citycondo.com', true),
(5, 'owner', 'Mike Wilson', '+1-555-0321', 'mike@lakesidehome.com', true)
ON CONFLICT DO NOTHING;

-- 12. Insert sample property amenities
INSERT INTO property_amenities (property_id, amenity_name, description, icon) VALUES
(1, 'Private Pool', 'Heated outdoor pool with ocean view', '🏊‍♂️'),
(1, 'Beach Access', 'Direct access to private beach', '🏖️'),
(1, 'BBQ Grill', 'Gas grill on the patio', '🍖'),
(1, 'Air Conditioning', 'Central air conditioning', '❄️'),
(2, 'Gym', '24/7 fitness center', '💪'),
(2, 'Rooftop Terrace', 'Private rooftop with city views', '🏙️'),
(2, 'Doorman', '24/7 doorman service', '👨‍💼'),
(2, 'Elevator', 'Private elevator access', '🛗'),
(3, 'Fireplace', 'Wood-burning fireplace', '🔥'),
(3, 'Mountain Views', 'Panoramic mountain views', '🏔️'),
(3, 'Hiking Trails', 'Access to nearby hiking trails', '🥾'),
(3, 'Hot Tub', 'Private hot tub on deck', '🛁'),
(4, 'Rooftop Deck', 'Shared rooftop deck', '🏙️'),
(4, 'Gym', 'Building gym access', '💪'),
(4, 'Concierge', 'Concierge service', '👨‍💼'),
(5, 'Boat Dock', 'Private boat dock', '🚤'),
(5, 'Lake Access', 'Direct lake access', '🏞️'),
(5, 'Fire Pit', 'Outdoor fire pit', '🔥'),
(5, 'Garage', '2-car garage', '🚗')
ON CONFLICT DO NOTHING;

-- 13. Show results
SELECT 'properties' as table_name, COUNT(*) as row_count FROM properties
UNION ALL
SELECT 'property_details' as table_name, COUNT(*) as row_count FROM property_details
UNION ALL
SELECT 'property_contacts' as table_name, COUNT(*) as row_count FROM property_contacts
UNION ALL
SELECT 'property_amenities' as table_name, COUNT(*) as row_count FROM property_amenities; 