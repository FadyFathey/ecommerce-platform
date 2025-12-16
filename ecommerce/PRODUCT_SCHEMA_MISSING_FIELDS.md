# Missing Product Fields for Production

## Current Schema
Your current `products` table has:
- ✅ id, name, slug, description
- ✅ price_cents, currency
- ✅ image_url, category_id
- ✅ created_at

## Missing Critical Fields

### 1. **Product Variants (Colors, Sizes, Stock)** ⚠️ HIGH PRIORITY
- **Colors**: Array or separate variants table
- **Sizes**: Array or separate variants table  
- **Stock/Inventory**: Per variant or total stock
- **SKU**: Unique identifier per variant
- **Status**: active/inactive/draft

**Note**: Your ProductForm has UI for these but they're not being saved!

### 2. **Pricing & Discounts** ⚠️ HIGH PRIORITY
- **original_price_cents**: For showing discounts
- **discount_percentage**: Calculated discount
- **on_sale**: Boolean flag
- **sale_start_date**: Optional
- **sale_end_date**: Optional

**Note**: Your form has `originalPrice` field but it's not being saved!

### 3. **Product Status & Visibility**
- **status**: 'active' | 'inactive' | 'draft' | 'archived'
- **is_featured**: Boolean for homepage
- **is_new**: Boolean for "New Arrivals"
- **published_at**: Timestamp

### 4. **Additional Images**
- **image_urls**: Array of multiple images (JSONB)
- **thumbnail_url**: Separate thumbnail
- **gallery_images**: Array for product detail page

### 5. **Product Details**
- **brand_id**: Foreign key to brands table
- **sku**: Stock Keeping Unit (unique identifier)
- **barcode**: EAN/UPC code
- **weight_grams**: For shipping calculations
- **dimensions**: JSONB {length, width, height, unit}

### 6. **SEO & Marketing**
- **meta_title**: SEO title
- **meta_description**: SEO description
- **tags**: Array of tags (JSONB or separate table)
- **short_description**: For cards (different from full description)

### 7. **Ratings & Reviews**
- **rating**: Average rating (0-5)
- **review_count**: Number of reviews
- **reviews**: Separate table recommended

### 8. **Inventory Management**
- **stock_quantity**: Total stock
- **low_stock_threshold**: Alert when stock is low
- **track_inventory**: Boolean
- **allow_backorders**: Boolean

### 9. **Additional Fields**
- **updated_at**: Timestamp (auto-update)
- **deleted_at**: Soft delete support
- **created_by**: User who created
- **updated_by**: User who last updated

## Recommended Database Schema

See `migrations/add-product-fields.sql` for the complete migration.

## Implementation Priority

### Phase 1 (Essential - Do First):
1. ✅ status
2. ✅ original_price_cents / discount
3. ✅ stock_quantity
4. ✅ sku
5. ✅ updated_at

### Phase 2 (Important):
6. ✅ Product variants table (colors, sizes)
7. ✅ Multiple images
8. ✅ brand_id
9. ✅ is_featured, is_new

### Phase 3 (Nice to Have):
10. ✅ SEO fields
11. ✅ Ratings/reviews
12. ✅ Weight/dimensions
13. ✅ Tags

