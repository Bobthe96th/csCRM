-- Add duplicate prevention constraints to the database

-- 1. Ensure property_id is unique in Listingdata table (should already be primary key)
-- This is already enforced by the primary key constraint, but let's make sure
ALTER TABLE public."Listingdata" 
ADD CONSTRAINT IF NOT EXISTS "Listingdata_property_id_unique" 
UNIQUE (property_id);

-- 2. Add unique constraint for name + address combination in properties table
-- This prevents duplicate properties with the same name and address
ALTER TABLE public.properties 
ADD CONSTRAINT IF NOT EXISTS "properties_name_address_unique" 
UNIQUE (name, address);

-- 3. Add unique constraint for property_id in property_details table
-- This prevents duplicate detail entries for the same property and detail type
ALTER TABLE public.property_details 
ADD CONSTRAINT IF NOT EXISTS "property_details_property_type_unique" 
UNIQUE (property_id, detail_type, title);

-- 4. Add unique constraint for property_id + contact_type in property_contacts table
-- This prevents duplicate contact entries for the same property and contact type
ALTER TABLE public.property_contacts 
ADD CONSTRAINT IF NOT EXISTS "property_contacts_property_type_unique" 
UNIQUE (property_id, contact_type, name);

-- 5. Add unique constraint for property_id + amenity_name in property_amenities table
-- This prevents duplicate amenity entries for the same property
ALTER TABLE public.property_amenities 
ADD CONSTRAINT IF NOT EXISTS "property_amenities_property_name_unique" 
UNIQUE (property_id, amenity_name);

-- 6. Add unique constraint for property_id + image_type in property_images table
-- This prevents duplicate image entries for the same property and image type
ALTER TABLE public.property_images 
ADD CONSTRAINT IF NOT EXISTS "property_images_property_type_unique" 
UNIQUE (property_id, image_type, image_url);

-- 7. Create an index for faster duplicate checking on Listingdata
CREATE INDEX IF NOT EXISTS "idx_listingdata_property_id" 
ON public."Listingdata" (property_id);

-- 8. Create an index for faster duplicate checking on properties
CREATE INDEX IF NOT EXISTS "idx_properties_name_address" 
ON public.properties (name, address);

-- 9. Add a function to safely insert listings with duplicate prevention
CREATE OR REPLACE FUNCTION insert_listing_safe(
  p_property_id INTEGER,
  p_listing_name TEXT,
  p_address TEXT,
  p_district TEXT,
  p_zone TEXT,
  p_rooms TEXT,
  p_beds TEXT,
  p_bathrooms INTEGER,
  p_wifi_username TEXT,
  p_wifi_password TEXT,
  p_lockbox_code TEXT,
  p_size TEXT
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Check if property_id already exists
  IF EXISTS (SELECT 1 FROM public."Listingdata" WHERE property_id = p_property_id) THEN
    result := json_build_object(
      'success', false,
      'message', 'Property ID already exists',
      'property_id', p_property_id
    );
  ELSE
    -- Insert the new listing
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
    ) VALUES (
      p_property_id,
      p_listing_name,
      p_address,
      p_district,
      p_zone,
      p_rooms,
      p_beds,
      p_bathrooms,
      p_wifi_username,
      p_wifi_password,
      p_lockbox_code,
      p_size
    );
    
    result := json_build_object(
      'success', true,
      'message', 'Listing inserted successfully',
      'property_id', p_property_id
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'message', SQLERRM,
      'property_id', p_property_id
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 10. Add a function to safely insert properties with duplicate prevention
CREATE OR REPLACE FUNCTION insert_property_safe(
  p_name TEXT,
  p_address TEXT,
  p_city TEXT,
  p_state TEXT,
  p_zip_code TEXT,
  p_country TEXT,
  p_property_type TEXT,
  p_bedrooms INTEGER,
  p_bathrooms INTEGER,
  p_max_guests INTEGER
) RETURNS JSON AS $$
DECLARE
  result JSON;
  new_property_id INTEGER;
BEGIN
  -- Check if property with same name and address already exists
  IF EXISTS (SELECT 1 FROM public.properties WHERE name = p_name AND address = p_address) THEN
    result := json_build_object(
      'success', false,
      'message', 'Property with same name and address already exists',
      'name', p_name,
      'address', p_address
    );
  ELSE
    -- Insert the new property
    INSERT INTO public.properties (
      name,
      address,
      city,
      state,
      zip_code,
      country,
      property_type,
      bedrooms,
      bathrooms,
      max_guests,
      status
    ) VALUES (
      p_name,
      p_address,
      p_city,
      p_state,
      p_zip_code,
      p_country,
      p_property_type,
      p_bedrooms,
      p_bathrooms,
      p_max_guests,
      'Active'
    ) RETURNING id INTO new_property_id;
    
    result := json_build_object(
      'success', true,
      'message', 'Property inserted successfully',
      'property_id', new_property_id
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object(
      'success', false,
      'message', SQLERRM,
      'name', p_name,
      'address', p_address
    );
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 11. Create a view to show duplicate listings (if any exist)
CREATE OR REPLACE VIEW duplicate_listings AS
SELECT 
  "Listing Name",
  "Address",
  COUNT(*) as duplicate_count,
  array_agg(property_id) as property_ids
FROM public."Listingdata"
WHERE "Listing Name" IS NOT NULL AND "Address" IS NOT NULL
GROUP BY "Listing Name", "Address"
HAVING COUNT(*) > 1;

-- 12. Create a view to show duplicate properties (if any exist)
CREATE OR REPLACE VIEW duplicate_properties AS
SELECT 
  name,
  address,
  COUNT(*) as duplicate_count,
  array_agg(id) as property_ids
FROM public.properties
GROUP BY name, address
HAVING COUNT(*) > 1;

-- Display current constraints
SELECT 
  'Listingdata constraints:' as info,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'Listingdata' AND table_schema = 'public'
UNION ALL
SELECT 
  'Properties constraints:' as info,
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'properties' AND table_schema = 'public'; 