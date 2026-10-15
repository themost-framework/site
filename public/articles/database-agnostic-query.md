---
index: 6
title: "A Database-Agnostic Query with @themost/query"
summary: "Build readable queries with JavaScript expressions and let @themost/query translate them for different database engines."
category: "Querying"
readingTime: "5 min read"
---

# A Database-Agnostic Query with @themost/query

`@themost/query` is the database-agnostic query module behind `@themost/data`. It lets application code describe filtering, selection, sorting, joins, and paging without writing a database-specific SQL string for every operation.

The package separates two jobs:

1. Build a query expression that describes what data is needed.
2. Let a formatter or data adapter translate and execute that expression for the configured database.

That separation is what makes the same query useful with SQLite, PostgreSQL, MySQL, SQL Server, Oracle, and other supported adapters.

## Install the query module

```bash
npm install @themost/query
```

Most application code reaches `@themost/query` through `@themost/data`, but the query package can also be used directly when building adapter-level tools or reusable query definitions.

## Build a simple query

A `QueryExpression` can select fields, identify its source entity, sort the result, and limit the number of rows:

```javascript
import { QueryExpression, SqlFormatter } from '@themost/query'

const query = new QueryExpression()
  .select('id', 'name', 'category', 'price')
  .from('ProductData')
  .orderBy('name')
  .take(25)

const sql = new SqlFormatter().format(query)
```

The expression describes the operation. `SqlFormatter` turns it into SQL for inspection or for use by a compatible adapter. The application does not need to concatenate column names and values into a SQL string by hand.

## Filter with a field expression

The fluent API supports comparison methods such as `equal`, `greaterThan`, `lowerThan`, `in`, and their related operators:

```javascript
const query = new QueryExpression()
  .select('id', 'name', 'price')
  .from('ProductData')
  .where('category').equal('Laptops')
  .and('price').greaterThan(500)
  .orderByDescending('price')
  .take(10)
```

The query expresses a business condition: find laptop products that cost more than 500 and return the most expensive ten first. The adapter is responsible for producing the syntax required by its database engine.

## Use JavaScript closures

One of the distinctive features of `@themost/query` is its closure-to-query support. Instead of writing every condition through string methods, you can describe it with a JavaScript expression:

```javascript
import { QueryEntity, QueryExpression, SqlFormatter } from '@themost/query'

const products = new QueryEntity('ProductData')
const query = new QueryExpression()
  .select((product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
  }))
  .from(products)
  .where((product) => product.price > 500 && product.price <= 1000)
  .orderBy((product) => product.price)
  .take(10)

const sql = new SqlFormatter().format(query)
```

The closure is not executed against an in-memory array. The query parser reads the expression and produces an equivalent query expression, which can then be formatted for the target data provider. This gives developers a familiar JavaScript style while keeping execution in the database.

## Select from a named entity

`QueryEntity` represents the source entity in a query and can provide an alias:

```javascript
const orders = new QueryEntity('OrderData').as('orders')
const products = new QueryEntity('ProductData').as('orderedItem')

const query = new QueryExpression()
  .select((order) => ({
    id: order.id,
    orderDate: order.orderDate,
    product: order.orderedItem.name,
  }))
  .from(orders)
```

Aliases make joined and relational queries easier to read. They also keep generated names unambiguous when two entities contain fields with the same name.

## Join related entities

A join combines rows from related entities. `@themost/query` supports inner joins as well as left and right joins:

```javascript
const orders = new QueryEntity('OrderData').as('orders')
const products = new QueryEntity('ProductData').as('orderedItem')

const query = new QueryExpression()
  .select((order) => ({
    id: order.id,
    orderDate: order.orderDate,
    productName: order.orderedItem.name,
  }))
  .from(orders)
  .join(products)
  .with((order, product) => order.orderedItem === product.id)
  .where((order) => order.orderedItem.category === 'Laptops')
```

The join condition describes how the order and product are related. A database adapter can translate the expression into its own SQL dialect while preserving the relationship and filter.

## Page and sort results

Use `take` and `skip` to create a page of results:

```javascript
const query = new QueryExpression()
  .select('id', 'name', 'price')
  .from('ProductData')
  .orderBy('name')
  .take(25)
  .skip(25)
```

This requests the second page when each page contains 25 records. Always pair paging with a stable order when the result is shown to a user. Without ordering, the database is free to return rows in an order that may change between requests.

## Aggregate and group

The query language also supports aggregate functions such as `count`, `sum`, `avg`, `min`, and `max`:

```javascript
import { QueryEntity, QueryExpression, SqlFormatter, count } from '@themost/query'

const products = new QueryEntity('ProductData')
const query = new QueryExpression()
  .select((product) => ({
    category: product.category,
    total: count(product.id),
  }))
  .from(products)
  .groupBy((product) => product.category)

const sql = new SqlFormatter().format(query)
```

The result is a summary by category rather than one row for every product. Because the aggregation is part of the query expression, the database can perform the counting instead of the application loading every row first.

## Query is not execution

`@themost/query` builds and formats expressions. It does not need to own the application connection. A data adapter can execute the resulting expression:

```javascript
const results = await db.executeAsync(query)
```

In a model-driven application, `@themost/data` normally creates these query expressions for you when you call methods such as `context.model('Product').where(...)`. Understanding `@themost/query` helps explain what happens underneath that fluent model API.

## Why database agnostic matters

A database-agnostic query is not a promise that every database has identical capabilities. It is a stable application vocabulary for common operations, with the provider-specific translation kept at the edge.

That gives teams a few practical benefits:

- Model and service code is less tied to one vendor's SQL dialect.
- Query intent is easier to read and test.
- Parameters can be handled by the query system instead of string concatenation.
- Adapters can optimize or format the same expression for different engines.
- `@themost/data` can build model queries on top of a shared query language.

Start with `select`, `from`, `where`, `orderBy`, `take`, and `skip`. Add joins and aggregates when the domain needs them. The main habit is to describe the data operation as an expression and let the configured adapter handle the database-specific execution.

For more examples, explore the [`@themost/query` repository](https://github.com/themost-framework/query) and the [query module README](https://github.com/themost-framework/query#usage).
