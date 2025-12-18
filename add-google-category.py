#!/usr/bin/env python3
"""
Script to add <g:google_product_category> tags to product XML
Maps product categories to Google Product Category IDs
"""

import re
import sys

# Mapping of Portuguese categories to Google Product Category IDs
# Based on Google's taxonomy: https://support.google.com/merchants/answer/6324436
CATEGORY_MAPPING = {
    # Alimentos & Bebidas (Food & Beverages) - ID 422
    'Alimentos': '422',
    'Bebidas': '422',

    # Temperos e Condimentos - ID 2660 (Seasonings & Spices)
    'Temperos e Condimentos': '2660',
    'Temperos': '2660',

    # Higiene e Beleza - ID 469 (Health & Beauty)
    'Higiene e Beleza': '469',
    'Higiene Oral': '526',  # Oral Care
    'Creme Dental': '526',

    # Limpeza - ID 623 (Home & Garden > Household Supplies)
    'Limpeza': '623',
    'Inseticida': '2901',  # Pest Control

    # Snacks - ID 5811
    'Guloseima, Salgado e Chocolate': '5811',
    'Salgadinho': '5811',
    'Chocolate': '5811',

    # Doces - ID 422
    'Doces e Geleias': '422',
    'Doces': '422',

    # Utilidades para o Lar - ID 536 (Home & Garden)
    'Utilidades para o Lar': '536',
    'Cozinha': '649',  # Kitchen & Dining

    # Bebidas Alcoolicas - ID 499
    'Bebidas Alcoolicas': '499',
    'Cervejas': '499',
    'Vinhos': '499',
    'Destilados': '499',

    # Refrigerantes - ID 1868
    'Refrigerantes': '1868',
    'Águas': '1868',
    'Sucos': '1868',

    # Laticínios - ID 4306
    'Laticínios': '4306',
    'Queijos': '4306',
    'Iogurtes': '4306',
    'Leite': '4306',

    # Carnes - ID 2660
    'Açougue': '2660',
    'Frios e Fatiados': '2660',
    'Pescados': '2660',

    # Padaria - ID 5750
    'Padaria e Confeitaria': '5750',
    'Pães': '5750',

    # Produtos de Limpeza - ID 623
    'Produtos de Limpeza': '623',
    'Limpeza Geral': '623',

    # Bebês - ID 537
    'Bebê': '537',
    'Fraldas': '537',
    'Mamadeiras': '537',

    # Pet Shop - ID 5
    'Pet Shop': '5',
    'Alimentos para Pets': '5',

    # Default category for Food
    'default': '422'
}

def get_google_category_id(product_type):
    """
    Get Google Product Category ID based on product_type
    Returns the most specific category match or default
    """
    if not product_type or product_type.strip() == '':
        return '422'  # Default: Food & Beverages

    # Clean the product_type (decode HTML entities)
    clean_type = product_type.replace('&gt;', '>').replace('&amp;', '&')

    # Split by '>' to get category hierarchy
    categories = [c.strip() for c in clean_type.split('>')]

    # Try to match from most specific to least specific
    for i in range(len(categories), 0, -1):
        category_key = categories[i-1]
        if category_key in CATEGORY_MAPPING:
            return CATEGORY_MAPPING[category_key]

    # Return default if no match found
    return CATEGORY_MAPPING['default']

def process_xml(input_file, output_file):
    """
    Process XML file and add google_product_category tags
    """
    print(f"Reading {input_file}...")

    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Pattern to match each <item>...</item> block
    item_pattern = r'(<item>.*?</item>)'

    def process_item(match):
        item_xml = match.group(0)

        # Extract product_type
        type_match = re.search(r'<g:product_type>(.*?)</g:product_type>', item_xml)

        if type_match:
            product_type = type_match.group(1)
            category_id = get_google_category_id(product_type)

            # Find position to insert (after product_type)
            insertion_point = type_match.end()

            # Create the new tag
            new_tag = f'\n<g:google_product_category>{category_id}</g:google_product_category>'

            # Insert the new tag
            item_xml = item_xml[:insertion_point] + new_tag + item_xml[insertion_point:]
        else:
            # If no product_type, add default category after g:id
            id_match = re.search(r'(<g:id>.*?</g:id>)', item_xml)
            if id_match:
                insertion_point = id_match.end()
                new_tag = f'\n<g:google_product_category>422</g:google_product_category>'
                item_xml = item_xml[:insertion_point] + new_tag + item_xml[insertion_point:]

        return item_xml

    # Process all items
    print("Processing items...")
    new_content = re.sub(item_pattern, process_item, content, flags=re.DOTALL)

    # Write output
    print(f"Writing to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(new_content)

    # Count items processed
    item_count = len(re.findall(r'<item>', new_content))
    print(f"✓ Processed {item_count} items")
    print(f"✓ File saved: {output_file}")

if __name__ == '__main__':
    input_file = '/Users/al3jandro/project/pideai/app/products-314-1433.xml'
    output_file = '/Users/al3jandro/project/pideai/app/products-314-1433-updated.xml'

    try:
        process_xml(input_file, output_file)
        print("\n✅ Done! Google product category tags added successfully.")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
