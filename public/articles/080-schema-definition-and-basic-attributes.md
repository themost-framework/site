---
title: "Schema Definition and Basic Attributes"
summary: "Declare models with schema metadata that defines storage mapping, constraints, and field behavior."
category: "Schema Design"
readingTime: "5 min read"
---

# Schema Definition and Basic Attributes

Model properties in `@themost/data` are declared using JSON-based schema configuration. These files define storage source locations, field types, sizes, indexing options, and required constraints.

```json
{
  "name": "Product",
  "id": 101,
  "source": "Products",
  "view": "ProductsView",
  "fields": [
    {
      "name": "id",
      "type": "Counter",
      "primary": true
    },
    {
      "name": "sku",
      "type": "Text",
      "size": 50,
      "nullable": false,
      "unique": true
    },
    {
      "name": "price",
      "type": "Currency",
      "nullable": false
    }
  ]
}
```

## Why schema metadata matters

Schemas make the storage contract visible and maintainable. They give the framework a consistent description of the domain while allowing different backends to implement that contract in their own way.
