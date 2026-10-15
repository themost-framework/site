---
index: 140
title: "Primitive Types in Model Schemas"
summary: "Learn how @themost-framework primitive types such as Text, Number, Counter, Boolean, and Date describe the fields in a model."
category: "Schema Design"
readingTime: "4 min read"
---

# Primitive Types in Model Schemas

A model schema describes the shape of an entity. Every field has a `name` and a `type`, and the type tells `@themost-framework` what kind of value the field stores and how it should be handled.

Here is a small model with several common primitive types:

```json
{
  "name": "Product",
  "fields": [
    {
      "name": "id",
      "type": "Counter",
      "primary": true
    },
    {
      "name": "name",
      "type": "Text",
      "size": 120,
      "nullable": false
    },
    {
      "name": "price",
      "type": "Number",
      "nullable": false
    },
    {
      "name": "available",
      "type": "Boolean"
    }
  ]
}
```

## Text

`Text` stores a string value such as a product name, order number, description, or email address.

Use `size` when the field has a known maximum length. Use `nullable: false` when the model requires a value:

```json
{
  "name": "sku",
  "type": "Text",
  "size": 50,
  "nullable": false,
  "unique": true
}
```

The constraints stay with the model definition, so validation and storage mapping can use the same contract.

## Number

`Number` stores numeric values such as prices, quantities, ratings, or measurements:

```json
{
  "name": "quantity",
  "type": "Number",
  "nullable": false
}
```

Use a numeric type for values that will be calculated or compared. A price should not be stored as `Text`, because sorting the strings `"9.50"` and `"100.00"` would not have the same meaning as sorting numeric values.

For values that represent money, the schema can use the more specific `Currency` type. The type communicates the intention of the field to both the framework and the people reading the model.

## Counter

`Counter` is commonly used for an automatically generated identifier:

```json
{
  "name": "id",
  "type": "Counter",
  "primary": true
}
```

A counter is useful when the storage provider should assign a new numeric key as records are created. Application code can create a new entity without inventing an identifier first.

A primary counter identifies the record. It is different from a business number such as an order number, which may have its own formatting, visibility, and generation rules.

## Integer

`Integer` describes a whole number without a fractional part. It is useful for counts, flags represented as numbers, or references that are intentionally numeric:

```json
{
  "name": "sortOrder",
  "type": "Integer"
}
```

Choose `Integer` when fractions do not make sense. Choose `Number` when a value may contain a decimal part or when the domain calls for general numeric behavior.

## Boolean

`Boolean` stores a true-or-false value:

```json
{
  "name": "enabled",
  "type": "Boolean",
  "nullable": false
}
```

Boolean fields are a good fit for switches such as `enabled`, `isGift`, or `isArchived`. If a field must always have a decision, make it non-nullable so the model does not have to interpret a missing value.

## Date and DateTime

Use `Date` or `DateTime` for temporal values. Typical examples include creation dates, order dates, due dates, and the moment an entity was last modified:

```json
{
  "name": "orderDate",
  "type": "DateTime"
}
```

A date-only field represents a calendar date. A date-time field represents a point in time and is appropriate when time and ordering matter. Keeping temporal values typed also lets queries compare them as dates instead of treating them as arbitrary strings.

## Primitive fields and model relationships

Not every field points to a primitive value. A field whose type is another model describes a relationship:

```json
{
  "name": "customer",
  "type": "Person"
}
```

`customer` is not a string containing a person name. It connects `Order` to the `Person` model. The distinction matters because related models can have their own fields, rules, and relationships.

A quick way to recognize the difference is:

- `Text`, `Number`, `Integer`, `Boolean`, `Date`, and `DateTime` describe values.
- `Counter` commonly describes a generated identity value.
- `Currency` describes a monetary value.
- A type such as `Person`, `Product`, or `OrderStatusType` describes a related model or domain type.

## Start with the domain value

When adding a field, choose the type that best describes the business meaning first. Then add constraints such as `nullable`, `size`, `unique`, `primary`, or a calculated `value` where the model needs them.

A clear schema gives the framework a shared contract for storage, validation, querying, and API metadata. Small type choices such as `Text` versus `Number` become valuable because they keep the model honest as the application grows.
