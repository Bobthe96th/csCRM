-- Create the Listingdata table with the exact schema provided
CREATE TABLE IF NOT EXISTS public."Listingdata" (
    property_id INTEGER PRIMARY KEY,
    "Listing Name" TEXT,
    "Listing GPS coordinate" TEXT,
    "Address" TEXT,
    "District where property is located" TEXT,
    "Zone" TEXT,
    "Number of Rooms" TEXT,
    "Number of Beds" TEXT,
    "Number of Bathrooms" INTEGER,
    "Number Of Balconies" TEXT,
    "Apartment Size In Squaremeters" TEXT,
    "WIFI Username" TEXT,
    "WIFI Password" TEXT,
    "Lockbox/Smartlock Code" TEXT,
    "Access type" TEXT,
    "Electricity meter code" TEXT,
    "Water meter code" TEXT,
    "Gas meter code" TEXT,
    "Mobile Number of building security guard" TEXT,
    "Mobile Number of HOA fee collector" TEXT,
    "Kitchen Appliances" TEXT,
    "Laundry Appliances" TEXT,
    "General guidance" TEXT,
    "Additional notes" TEXT,
    "Host" TEXT,
    "Key" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public."Listingdata" ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
CREATE POLICY "Allow all operations on Listingdata" ON public."Listingdata"
    FOR ALL USING (true);

-- Enable Realtime
ALTER TABLE public."Listingdata" REPLICA IDENTITY FULL;

-- Create an index on property_id for better performance
CREATE INDEX IF NOT EXISTS idx_listingdata_property_id ON public."Listingdata"(property_id);

-- Create an index on district for filtering
CREATE INDEX IF NOT EXISTS idx_listingdata_district ON public."Listingdata"("District where property is located");

-- Create an index on zone for filtering
CREATE INDEX IF NOT EXISTS idx_listingdata_zone ON public."Listingdata"("Zone");

-- Insert some sample data
INSERT INTO public."Listingdata" (
    property_id,
    "Listing Name",
    "Address",
    "District where property is located",
    "Zone",
    "Number of Rooms",
    "Number of Beds",
    "Number of Bathrooms",
    "WIFI Username",
    "WIFI Password",
    "Lockbox/Smartlock Code",
    "Apartment Size In Squaremeters"
) VALUES 
(1, 'Sample Apartment 1', '123 Main Street, Cairo, Egypt', 'Maadi', 'Zone 1', '2', '2', 1, 'SampleWiFi1', 'password123', '1234', '80'),
(2, 'Sample Villa 1', '456 Garden Road, Alexandria, Egypt', 'Miami', 'Zone 2', '3', '3', 2, 'SampleWiFi2', 'password456', '5678', '120'),
(3, 'Downtown Luxury Loft', '789 Business District, Cairo, Egypt', 'Downtown', 'Zone 3', '1', '1', 1, 'DowntownWiFi', 'luxury2024', '9999', '60'),
(4, 'City Center Condo', '321 Central Square, Cairo, Egypt', 'City Center', 'Zone 4', '2', '2', 2, 'CityCondo_WiFi', 'city2024', '7890', '90');

-- Grant necessary permissions
GRANT ALL ON public."Listingdata" TO authenticated;
GRANT ALL ON public."Listingdata" TO anon; 