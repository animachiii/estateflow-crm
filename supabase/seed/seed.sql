-- EstateFlow CRM Seed Data
-- Run AFTER creating a user via the signup flow

-- Sample Organization (update the ID if needed after signup)
-- The signup flow auto-creates the org and admin profile.
-- Below seeds assume an org already exists. Run after first signup.

-- Get the first org ID
DO $$
DECLARE
  org_id uuid;
  admin_id uuid;
  agent1_id uuid;
  agent2_id uuid;
  field_exec_id uuid;
BEGIN
  SELECT id INTO org_id FROM organizations LIMIT 1;
  SELECT id INTO admin_id FROM profiles WHERE role = 'admin' AND organization_id = org_id LIMIT 1;

  IF org_id IS NULL THEN
    RAISE EXCEPTION 'No organization found. Please sign up first.';
  END IF;

  -- Note: Additional users need to be created via the invite flow (auth.users + profiles).
  -- For seed data, we'll use the admin as the agent for demo purposes.
  agent1_id := admin_id;
  agent2_id := admin_id;
  field_exec_id := admin_id;

  -- 20 Sample Leads
  INSERT INTO leads (organization_id, full_name, phone, email, source, property_type, budget_min, budget_max, preferred_location, status, temperature, assigned_agent_id, notes) VALUES
    (org_id, 'Rahul Sharma', '+919876543210', 'rahul@example.com', '36_acre', 'apartment', 7500000, 12000000, 'Gurgaon', 'new', 'hot', agent1_id, 'Looking for 3BHK near Golf Course Road'),
    (org_id, 'Priya Patel', '+919876543211', 'priya@example.com', 'magicbricks', 'villa', 15000000, 25000000, 'Noida', 'contacted', 'warm', agent1_id, 'Interested in gated community'),
    (org_id, 'Amit Kumar', '+919876543212', 'amit@example.com', 'facebook', 'apartment', 5000000, 8000000, 'Dwarka', 'interested', 'hot', agent2_id, 'Ready to visit this weekend'),
    (org_id, 'Neha Singh', '+919876543213', 'neha@example.com', 'instagram', 'plot', 3000000, 6000000, 'Greater Noida', 'new', 'warm', agent1_id, NULL),
    (org_id, 'Vikas Gupta', '+919876543214', 'vikas@example.com', 'housing', 'commercial', 20000000, 50000000, 'Cyber City', 'negotiation', 'hot', agent2_id, 'Looking for office space'),
    (org_id, 'Anita Desai', '+919876543215', 'anita@example.com', 'website', 'apartment', 4000000, 7000000, 'Indirapuram', 'site_visit_scheduled', 'warm', agent1_id, 'Visit scheduled for Saturday'),
    (org_id, 'Rajesh Verma', '+919876543216', 'rajesh@example.com', 'referral', 'villa', 30000000, 50000000, 'Golf Course Extension', 'interested', 'hot', agent2_id, 'High budget client'),
    (org_id, 'Sunita Devi', '+919876543217', NULL, 'manual', 'apartment', 3500000, 5500000, 'Faridabad', 'contacted', 'cold', agent1_id, 'Price sensitive'),
    (org_id, 'Mohammad Ali', '+919876543218', 'ali@example.com', '36_acre', 'rental', 25000, 40000, 'Sector 62', 'new', 'warm', agent2_id, 'Looking for rental'),
    (org_id, 'Kavita Joshi', '+919876543219', 'kavita@example.com', 'facebook', 'apartment', 8000000, 14000000, 'Sohna Road', 'won', 'hot', agent1_id, 'Booked 3BHK in Godrej Aria'),
    (org_id, 'Deepak Mehta', '+919876543220', NULL, 'magicbricks', 'plot', 10000000, 20000000, 'Sector 108', 'lost', 'warm', agent2_id, 'Went with competitor'),
    (org_id, 'Pooja Agarwal', '+919876543221', 'pooja@example.com', 'instagram', 'apartment', 6000000, 9000000, 'Crossing Republik', 'not_responding', 'cold', agent1_id, 'No response after 3 calls'),
    (org_id, 'Sanjay Mishra', '+919876543222', 'sanjay@example.com', 'website', 'commercial', 5000000, 10000000, 'Sector 18', 'contacted', 'warm', agent2_id, NULL),
    (org_id, 'Ritu Chawla', '+919876543223', 'ritu@example.com', 'housing', 'villa', 25000000, 40000000, 'DLF Phase 5', 'interested', 'hot', agent1_id, 'Wants premium property'),
    (org_id, 'Manoj Tiwari', '+919876543224', NULL, 'referral', 'apartment', 4500000, 7500000, 'Raj Nagar Extension', 'new', 'warm', agent2_id, 'Referred by Kavita Joshi'),
    (org_id, 'Pallavi Reddy', '+919876543225', 'pallavi@example.com', 'facebook', 'apartment', 5500000, 8500000, 'Noida Extension', 'contacted', 'warm', agent1_id, NULL),
    (org_id, 'Arun Bhatia', '+919876543226', 'arun@example.com', 'manual', 'plot', 15000000, 30000000, 'Sector 150', 'negotiation', 'hot', agent2_id, 'Finalizing plot size'),
    (org_id, 'Meera Kapoor', '+919876543227', 'meera@example.com', '36_acre', 'apartment', 9000000, 15000000, 'Sector 79', 'site_visit_scheduled', 'warm', agent1_id, 'Visit on Monday'),
    (org_id, 'Rohit Saxena', '+919876543228', 'rohit@example.com', 'instagram', 'rental', 35000, 55000, 'Sector 50', 'new', 'cold', agent2_id, NULL),
    (org_id, 'Shweta Nair', '+919876543229', 'shweta@example.com', 'website', 'apartment', 7000000, 11000000, 'Palam Vihar', 'interested', 'warm', agent1_id, 'Looking for ready-to-move');

  -- 10 Sample Properties
  INSERT INTO properties (organization_id, title, location, address, property_type, price, size_sqft, bedrooms, bathrooms, floor, furnishing, availability, description, amenities, owner_name, owner_phone, tags) VALUES
    (org_id, '3BHK in Godrej Aria', 'Sector 79, Gurgaon', 'Godrej Aria, Tower B, Sector 79', 'apartment', 11500000, 1850, 3, 3, 12, 'semi_furnished', 'available', 'Premium 3BHK apartment with golf course view. Modern amenities and spacious layout.', ARRAY['Swimming Pool', 'Gym', 'Club House', 'Parking', 'Security'], 'Godrej Properties', '+911234567890', ARRAY['premium', 'golf-view', 'new-launch']),
    (org_id, 'Luxury Villa DLF Phase 5', 'DLF Phase 5, Gurgaon', 'DLF Phase 5, Block K', 'villa', 35000000, 4500, 5, 5, NULL, 'fully_furnished', 'available', 'Fully furnished luxury villa with private garden and swimming pool.', ARRAY['Private Pool', 'Garden', 'Modular Kitchen', 'Home Theater', 'Servant Quarter'], 'DLF Ltd', '+911234567891', ARRAY['luxury', 'villa', 'furnished']),
    (org_id, '2BHK Budget Apartment', 'Crossing Republik, Ghaziabad', 'Ajnara Homes, Tower C', 'apartment', 4200000, 1100, 2, 2, 8, 'unfurnished', 'available', 'Affordable 2BHK with good connectivity to Noida.', ARRAY['Parking', 'Lift', 'Security', 'Park'], 'Ajnara Group', '+911234567892', ARRAY['budget', 'ready-to-move']),
    (org_id, 'Commercial Space Cyber City', 'Cyber City, Gurgaon', 'DLF Cyber Hub, 3rd Floor', 'commercial', 25000000, 3000, NULL, 2, 3, 'unfurnished', 'available', 'Prime commercial space in Cyber City with excellent footfall.', ARRAY['AC', 'Power Backup', 'Parking', 'Security', 'Cafeteria'], 'DLF Realty', '+911234567893', ARRAY['commercial', 'prime-location']),
    (org_id, 'Plot in Sector 108', 'Sector 108, Gurgaon', 'HUDA Plot, Sector 108', 'plot', 18000000, 2400, NULL, NULL, NULL, NULL, 'available', 'Freehold plot in developing sector with upcoming metro connectivity.', ARRAY[]::text[], 'Private Owner', '+911234567894', ARRAY['freehold', 'metro-connectivity']),
    (org_id, '4BHK Penthouse', 'Golf Course Road, Gurgaon', 'The Camellias, Penthouse Level', 'apartment', 75000000, 6500, 4, 4, 22, 'fully_furnished', 'hold', 'Ultra-luxury penthouse with panoramic views.', ARRAY['Private Terrace', 'Jacuzzi', 'Smart Home', 'Concierge', 'Valet Parking'], 'DLF Ltd', '+911234567895', ARRAY['ultra-luxury', 'penthouse']),
    (org_id, '3BHK Noida Extension', 'Noida Extension', 'Gaur City, 16th Avenue', 'apartment', 6500000, 1650, 3, 2, 14, 'semi_furnished', 'available', 'Spacious 3BHK in well-maintained society with metro access.', ARRAY['Swimming Pool', 'Gym', 'Tennis Court', 'Shopping Complex', 'Metro Access'], 'Gaursons', '+911234567896', ARRAY['mid-range', 'metro']),
    (org_id, 'Rental 2BHK Sector 62', 'Sector 62, Noida', 'ATS Village, Block A', 'rental', 28000, 1000, 2, 2, 6, 'semi_furnished', 'available', 'Well-maintained 2BHK available for immediate possession.', ARRAY['Parking', 'Power Backup', 'Lift', 'Park'], NULL, NULL, ARRAY['rental', 'ready-to-move']),
    (org_id, 'Villa in Greater Noida', 'Greater Noida', 'Jaypee Greens, Wish Town', 'villa', 22000000, 3800, 4, 4, NULL, 'semi_furnished', 'available', 'Independent villa in Jaypee Greens with excellent greenery.', ARRAY['Garden', 'Club House', 'Golf Course', 'Swimming Pool'], 'Jaypee Group', '+911234567898', ARRAY['villa', 'green-living']),
    (org_id, '1BHK Studio Apartment', 'Sector 50, Gurgaon', 'M3M Merlin, Tower D', 'apartment', 3800000, 650, 1, 1, 18, 'fully_furnished', 'sold', 'Compact studio apartment ideal for bachelors or investment.', ARRAY['Gym', 'Swimming Pool', 'Retail', 'Metro Access'], 'M3M Group', '+911234567899', ARRAY['studio', 'investment']);

  -- Sample Activities
  INSERT INTO activities (organization_id, lead_id, user_id, type, title, description) VALUES
    (org_id, (SELECT id FROM leads WHERE full_name = 'Rahul Sharma' LIMIT 1), admin_id, 'note', 'Lead created from 36 Acre webhook', NULL),
    (org_id, (SELECT id FROM leads WHERE full_name = 'Rahul Sharma' LIMIT 1), admin_id, 'call', 'Bridge call initiated', 'Connected with lead'),
    (org_id, (SELECT id FROM leads WHERE full_name = 'Kavita Joshi' LIMIT 1), admin_id, 'status_change', 'Status changed to Won', 'Booked 3BHK in Godrej Aria'),
    (org_id, (SELECT id FROM leads WHERE full_name = 'Amit Kumar' LIMIT 1), admin_id, 'property_share', 'Shared 3BHK in Godrej Aria via WhatsApp', NULL),
    (org_id, (SELECT id FROM leads WHERE full_name = 'Priya Patel' LIMIT 1), admin_id, 'follow_up', 'Follow-up scheduled (call)', NULL);

  -- Sample Follow-ups
  INSERT INTO followups (organization_id, lead_id, agent_id, type, status, scheduled_at, message) VALUES
    (org_id, (SELECT id FROM leads WHERE full_name = 'Rahul Sharma' LIMIT 1), admin_id, 'whatsapp', 'pending', NOW() - interval '2 hours', 'Hi Rahul, just checking if you had a chance to review the property details I shared.'),
    (org_id, (SELECT id FROM leads WHERE full_name = 'Amit Kumar' LIMIT 1), admin_id, 'call', 'pending', NOW() + interval '1 day', NULL),
    (org_id, (SELECT id FROM leads WHERE full_name = 'Ritu Chawla' LIMIT 1), admin_id, 'email', 'pending', NOW() + interval '3 hours', 'Share premium villa options');

  -- Sample Attendance
  INSERT INTO attendance (organization_id, user_id, check_in_time, check_out_time, check_in_latitude, check_in_longitude, status) VALUES
    (org_id, admin_id, NOW() - interval '2 hours', NULL, 28.4595, 77.0266, 'present');

  -- Sample Social Posts
  INSERT INTO social_posts (organization_id, post_type, caption, status, scheduled_at, assigned_to) VALUES
    (org_id, 'instagram_reel', 'Top 5 locations to invest in Gurgaon in 2025! Which one is your pick?', 'draft', NOW() + interval '2 days', admin_id),
    (org_id, 'instagram_post', 'New launch alert! 3BHK apartments starting at ₹75L in Sector 79. DM us for details.', 'scheduled', NOW() + interval '1 day', admin_id),
    (org_id, 'facebook_post', 'Looking for your dream home? We have 100+ verified properties across Gurgaon, Noida & Greater Noida.', 'idea', NULL, NULL),
    (org_id, 'linkedin_post', 'Real estate market insights: Q1 2025 saw a 15% increase in luxury segment demand in Gurgaon.', 'published', NOW() - interval '3 days', admin_id);

END $$;
