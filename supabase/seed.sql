-- ====================================================================
-- AMG HOLDINGS ENTERPRISE E-COMMERCE & RFQ PLATFORM
-- PRODUCTION SEED DATA (SUPABASE / POSTGRESQL 15+)
-- ====================================================================

-- 1. SEED SUBSIDIARIES
INSERT INTO subsidiaries (id, code, name, slug, description, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'AMG_STEEL', 'AMG Heavy Structural Engineering', 'amg-heavy-steel', 'Pre-engineered structural steel buildings, columns, rafters, H/I beams and smart poles.', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'AMG_ROOFING', 'AMG Ethio & Adama Roofing Solutions', 'amg-roofing', 'Ethio, Adama, and Momina stone-coated & galvanized roofing sheets, gutters and tiles.', TRUE),
    ('33333333-3333-3333-3333-333333333333', 'AMG_TRANSPORT', 'AMG Commercial Transport & Logistics', 'amg-transport', 'Sinotruk prime movers, BPW/York heavy transport trailers, fuel tankers, and dry cargo bodies.', TRUE),
    ('44444444-4444-4444-4444-444444444444', 'AMG_GAS_LUBE', 'AMG Industrial Gases & Lubricants', 'amg-gas-lubricants', 'Medical/technical gases (Oxygen, Argon, Nitrogen) and certified heavy industrial lubricants.', TRUE),
    ('55555555-5555-5555-5555-555555555555', 'AMG_COFFEE', 'AMG Consumer Goods & Specialty Coffee', 'amg-coffee', 'AMG Roasted and Ground Ethiopian Specialty Arabica Coffee (Premium Plus, Premium, Best).', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. SEED REGIONAL BRANCHES
INSERT INTO branches (id, subsidiary_id, code, name, city, address, phone, email, is_hub, is_active)
VALUES
    ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'BR_AA_HQ', 'Addis Ababa Central Hub', 'Addis Ababa', 'Bole Subcity, AMG Tower, Airport Road', '+251 11 662 4500', 'addis.hub@amgholdings.com', TRUE, TRUE),
    ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'BR_ADAMA', 'Adama Industrial Park Hub', 'Adama', 'Adama Industrial Zone, Plot 4A', '+251 22 111 8900', 'adama.plant@amgholdings.com', TRUE, TRUE),
    ('a3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'BR_HAWASSA', 'Hawassa Regional Depot', 'Hawassa', 'Hawassa Industrial Corridor, Gate 2', '+251 46 220 3344', 'hawassa.branch@amgholdings.com', FALSE, TRUE),
    ('a4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'BR_DIREDAWA', 'Dire Dawa Logistics Hub', 'Dire Dawa', 'Free Trade Zone Terminal C', '+251 25 111 5566', 'diredawa.hub@amgholdings.com', TRUE, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 3. SEED USER PROFILES (4 ROLES REPRESENTED)
INSERT INTO user_profiles (id, email, full_name, phone, role, subsidiary_id, branch_id, company_name, tin_number, is_verified)
VALUES
    -- Super Admin
    ('e1111111-1111-1111-1111-111111111111', 'superadmin@amgholdings.com', 'Dawit Haile (Corporate Super Admin)', '+251 91 120 0001', 'super_admin', NULL, 'a1111111-1111-1111-1111-111111111111', 'AMG Holdings Corporate', '0001293847', TRUE),
    -- Branch Admin (Adama Hub)
    ('e2222222-2222-2222-2222-222222222222', 'roofing.admin@amgholdings.com', 'Mulugeta Tadesse (Adama Branch Director)', '+251 91 230 0002', 'branch_admin', '22222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'AMG Roofing Ltd.', '0044819231', TRUE),
    -- Dedicated Sales Agent (Steel & Automotive)
    ('e3333333-3333-3333-3333-333333333333', 'agent.solomon@amgholdings.com', 'Solomon Bekele (Senior Sales Engineer)', '+251 91 340 0003', 'sales_agent', '11111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'AMG Heavy Steel Division', '0055928172', TRUE),
    -- B2B Corporate Buyer
    ('e4444444-4444-4444-4444-444444444444', 'procurement@midroc-corp.et', 'Almaz Worku (MIDROC Procurement Mgr)', '+251 91 450 0004', 'customer', NULL, NULL, 'MIDROC Construction Ethiopia PLC', '0019283746', TRUE),
    -- B2C Retail Customer
    ('e5555555-5555-5555-5555-555555555555', 'abebe.kebede@gmail.com', 'Abebe Kebede', '+251 91 560 0005', 'customer', NULL, NULL, NULL, NULL, TRUE)
ON CONFLICT (email) DO NOTHING;

-- 4. SEED CATEGORIES
INSERT INTO categories (id, subsidiary_id, name, slug, description, display_order)
VALUES
    ('c1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Roofing Tiles & Sheets', 'roofing-tiles-sheets', 'Ethio, Adama & Momina corrugated and stone-coated tiles', 1),
    ('c2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Standard Steel Profiles', 'standard-steel-profiles', 'Grade 60 rebars, wire rods, angle irons and tubing', 2),
    ('c3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Heavy Structural Frameworks', 'heavy-structural-frameworks', 'Engineered H-beams, rafters, and industrial columns (Stream B)', 3),
    ('c4444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'Commercial Transport & Trailers', 'commercial-transport', 'Sinotruk prime movers, fuel tankers & dry bodies (Stream B)', 4),
    ('c5555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'Industrial Gases & Lubricants', 'industrial-gases-lubricants', 'Bulk high-pressure cylinders and heavy motor oils', 5),
    ('c6666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'Specialty Packaged Coffee', 'packaged-coffee', 'AMG roasted and ground export grade coffees', 6)
ON CONFLICT (id) DO NOTHING;

-- 5. SEED PRODUCTS (STREAM A & STREAM B)
INSERT INTO products (
    id, subsidiary_id, category_id, sku, name, slug, description,
    transaction_stream, unit_price_etb, currency, unit_measurement, moq,
    technical_specs, is_featured, is_active
) VALUES
    -- Stream A Product 1: Ethio Roofing Tile
    (
        'f1111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        'c1111111-1111-1111-1111-111111111111',
        'AMG-ROOF-ET-040',
        'Ethio Tile Pre-Painted Roofing Sheet (0.40mm Terracotta Red)',
        'ethio-tile-roofing-sheet-040mm-terracotta',
        'High-durability galvanized corrugated steel roofing tile engineered for tropical weather resistance and UV protection.',
        'direct_checkout',
        1850.00,
        'ETB',
        'sheet',
        10,
        '{
            "thickness": "0.40 mm",
            "effective_width": "920 mm",
            "standard_length": "2000 mm",
            "zinc_coating": "Z120 (120 g/m²)",
            "paint_finish": "SMP Polyester Baked Enamel",
            "color": "Terracotta Red (RAL 3009)",
            "warranty": "20-Year Anti-Perforation Warranty"
        }'::jsonb,
        TRUE,
        TRUE
    ),
    -- Stream A Product 2: Grade 60 High-Yield Steel Rebar
    (
        'f2222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'c2222222-2222-2222-2222-222222222222',
        'AMG-STEEL-RB-16MM',
        'Grade 60 Deformed High-Yield Rebar (16mm x 12m)',
        'grade-60-deformed-steel-rebar-16mm',
        'ASTM A615 Grade 60 hot-rolled ribbed reinforcing steel bar for structural concrete reinforcement in commercial buildings and infrastructure.',
        'direct_checkout',
        4120.00,
        'ETB',
        'piece',
        20,
        '{
            "diameter": "16 mm",
            "length": "12.0 meters",
            "standard": "ASTM A615 / ES ISO 6935-2",
            "yield_strength": "≥ 420 MPa (Grade 60)",
            "tensile_strength": "≥ 620 MPa",
            "mass_per_meter": "1.58 kg/m",
            "carbon_equivalent": "≤ 0.52%"
        }'::jsonb,
        TRUE,
        TRUE
    ),
    -- Stream A Product 3: AMG Premium Plus Specialty Coffee
    (
        'f3333333-3333-3333-3333-333333333333',
        '55555555-5555-5555-5555-555555555555',
        'c6666666-6666-6666-6666-666666666666',
        'AMG-COF-PPLUS-500G',
        'AMG Roasted & Ground Coffee (Premium Plus Grade - 500g)',
        'amg-roasted-ground-coffee-premium-plus-500g',
        'Single-origin Yirgacheffe and Sidama high-altitude Arabica blend, medium-dark roasted and airtight foil sealed for enterprise export quality.',
        'direct_checkout',
        850.00,
        'ETB',
        'tin',
        1,
        '{
            "origin": "Yirgacheffe & Sidama, Ethiopia",
            "altitude": "1,950 - 2,200 MASL",
            "process": "Washed & Sun-Dried",
            "roast_level": "Medium-Dark Roast",
            "packaging": "500g Nitro-Flushed Degassing Foil Bag",
            "cupping_score": "88.5 SCA Specialty"
        }'::jsonb,
        TRUE,
        TRUE
    ),
    -- Stream A Product 4: Industrial Heavy Duty Lubricant HD-40
    (
        'f4444444-4444-4444-4444-444444444444',
        '44444444-4444-4444-4444-444444444444',
        'c5555555-5555-5555-5555-555555555555',
        'AMG-LUBE-HD40-25L',
        'AMG Super Diesel Engine Oil HD-40 (25 Litre Canister)',
        'amg-super-diesel-engine-oil-hd40-25l',
        'Premium heavy-duty monogrande diesel lubricant formulated for high ambient temperature African operating environments and commercial truck fleets.',
        'direct_checkout',
        8900.00,
        'ETB',
        'canister',
        1,
        '{
            "viscosity_grade": "SAE 40 / API CF/SF",
            "volume": "25 Litres",
            "flash_point": "242 °C",
            "tbn": "11.2 mg KOH/g",
            "application": "Heavy commercial trucks, generator sets, industrial pumps"
        }'::jsonb,
        FALSE,
        TRUE
    ),
    -- Stream B Product 1: Sinotruk HOWO 6x4 Prime Mover + 3-Axle Trailer
    (
        'f5555555-5555-5555-5555-555555555555',
        '33333333-3333-3333-3333-333333333333',
        'c4444444-4444-4444-4444-444444444444',
        'AMG-VEH-HOWO-6X4',
        'Sinotruk HOWO 6x4 Prime Mover with Heavy-Duty BPW Semi-Trailer',
        'sinotruk-howo-6x4-prime-mover-bpw-trailer',
        'Heavy-duty 420HP Euro-III commercial transport prime mover integrated with custom 13-meter 3-axle reinforced flatbed or dry cargo trailer. Agent custom quotation required.',
        'assisted_quote',
        0.00,
        'ETB',
        'unit',
        1,
        '{
            "engine": "Sinotruk WD615.47 (420 HP) Turbocharged Intercooled",
            "drive_type": "6x4 Left-Hand Drive (LHD)",
            "transmission": "HW19710 10-Speed Manual with PTO",
            "axles": "HC16 Heavy Reduction Tandem Axle (16 Ton)",
            "trailer_payload": "45,000 kg (45 Metric Tons)",
            "suspension": "Heavy Multi-Leaf Spring Suspension",
            "customizations": "Choice of Flatbed, Dry Cargo Box, or 45,000L Fuel Tanker"
        }'::jsonb,
        TRUE,
        TRUE
    ),
    -- Stream B Product 2: Pre-Engineered Heavy Steel Columns & Rafters
    (
        'f6666666-6666-6666-6666-666666666666',
        '11111111-1111-1111-1111-111111111111',
        'c3333333-3333-3333-3333-333333333333',
        'AMG-STEEL-PEB-S355',
        'Custom Pre-Engineered Structural Steel Columns & Beam Rafters (Grade S355JR)',
        'custom-structural-steel-columns-rafters-s355jr',
        'Custom fabricated welded H-section and built-up steel structural members for industrial warehouses, airplane hangars, and high-clearance manufacturing plants.',
        'assisted_quote',
        0.00,
        'ETB',
        'ton',
        5,
        '{
            "steel_grade": "EN 10025 S355JR / ASTM A572 Grade 50",
            "section_profiles": "Welded H-Beam, Tapered Rafters, Crane Columns",
            "surface_preparation": "Shot Blasting to SA 2.5 + Epoxy Zinc-Rich Primer (80μm)",
            "connection_type": "High-Strength Friction Grip (HSFG) Grade 8.8 / 10.9 Bolts",
            "fabrication_standard": "AWS D1.1 Structural Welding Code"
        }'::jsonb,
        TRUE,
        TRUE
    ),
    -- Stream B Product 3: Bulk Cryogenic Liquid Oxygen
    (
        'f7777777-7777-7777-7777-777777777777',
        '44444444-4444-4444-4444-444444444444',
        'c5555555-5555-5555-5555-555555555555',
        'AMG-GAS-O2-BULK',
        'High-Purity Industrial & Medical Cryogenic Liquid Oxygen (LOX)',
        'cryogenic-liquid-oxygen-bulk',
        'Cryogenic liquid oxygen supplied via dedicated vacuum-insulated tanker delivery or manifolded 50-Litre 200-bar high-pressure cylinder banks.',
        'assisted_quote',
        0.00,
        'ETB',
        'cylinder_bank',
        1,
        '{
            "purity": "≥ 99.6% Medical & High-Purity Industrial",
            "phase": "Cryogenic Liquid (-183°C) or Compressed Gas (200 Bar)",
            "supply_format": "16-Cylinder Pallet Manifold or MicroBulk Cryo-Tank",
            "certification": "Ethiopian FDA Medical Gas & ISO 14175 Standard"
        }'::jsonb,
        FALSE,
        TRUE
    )
ON CONFLICT (sku) DO NOTHING;

-- 6. SEED PRODUCT INVENTORY (BRANCH LEVEL ALLOCATION)
INSERT INTO product_inventory (product_id, branch_id, quantity_on_hand, quantity_reserved, safety_stock_threshold)
VALUES
    -- Ethio Roofing at Addis Hub
    ('f1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 1450, 80, 100),
    -- Ethio Roofing at Adama Hub
    ('f1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 3200, 150, 200),
    -- 16mm Rebar at Adama Steel Mill Hub
    ('f2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 2800, 320, 250),
    -- Coffee at Addis Central Hub
    ('f3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 850, 25, 50),
    -- HD-40 Lubricant at Dire Dawa Logistics Terminal
    ('f4444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 420, 40, 30)
ON CONFLICT (product_id, branch_id) DO NOTHING;

-- 7. SEED ACTIVE QUOTE INQUIRY (STREAM B RFQ PIPELINE)
INSERT INTO quotes (
    id, quote_number, customer_id, subsidiary_id, assigned_agent_id,
    status, project_title, delivery_destination, target_delivery_date,
    estimated_total_etb, final_quoted_total_etb, customer_requirements, agent_quotation_notes
) VALUES (
    'b1111111-1111-1111-1111-111111111111',
    'RFQ-2026-AMG-0089',
    'e4444444-4444-4444-4444-444444444444', -- MIDROC Procurement Mgr
    '11111111-1111-1111-1111-111111111111', -- Heavy Steel Division
    'e3333333-3333-3333-3333-333333333333', -- Solomon Bekele (Sales Agent)
    'draft_quote_issued',
    'MIDROC Agro-Industrial Warehouse Steel Framework (Bishoftu)',
    'Bishoftu Industrial Zone Plot 12, Oromia',
    '2026-11-20',
    12500000.00,
    11850000.00,
    'Client requires complete structural PEB package for 3,600 sqm warehouse, including 32 heavy welded columns (H500x300x12x20) and tapered rafters with double anti-corrosion primer coating.',
    'Reviewed engineering drawings. Applied 5.2% enterprise fleet procurement volume discount. Delivery scheduled in 3 tranches from Adama Steel Fabrication Plant.'
) ON CONFLICT (quote_number) DO NOTHING;

-- 8. SEED QUOTE MESSAGE THREAD
INSERT INTO quote_messages (id, quote_id, sender_id, message, created_at)
VALUES
    ('d1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'e4444444-4444-4444-4444-444444444444', 'Good afternoon Engineer Solomon. We have submitted structural engineering specifications for our Bishoftu facility. Could we please confirm lead times for the first batch of columns?', NOW() - INTERVAL '2 days'),
    ('d2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'e3333333-3333-3333-3333-333333333333', 'Greetings Almaz. Our Adama fabrication facility has reserved S355JR billet allocations. We have issued the draft quote with an expedited delivery timetable. Please review the matrix above.', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;
