# Mapeamento de Categorias Google Product Category

Este documento descreve o mapeamento das categorias de produtos para Google Product Category IDs usado no feed XML.

## Referência de IDs do Google

Baseado na taxonomia oficial do Google: https://support.google.com/merchants/answer/6324436

## Mapeamento Utilizado

| Categoria em Português | Google Category ID | Nome da Categoria Google |
|------------------------|-------------------|-------------------------|
| Alimentos (geral) | 422 | Food, Beverages & Tobacco |
| Temperos e Condimentos | 2660 | Seasonings & Spices |
| Higiene e Beleza | 469 | Health & Beauty |
| Higiene Oral / Creme Dental | 526 | Oral Care |
| Limpeza | 623 | Household Supplies |
| Inseticida | 2901 | Pest Control |
| Guloseimas, Salgados e Chocolates | 5811 | Snack Foods |
| Salgadinho | 5811 | Snack Foods |
| Chocolate | 5811 | Snack Foods |
| Doces e Geleias | 422 | Food, Beverages & Tobacco |
| Utilidades para o Lar | 536 | Home & Garden |
| Cozinha | 649 | Kitchen & Dining |
| Bebidas Alcoolicas | 499 | Alcoholic Beverages |
| Cervejas | 499 | Alcoholic Beverages |
| Vinhos | 499 | Alcoholic Beverages |
| Destilados | 499 | Alcoholic Beverages |
| Refrigerantes | 1868 | Non-Alcoholic Beverages |
| Águas | 1868 | Non-Alcoholic Beverages |
| Sucos | 1868 | Non-Alcoholic Beverages |
| Laticínios | 4306 | Dairy Products |
| Queijos | 4306 | Dairy Products |
| Iogurtes | 4306 | Dairy Products |
| Leite | 4306 | Dairy Products |
| Açougue | 2660 | Meat, Seafood & Eggs |
| Frios e Fatiados | 2660 | Meat, Seafood & Eggs |
| Pescados | 2660 | Meat, Seafood & Eggs |
| Padaria e Confeitaria | 5750 | Bakery |
| Pães | 5750 | Bakery |
| Produtos de Limpeza | 623 | Household Supplies |
| Bebê | 537 | Baby & Toddler |
| Fraldas | 537 | Baby & Toddler |
| Mamadeiras | 537 | Baby & Toddler |
| Pet Shop | 5 | Animals & Pet Supplies |
| Alimentos para Pets | 5 | Animals & Pet Supplies |
| **Padrão (sem categoria)** | 422 | Food, Beverages & Tobacco |

## Estatísticas do Processamento

- **Total de items processados**: 16.119
- **Total de categorias únicas**: 458
- **Arquivo original**: `products-314-1433.xml`
- **Arquivo atualizado**: `products-314-1433-updated.xml`

## Exemplos de Tags Adicionadas

### Exemplo 1: Temperos
```xml
<g:product_type>Alimentos &gt; Temperos e Condimentos &gt; Temperos</g:product_type>
<g:google_product_category>2660</g:google_product_category>
```

### Exemplo 2: Higiene Oral
```xml
<g:product_type>Higiene e Beleza &gt; Higiene Oral &gt; Creme Dental</g:product_type>
<g:google_product_category>526</g:google_product_category>
```

### Exemplo 3: Limpeza
```xml
<g:product_type>Limpeza &gt; Casa &gt; Inseticida</g:product_type>
<g:google_product_category>2901</g:google_product_category>
```

### Exemplo 4: Snacks
```xml
<g:product_type>Alimentos &gt; Guloseima, Salgado e Chocolate &gt; Salgadinho</g:product_type>
<g:google_product_category>5811</g:google_product_category>
```

## Lógica de Mapeamento

O script usa a seguinte lógica:

1. **Hierarquia de categorias**: Tenta mapear do mais específico para o mais genérico
2. **Fallback inteligente**: Se uma categoria específica não for encontrada, usa a categoria pai
3. **Categoria padrão**: Se nenhuma categoria corresponder, usa ID 422 (Food, Beverages & Tobacco)

## Como Usar

Para processar novos arquivos XML:

```bash
python3 add-google-category.py
```

O script automaticamente:
- Lê o arquivo `products-314-1433.xml`
- Adiciona as tags `<g:google_product_category>` com os IDs apropriados
- Salva o resultado em `products-314-1433-updated.xml`

## Notas Importantes

- As tags são inseridas logo após a tag `<g:product_type>`
- Se um item não tiver `<g:product_type>`, usa o ID padrão 422
- O mapeamento pode ser ajustado editando o dicionário `CATEGORY_MAPPING` no script Python
- A taxonomia completa do Google está disponível em: https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt

## Validação

Para validar o XML atualizado:

```bash
# Contar tags adicionadas
grep -c '<g:google_product_category>' products-314-1433-updated.xml

# Ver exemplos de categorias
grep '<g:google_product_category>' products-314-1433-updated.xml | sort | uniq -c
```
