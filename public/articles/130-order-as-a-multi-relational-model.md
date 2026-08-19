---
title: "Order as a Multi-Relational Model"
summary: "Use the Order schema from @themost/test to understand how one business object can connect customers, offers, products, payments, status, and access rules."
category: "Data Modelling"
readingTime: "7 min read"
---

# Order as a Multi-Relational Model

An order looks simple in a user interface, but it represents a network of business facts. Someone placed it, a merchant accepted it, a product was ordered, an offer may have determined its price, payment is due, delivery has a status, and the customer should only see the orders they are allowed to access.

The `Order` schema in [`@themost/test`](https://github.com/themost-framework/test/blob/master/modules/test/server/config/models/Order.json) is a useful example of this kind of multi-relational model. It shows how `@themost-framework` can keep the business meaning visible while the database remains an implementation detail.

## The order is the centre of a graph

The schema starts with an identifier and transaction details, then connects the order to other models through typed fields:

```json
{
  "name": "Order",
  "fields": [
    { "name": "customer", "type": "Person" },
    { "name": "merchant", "type": "Party" },
    { "name": "acceptedOffer", "type": "Offer" },
    { "name": "orderedItem", "type": "Product" },
    { "name": "orderStatus", "type": "OrderStatusType" },
    { "name": "billingAddress", "type": "PostalAddress" },
    { "name": "paymentMethod", "type": "PaymentMethod" }
  ]
}
```

Each relationship answers a different business question:

- `customer` identifies the person who placed the order.
- `merchant` identifies the party taking the order.
- `acceptedOffer` records the commercial offer that was accepted.
- `orderedItem` identifies the product being purchased.
- `orderStatus` describes the current point in the order lifecycle.
- `billingAddress` and `paymentMethod` describe how the transaction is settled.

These are not interchangeable references. Keeping them as separate typed properties prevents an application from collapsing different meanings into a generic `relatedId` or a collection of opaque foreign keys.

## Follow relationships to their own models

The graph continues beyond the immediate fields. `Offer` inherits from `Intangible` and includes its own relationships to a `Person` seller, an `Organization` or person offering it, and the `Product` being offered:

```json
{
  "name": "Offer",
  "inherits": "Intangible",
  "fields": [
    { "name": "price", "type": "Number" },
    { "name": "validFrom", "type": "DateTime" },
    { "name": "validThrough", "type": "DateTime" },
    { "name": "seller", "type": "Person" },
    { "name": "offeredBy", "type": "Organization" },
    { "name": "itemOffered", "type": "Product" }
  ]
}
```

That means an order can preserve more than a product reference. It can preserve the accepted commercial context: which offer was selected, its price, when it was valid, who supplied it, and which product it described.

This distinction matters when prices, promotions, or sellers change later. A query for the current product should not be confused with the offer that was accepted when the order was placed.

## Model both directions when navigation matters

The `Person` schema contains an `orders` field with an association mapping back to `Order.customer`:

```json
{
  "name": "orders",
  "type": "Order",
  "mapping": {
    "associationType": "association",
    "childModel": "Order",
    "childField": "customer",
    "parentModel": "Person",
    "parentField": "id"
  }
}
```

This is the two-sided view of the same relationship. From an order, the application can navigate to its `customer`. From a person, it can navigate to their `orders`. The mapping tells the framework how those two model properties correspond without requiring every caller to write the join manually.

A useful rule is to expose both directions only when the application has a real use for both. Customer history needs `Person.orders`; checkout and authorization need `Order.customer`. A relationship should support a workflow, not merely mirror every database link.

## Keep lifecycle state as a model

`orderStatus` is typed as `OrderStatusType` rather than stored as an unexplained number. The schema provides a default status object with the alternate name `OrderProcessing`, while the status model can represent other lifecycle states such as delivered or returned.

That makes status usable at the domain boundary:

```js
const latestOrders = await context.model('Order')
  .where('orderStatus').equal('OrderProcessing')
  .orderByDescending('orderDate')
  .getItems()
```

The important idea is not the exact query syntax. It is that the application can talk about order states by model vocabulary instead of spreading magic values through controllers and views.

## Turn common relationships into views

The `Order` schema defines two named views:

```json
"views": [
  {
    "name": "delivered",
    "title": "Delivered Orders",
    "filter": "orderStatus eq 1",
    "order": "dateCreated desc"
  },
  {
    "name": "latest",
    "title": "Latest Orders",
    "filter": "orderDate gt lastMonth()",
    "order": "dateCreated desc"
  }
]
```

A view gives a repeated business query a stable name. The application can ask for the latest orders without duplicating its date filter and sort order in every endpoint. If the definition of “latest” changes, the model configuration is the natural place to update it.

Views are especially valuable for multi-relational models because they provide a safe starting point for common workflows. A delivered-orders view can later be expanded with related customer or product data without changing the meaning of the view itself.

## Access rules belong near the model

The schema also describes privileges. Global access is granted to configured accounts, while the self-level rule limits a user to orders where `customer/user eq me()`.

```json
{
  "mask": 1,
  "type": "self",
  "filter": "customer/user eq me()"
}
```

This is an important modelling boundary. The `Order` model knows what it means for an order to belong to a customer, so the access rule can follow the same relationship used by the rest of the application. Authorization does not need to reconstruct ownership through unrelated request parameters.

## Query the graph deliberately

A client can select order fields through the OData API and expand related models when it needs their details. For example, an order summary might request the order number, date, customer, product, and status while leaving payment details out of the response.

```text
/api/Orders?$select=orderNumber,orderDate,customer,orderedItem,orderStatus
```

The model makes the graph available; the query decides how much of it to retrieve. That keeps responses focused and avoids loading every relationship for every screen.

Start the learning server with:

```bash
npx @themost/test
```

Then inspect the generated schema at `/api/docs` or `/api/$metadata`. The documentation reveals the entity types and their attributes, while the metadata endpoint provides the machine-readable contract that clients can use.

## A model, not a table

The `Order` schema demonstrates the central promise of model-first design. An order is not just a row with a status column. It is a relationship between a customer, merchant, offer, product, address, payment method, and lifecycle state, with reusable views and access rules attached to the same business definition.

By describing that graph in the model layer, `@themost-framework` gives application code a durable vocabulary. Storage adapters, API routes, and clients can evolve around the model without each one inventing a different interpretation of what an order means.
