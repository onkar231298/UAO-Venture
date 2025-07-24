-- Sample data for BFI Organic B2B Platform
-- Clean slate first
TRUNCATE products CASCADE;
TRUNCATE categories CASCADE;

-- Categories
INSERT INTO categories (name, slug, description, parent_id, is_active) VALUES
('Spices & Seasonings', 'spices-seasonings', 'Premium organic spices and seasonings from around the world', NULL, true),
('Herbs & Botanicals', 'herbs-botanicals', 'Medicinal and culinary herbs with certified organic quality', NULL, true),
('Essential Oils', 'essential-oils', 'Pure essential oils extracted using sustainable methods', NULL, true),
('Extracts & Powders', 'extracts-powders', 'Concentrated extracts and fine powders for various applications', NULL, true),
('Seeds & Grains', 'seeds-grains', 'Organic seeds and grains for health and nutrition', NULL, true);

-- Products (simplified without problematic fields)
INSERT INTO products (product_id, name, slug, description, botanical_name, plant_part, origin, form, is_organic, is_active, certifications, images) VALUES
('BFI001', 'Organic Turmeric Powder', 'organic-turmeric-powder', 'Premium organic turmeric powder with high curcumin content, sourced directly from certified organic farms in India.', 'Curcuma longa', 'Rhizome', 'India', 'Powder', true, true, '["USDA Organic", "India Organic", "ISO 9001"]', '["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"]'),

('BFI002', 'Organic Black Pepper Powder', 'organic-black-pepper-powder', 'Premium organic black pepper powder with intense flavor and aroma, perfect for culinary and pharmaceutical applications.', 'Piper nigrum', 'Fruit', 'Kerala, India', 'Powder', true, true, '["USDA Organic", "Fair Trade", "Rainforest Alliance"]', '["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"]'),

('BFI003', 'Organic Ashwagandha Root Powder', 'organic-ashwagandha-root-powder', 'High-quality organic ashwagandha root powder, traditionally used in Ayurvedic medicine for stress relief and vitality.', 'Withania somnifera', 'Root', 'Rajasthan, India', 'Powder', true, true, '["USDA Organic", "India Organic", "GMP"]', '["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"]'),

('BFI004', 'Organic Lavender Essential Oil', 'organic-lavender-essential-oil', 'Pure organic lavender essential oil with therapeutic grade quality, extracted through steam distillation from certified organic farms.', 'Lavandula angustifolia', 'Flowers', 'Bulgaria', 'Oil', true, true, '["USDA Organic", "EU Organic", "Ecocert"]', '["https://images.unsplash.com/photo-1611909023032-2d6b3134ecba?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"]'),

('BFI005', 'Organic Moringa Leaf Powder', 'organic-moringa-leaf-powder', 'Nutrient-rich organic moringa leaf powder, packed with vitamins, minerals, and antioxidants for health supplements.', 'Moringa oleifera', 'Leaves', 'India', 'Powder', true, true, '["USDA Organic", "India Organic", "HACCP"]', '["https://images.unsplash.com/photo-1505976378723-9726b54e9bb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"]'),

('BFI006', 'Organic Ginger Powder', 'organic-ginger-powder', 'Premium organic ginger powder with strong pungent flavor, ideal for food, beverage, and pharmaceutical industries.', 'Zingiber officinale', 'Rhizome', 'India', 'Powder', true, true, '["USDA Organic", "JAS Organic", "ISO 22000"]', '["https://images.unsplash.com/photo-1615485290382-441e4d049cb5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600"]');