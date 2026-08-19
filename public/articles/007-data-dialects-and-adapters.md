---
title: "Data Dialects and Database Adapters"
summary: "Understand how @themost-framework keeps model code portable while @themost/mysql, @themost/sqlite, @themost/pg, @themost/oracle, and other adapters handle database-specific behavior."
category: "Data Layer"
readingTime: "6 min read"
---

# Data Dialects and Database Adapters

A model-driven application should not need a different business layer for every database engine. `@themost-framework` keeps models and queries on a shared API, then delegates storage details to a database adapter.

This is the role of packages such as:

- `@themost/sqlite` for SQLite
- `@themost/mysql` for MySQL and MariaDB
- `@themost/pg` for PostgreSQL
- `@themost/oracle` for Oracle Database
- `@themost/mssql` for Microsoft SQL Server

Together with `@themost/query`, these adapters form a dialect boundary. The application describes a query once, and the selected adapter translates it into the syntax and execution behavior required by its database.

## The shared application layer

Application code uses `@themost/data` models and query methods instead of opening a provider-specific connection in every service:

```javascript
const products = await context
  .model('Product')
  .where('category').equal('Laptops')
  .where('price').greaterThan(500)
  .orderBy('name')
  .take(25)
  .getItems()
```

This query expresses domain intent. It does not mention SQLite placeholders, PostgreSQL casts, MySQL identifier rules, Oracle pagination syntax, or SQL Server's paging form. The active data adapter receives the resulting query expression and handles those details.

The model layer also keeps field types, relationships, constraints, privileges, and listeners consistent when the storage provider changes.

## Configure an adapter type

A data configuration registers the adapter implementation by a stable invariant name:

```json
{
  "adapterTypes": [
    {
      "name": "SQLite Data Adapter",
      "invariantName": "sqlite",
      "type": "@themost/sqlite#SqliteAdapter"
    }
  ]
}
```

The `type` identifies the package and exported adapter class. The `invariantName` is the configuration key used by an adapter definition. This lets the rest of the application refer to a provider consistently without importing its implementation into every model or controller.

## Select the active connection

An adapter definition provides the connection options and can be marked as the default:

```json
{
  "adapters": [
    {
      "name": "development",
      "invariantName": "sqlite",
      "default": true,
      "options": {
        "database": "./db/local.db"
      }
    }
  ]
}
```

The options depend on the provider. A SQLite adapter may need a database file path. A server database adapter commonly needs a host, port, database name, user, password, and pool settings.

For example, a PostgreSQL deployment might use a configuration shaped like this:

```json
{
  "adapters": [
    {
      "name": "production",
      "invariantName": "postgres",
      "default": true,
      "options": {
        "host": "db.example.com",
        "port": 5432,
        "database": "catalog",
        "user": "app_user"
      }
    }
  ]
}
```

Credentials should come from environment or secret configuration in a real deployment. They should not be committed to a model or source file.

## Provider packages and dialect details

Each adapter is responsible for the behavior that cannot be made identical across databases. This may include:

- Quoting identifiers and reserved words
- Parameter placeholders and value binding
- Date and time functions
- Boolean and numeric representations
- Auto-increment or counter columns
- Pagination syntax
- Transaction and connection-pool behavior
- Native data types and provider-specific features

That does not mean every database has exactly the same capabilities. It means the framework gives common operations a shared representation and leaves provider-specific translation at the adapter boundary.

For example, the same query can use `take(25)` and `skip(25)` across providers. The adapter can format that paging request according to the selected database instead of forcing model code to know whether the target engine expects `LIMIT`, `OFFSET`, `FETCH`, or another form.

## Query expressions are portable too

`@themost/query` builds database-independent query expressions before an adapter formats or executes them:

```javascript
import { QueryEntity, QueryExpression, SqlFormatter } from '@themost/query'

const orders = new QueryEntity('OrderData')
const query = new QueryExpression()
  .select((order) => ({
    id: order.id,
    orderDate: order.orderDate,
    status: order.orderStatus,
  }))
  .from(orders)
  .where((order) => order.orderStatus === 1)
  .orderByDescending((order) => order.orderDate)
  .take(20)

const sql = new SqlFormatter().format(query)
```

The formatter is useful for inspecting the generated SQL, while a configured adapter can execute the expression directly. `@themost/data` usually hides this lower-level step behind its model query API.

## Moving from SQLite to PostgreSQL

SQLite is convenient for local development and tests because it is file-based and easy to start. A production system may use PostgreSQL, MySQL, Oracle, or SQL Server for operational, scaling, or organizational reasons.

A provider change usually involves:

1. Installing the matching adapter package.
2. Registering its adapter type and invariant name.
3. Changing the active adapter options.
4. Migrating or verifying the database schema and data.
5. Running the application's model and integration tests against the new provider.

The model definitions and normal query calls should remain the same. If a change requires provider-specific logic in a model or business service, isolate it behind a deliberate adapter or service boundary rather than spreading it through the application.

## Test portability honestly

Database agnostic does not mean database independent in every edge case. A query that uses a common filter and sort is likely to travel well. A query that depends on a vendor-specific function, collation, JSON behavior, or transaction feature may need a provider-specific capability check.

Use a small compatibility test suite for the operations your application relies on:

- Create and update model entities.
- Query primitive fields and relationships.
- Apply paging and ordering.
- Execute transactions and rollbacks.
- Validate dates, counters, null values, and unique constraints.
- Exercise listeners, privileges, and calculated fields.

The same model tests can run against multiple adapters. That is one of the best ways to find a portability problem while it is still local and easy to fix.

## Keep the dialect at the edge

The useful design boundary is simple: domain code talks in models and query expressions, while adapters talk in database dialects. `@themost/sqlite`, `@themost/mysql`, `@themost/pg`, `@themost/oracle`, and `@themost/mssql` make that boundary concrete for their respective engines.

Choose the provider that fits the deployment, configure it explicitly, and keep the application vocabulary on `@themost/data` and `@themost/query`. That way, changing the database is a controlled infrastructure decision rather than a rewrite of the business model.

Explore the adapter packages through the [`@themost-framework` GitHub organization](https://github.com/themost-framework) and the [`@themost/query` documentation](https://github.com/themost-framework/query).
