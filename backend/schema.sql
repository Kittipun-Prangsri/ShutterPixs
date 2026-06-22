-- Supabase SQL Schema for ShutterPixs Booking & Portfolio System

-- Drop tables if they exist
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;

-- Create portfolios table
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'wedding', 'ordination', 'graduation', 'other'
    image_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create bookings table
CREATE TABLE bookings (
    id VARCHAR(50) PRIMARY KEY, -- Custom format: SP-YYYYMMDD-XXXX (e.g. SP-20260622-001)
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_line_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL, -- 'wedding', 'ordination', 'graduation', 'other'
    event_date DATE NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- 'pending', 'confirmed', 'completed', 'cancelled'
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert dummy/initial portfolios so the site isn't blank
INSERT INTO portfolios (title, category, image_url, description) VALUES
('Eternal Love at The Glasshouse', 'wedding', 'assets/images/wedding_1.jpg', 'Modern romantic garden wedding photoshoot featuring natural light and candid moments.'),
('Traditional Thai Blessed Union', 'wedding', 'assets/images/wedding_2.jpg', 'Elegant traditional Thai wedding ceremony capturing the exquisite details of Thai attire and sacred water pouring ritual.'),
('Pristine Ordination Ceremony', 'ordination', 'assets/images/ordination_1.jpg', 'Shaving ritual and serene ordination ceremony at the historic Wat Phra Kaew, capturing local cultural legacy.'),
('Path to Enlightenment', 'ordination', 'assets/images/ordination_2.jpg', 'The sacred moments of a monk walking around the chapel, surrounded by joyful family and friends.'),
('Proud Achievements at Chulalongkorn', 'graduation', 'assets/images/graduation_1.jpg', 'Joyful graduation outdoor portrait photoshoot with iconic campus backdrops and premium color grading.'),
('Milestone Reached!', 'graduation', 'assets/images/graduation_2.jpg', 'Group graduation photography capturing genuine smiles, mortarboard tosses, and bright memories with close friends.'),
('Minimalist Studio Portraiture', 'other', 'assets/images/other_1.jpg', 'High-end studio profile shoots highlighting personal branding, professional lighting, and editorial styles.'),
('Sunset Beach Couple Session', 'other', 'assets/images/other_2.jpg', 'Cinematic pre-wedding style couple photoshoot during the golden hour on the white sands of Phuket.');
