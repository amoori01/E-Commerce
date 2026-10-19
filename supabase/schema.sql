-- ====================================================================
-- AMG HOLDINGS ENTERPRISE E-COMMERCE & RFQ PLATFORM
-- DATABASE SCHEMA DDL (SUPABASE / POSTGRESQL 15+)
-- Compliant with ISO/IEC/IEEE 29148, OWASP ASVS v4.0, PCI-DSS v4.0
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- 1. ENUMS & DOMAINS
-- --------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'customer',
        'sales_agent',
        'branch_admin',
        'super_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE transaction_stream_type AS ENUM (
        'direct_checkout',   -- Stream A: Instant digital self-service
        'assisted_quote'     -- Stream B: Agent-assisted engineering RFQ
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status_type AS ENUM (
        'cart_created',
        'checkout_initiated',
        'payment_pending',
        'payment_verified',
        'fulfillment_processing',
        'ready_for_pickup',
        'shipped',
        'completed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE quote_status_type AS ENUM (
        'inquiry_submitted',
        'assigned_to_agent',
        'draft_quote_issued',
        'customer_review',
        'quote_approved',
        'payment_processing',
        'fulfilled',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_gateway_type AS ENUM (
        'telebirr',
        'chapa',
        'cbe_birr',
        'bank_transfer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_type AS ENUM (
        'pending',
        'verified',
        'failed',
        'refunded'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- --------------------------------------------------------------------
-- 2. SUBSIDIARIES & BRANCHES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subsidiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'AMG_STEEL', 'AMG_ROOFING', 'AMG_TRANSPORT', 'AMG_GAS', 'AMG_COFFEE'
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    is_hub BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 3. USERS & PROFILES (RBAC & ABAC)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID, -- References auth.users(id) in Supabase Auth
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'customer',
    subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE SET NULL, -- Restricted scope for agents/branch admins
    branch_id UUID REFERENCES branches(id) ON DELETE SET NULL, -- Assigned branch
    company_name VARCHAR(255), -- For B2B corporate buyers
    tin_number VARCHAR(50), -- Ethiopian Taxpayer Identification Number
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 4. CATEGORIES & PRODUCTS (DUAL-TIER CLASSIFICATION)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subsidiary_id UUID REFERENCES subsidiaries(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subsidiary_id UUID NOT NULL REFERENCES subsidiaries(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    transaction_stream transaction_stream_type NOT NULL DEFAULT 'direct_checkout',
    unit_price_etb NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'ETB',
    unit_measurement VARCHAR(50) NOT NULL DEFAULT 'pcs', -- 'pcs', 'meter', 'ton', 'drum', 'kg'
    moq INT NOT NULL DEFAULT 1, -- Minimum Order Quantity
    technical_specs JSONB DEFAULT '{}'::jsonb, -- Grainger-style technical attributes (grade, ASTM, gauge, etc.)
    datasheet_url TEXT,
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 5. BRANCH INVENTORY MANAGEMENT
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_reserved INT NOT NULL DEFAULT 0,
    safety_stock_threshold INT NOT NULL DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_product_branch UNIQUE (product_id, branch_id)
);

-- --------------------------------------------------------------------
-- 6. STREAM A: DIRECT SELF-SERVICE ORDERS
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    fulfillment_branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
    status order_status_type NOT NULL DEFAULT 'checkout_initiated',
    delivery_type VARCHAR(50) NOT NULL DEFAULT 'branch_pickup', -- 'branch_pickup' or 'freight_delivery'
    delivery_address TEXT,
    subtotal_etb NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_etb NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- 15% Ethiopian VAT
    total_amount_etb NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method payment_gateway_type,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL,
    unit_price_etb NUMERIC(15, 2) NOT NULL,
    total_price_etb NUMERIC(15, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 7. STREAM B: AGENT-ASSISTED CUSTOM QUOTES (RFQ)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    subsidiary_id UUID NOT NULL REFERENCES subsidiaries(id) ON DELETE RESTRICT,
    assigned_agent_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    status quote_status_type NOT NULL DEFAULT 'inquiry_submitted',
    project_title VARCHAR(255) NOT NULL,
    delivery_destination TEXT NOT NULL,
    target_delivery_date DATE,
    estimated_total_etb NUMERIC(15, 2),
    final_quoted_total_etb NUMERIC(15, 2),
    quote_valid_until TIMESTAMPTZ,
    customer_requirements TEXT,
    agent_quotation_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    custom_product_name VARCHAR(255),
    requested_specs JSONB DEFAULT '{}'::jsonb,
    quantity INT NOT NULL DEFAULT 1,
    unit_measurement VARCHAR(50) NOT NULL DEFAULT 'unit',
    quoted_unit_price_etb NUMERIC(15, 2),
    quoted_total_price_etb NUMERIC(15, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 8. PAYMENTS & LOCALIZED GATEWAY AUDIT
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
    gateway payment_gateway_type NOT NULL,
    transaction_reference VARCHAR(150) UNIQUE NOT NULL,
    idempotency_key VARCHAR(150) UNIQUE NOT NULL,
    amount_etb NUMERIC(15, 2) NOT NULL,
    status payment_status_type NOT NULL DEFAULT 'pending',
    gateway_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- --------------------------------------------------------------------
-- 9. PERFORMANCE INDEXES
-- --------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_products_subsidiary ON products(subsidiary_id);
CREATE INDEX IF NOT EXISTS idx_products_stream ON products(transaction_stream);
CREATE INDEX IF NOT EXISTS idx_inventory_lookup ON product_inventory(product_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_agent ON quotes(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(transaction_reference);

-- --------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------------------
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_inventory ENABLE ROW LEVEL SECURITY;

-- Products & Categories are publicly readable
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view subsidiaries" ON subsidiaries
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Public can view branches" ON branches
    FOR SELECT USING (is_active = TRUE);

-- --------------------------------------------------------------------
-- 11. STATE MACHINE AUDIT HISTORY (SRS 4.3)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status order_status_type NOT NULL,
    to_status order_status_type NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quote_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    from_status quote_status_type NOT NULL,
    to_status quote_status_type NOT NULL,
    changed_by VARCHAR(255) NOT NULL,
    version INT DEFAULT 1,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 12. ENTERPRISE ERP SYNC & DEAD-LETTER QUEUE (SRS 4.5)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS erp_sync_messages (
    id VARCHAR(100) PRIMARY KEY,
    event VARCHAR(100) NOT NULL, -- 'ORDER_SYNC', 'INVENTORY_RECONCILE', 'PHYSICAL_POS_SALE'
    entity_id VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'FAILED_RETRYING', 'DEAD_LETTER'
    retry_count INT NOT NULL DEFAULT 0,
    max_retries INT NOT NULL DEFAULT 3,
    error_message TEXT,
    last_attempt_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS erp_dlq_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_message_id VARCHAR(100) REFERENCES erp_sync_messages(id) ON DELETE CASCADE,
    failure_reason TEXT NOT NULL,
    stack_trace TEXT,
    payload_snapshot JSONB NOT NULL,
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------------------------------
-- 13. SERVER-PERSISTED CART PER USER (SRS 4.1 & R6.3)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    coupon_code VARCHAR(50),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_cart UNIQUE (user_id)
);

