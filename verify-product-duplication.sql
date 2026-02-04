-- Query de Verificación de Duplicación de Productos
-- Este script verifica si el producto ed5bc88e-c0fa-42ae-a028-aba927c40292 está duplicado
-- y muestra información sobre su estado en la base de datos

-- Parte 1: Verificar si el producto existe múltiples veces (duplicados exactos)
SELECT
  id,
  name,
  is_featured,
  is_available,
  store_id,
  category_id,
  price,
  created_at,
  COUNT(*) OVER (PARTITION BY id) as duplicate_count
FROM menu_items
WHERE id = 'ed5bc88e-c0fa-42ae-a028-aba927c40292';

-- Parte 2: Ver todos los productos de la misma tienda (para contexto)
SELECT
  id,
  name,
  is_featured,
  is_available,
  store_id,
  category_id,
  display_order
FROM menu_items
WHERE store_id = (
  SELECT store_id
  FROM menu_items
  WHERE id = 'ed5bc88e-c0fa-42ae-a028-aba927c40292'
)
ORDER BY display_order, name;

-- Parte 3: Contar productos duplicados por ID en toda la tienda
SELECT
  id,
  name,
  COUNT(*) as occurrence_count
FROM menu_items
WHERE store_id = (
  SELECT store_id
  FROM menu_items
  WHERE id = 'ed5bc88e-c0fa-42ae-a028-aba927c40292'
)
GROUP BY id, name
HAVING COUNT(*) > 1;

-- Parte 4: Verificar productos destacados en la tienda
SELECT
  COUNT(*) as total_featured_products,
  store_id
FROM menu_items
WHERE store_id = (
  SELECT store_id
  FROM menu_items
  WHERE id = 'ed5bc88e-c0fa-42ae-a028-aba927c40292'
)
AND is_featured = true
GROUP BY store_id;

-- INSTRUCCIONES DE USO:
-- 1. Ejecutar cada query por separado en el SQL Editor de Supabase
-- 2. La Parte 1 debe retornar SOLO 1 fila con duplicate_count = 1
-- 3. Si duplicate_count > 1, indica que hay filas duplicadas en la base de datos
-- 4. La Parte 2 muestra todos los productos de la tienda para contexto
-- 5. La Parte 3 detecta cualquier producto con múltiples filas (NO debería retornar nada)
-- 6. La Parte 4 muestra cuántos productos destacados hay en total
