#!/bin/bash

# =====================================================
# Setup Development Store "totus"
# =====================================================
# This script applies the development store migration
# and helps you configure the owner_id
# =====================================================

set -e  # Exit on error

echo "=================================================="
echo "  PideAI - Development Store Setup"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}ERROR: Supabase CLI not found${NC}"
    echo "Install it with: brew install supabase/tap/supabase"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20251130000000_insert_dev_store_totus.sql" ]; then
    echo -e "${RED}ERROR: Migration file not found${NC}"
    echo "Make sure you're in the project root directory"
    exit 1
fi

echo -e "${GREEN}✓ Migration file found${NC}"
echo ""

# Apply migrations
echo "Applying database migrations..."
echo ""

if supabase db push; then
    echo ""
    echo -e "${GREEN}✓ Migration applied successfully${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}ERROR: Failed to apply migration${NC}"
    echo "Check the error above and try again"
    exit 1
fi

# Ask if user wants to update owner_id
echo "=================================================="
echo "  Configure Store Owner"
echo "=================================================="
echo ""
echo "The development store 'totus' was created with a placeholder owner_id."
echo "To access admin features, you need to update the owner_id to your user UUID."
echo ""

read -p "Do you want to configure the store owner now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Getting your user ID from Supabase..."
    echo ""

    # Get user email
    read -p "Enter your Supabase Auth email: " user_email

    # Generate SQL to get user ID
    cat > /tmp/get_user_id.sql <<EOF
SELECT id, email FROM auth.users WHERE email = '$user_email';
EOF

    echo ""
    echo -e "${YELLOW}Running query to find your user...${NC}"
    echo ""

    # Note: This requires local Supabase setup or you need to run this manually
    echo "Run this SQL in your Supabase Dashboard SQL Editor:"
    echo ""
    echo -e "${YELLOW}SELECT id, email FROM auth.users WHERE email = '$user_email';${NC}"
    echo ""
    echo "Then copy your user ID and run:"
    echo ""
    echo -e "${YELLOW}UPDATE stores SET owner_id = 'YOUR-USER-UUID' WHERE subdomain = 'totus';${NC}"
    echo ""

    echo "Or if you have your user ID, enter it now:"
    read -p "User UUID (press Enter to skip): " user_uuid

    if [ ! -z "$user_uuid" ]; then
        # Generate SQL to update owner_id
        cat > /tmp/update_owner.sql <<EOF
UPDATE stores SET owner_id = '$user_uuid' WHERE subdomain = 'totus';
SELECT subdomain, name, owner_id FROM stores WHERE subdomain = 'totus';
EOF

        echo ""
        echo "Run this SQL in your Supabase Dashboard SQL Editor:"
        echo ""
        cat /tmp/update_owner.sql
        echo ""
    fi
fi

echo ""
echo "=================================================="
echo "  Setup Complete!"
echo "=================================================="
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo "1. Start your development server: npm run dev"
echo "2. Open http://localhost:8080"
echo "3. The 'totus' store should load automatically"
echo ""
echo -e "${YELLOW}To access admin features:${NC}"
echo "1. Create a user in Supabase Auth (if you haven't already)"
echo "2. Update the owner_id as shown above"
echo "3. Log in to the app with that user"
echo "4. Navigate to /admin"
echo ""
echo -e "${GREEN}Enjoy coding!${NC}"
echo ""
