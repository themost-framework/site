---
title: "The @themost-framework Application Structure"
summary: "Use @themost/test as a map for organizing a @themost-framework application, from configuration and models to routes, authentication, and the database."
category: "Application Architecture"
readingTime: "7 min read"
---

# The @themost-framework Application Structure

The [`@themost/test`](https://github.com/themost-framework/test) package is more than a test database. It is a small, working `@themost-framework` application that shows how configuration, models, Express routes, authentication, and storage fit together.

Its server directory follows a useful separation of responsibilities:

```text
modules/test/server/
├── app.js
├── standalone.js
├── config/
│   ├── app.json
│   ├── models/
│   └── public.pem / private.key
├── db/
│   └── local.db
├── models/
├── routes/
└── views/
```

The exact contents can grow with an application, but the boundary between these areas is the important part.

## `app.js` is the composition root

The application starts in `server/app.js`. Its `getApplication()` function creates the Express instance and composes the framework services:

```javascript
const app = express()
const serviceApplication = new ExpressDataApplication(
  path.resolve(applicationDir, 'config'),
)

app.use(express.json({ reviver: dateReviver }))
app.use(serviceApplication.middleware(app))
```

This file is the composition root. It wires together the configuration directory, the data application, authentication, routes, metadata, error handling, and views. It should assemble the application rather than become the place where every model rule is implemented.

The data middleware is especially important. It creates an `ExpressDataContext` for a request and exposes it as `req.context`, allowing routes and services to query models through the active configuration.

## Configuration is the application contract

The `server/config` directory is where the application declares how it should operate. Its central `app.json` configuration connects model loading, database adapters, and runtime settings.

A simplified configuration shape looks like this:

```json
{
  "adapterTypes": [
    {
      "name": "Test Data Adapter",
      "invariantName": "sqlite",
      "type": "@themost/sqlite#SqliteAdapter"
    }
  ],
  "adapters": [
    {
      "name": "test",
      "invariantName": "test",
      "default": true,
      "options": {
        "database": "./db/local.db"
      }
    }
  ],
  "settings": {
    "api": {
      "origin": "http://localhost:3000"
    }
  }
}
```

The exact values can differ by version and environment, but the responsibilities remain recognizable:

- `adapterTypes` maps an invariant name to an adapter implementation.
- `adapters` defines named connections and their options.
- `default` selects the connection used when no other adapter is requested.
- `settings` contains application-level options such as API origin and authentication behavior.
- Model definitions are loaded from the configured schema location, normally `config/models`.

This arrangement keeps deployment choices out of model files. A model can say that `Order` has a `customer` and an `orderStatus`; the configuration decides which database stores those entities.

## Model schemas define the domain

The `config/models` directory contains JSON schema definitions such as `Order.json`, `Person.json`, `Product.json`, and `User.json`. These files describe the domain vocabulary:

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
      "nullable": false
    },
    {
      "name": "price",
      "type": "Number"
    }
  ]
}
```

Schemas can also define relationships, inheritance, views, privileges, constraints, and event listeners. This is where the model contract belongs. It is not an Express route and it is not a database migration script.

The framework's schema loader reads these definitions and makes them available through `context.model('Product')`. The OData model builder can then expose the same definitions as entity types, entity sets, and metadata.

## `models` adds executable behavior

The `server/models` directory contains JavaScript model classes for behavior that is easier to express in code. In `@themost/test`, the model classes build a hierarchy such as:

```text
Thing -> Account -> User
```

A class can add functions, validation helpers, or specialized behavior while the JSON schema continues to describe fields and relationships:

```javascript
@EdmMapping.entityType('User')
class User extends Account {
  static async getMe(context) {
    return context.model('User')
      .where('name').equal(context.user && context.user.name)
      .getTypedItem()
  }
}
```

This gives the application two complementary modelling tools. JSON schemas are excellent for declarative metadata. Model classes are useful when a domain operation needs executable logic.

## `db` holds the test storage

The `server/db` directory contains the SQLite fixture used by the test application. The repository describes it as a CRM-style database with customers, products, offers, orders, and related objects.

When `@themost/test` starts its built-in application, it copies the local database to a temporary location before using it. That keeps test runs isolated and prevents one test run from permanently changing the repository fixture.

This is a good pattern for a learning environment:

- The schema is inspectable.
- The database contains realistic relationships.
- Each run can start from known data.
- The same application can be used by tests and API clients.

In a production application, the adapter options would normally point to a managed database or an environment-specific database location instead of a copied local fixture.

## `routes` owns HTTP behavior

The `server/routes` directory contains Express routers for concerns such as authentication, documentation, and the application home page. These routes use `req.context` when they need model data, but they do not need to know how a database connection was created.

The test application also mounts the framework's `serviceRouter` under `/api/`. That router exposes model-driven operations and metadata through the OData service surface. Custom routes can still be added for workflows that need a response or process beyond ordinary entity operations.

A useful route remains small:

```javascript
router.get('/me', async (req, res, next) => {
  try {
    const user = await req.context.model('User')
      .where('name').equal(req.context.user.name)
      .getItem()

    return res.json(user)
  } catch (error) {
    return next(error)
  }
})
```

The route handles HTTP input and output. The model handles the data vocabulary and query behavior.

## Authentication is an application service

The test server registers an `Authenticator` application service. Its configuration reads JWT key paths from the application settings, and its routes expose token and login behavior under `/auth/`.

The authentication flow is separate from the data model, but it uses the model context to validate users and clients. Once Passport authenticates a request, `@themost/express` makes the authenticated user available through the request context.

This matters for model privileges. An `Order` privilege such as `customer/user eq me()` can evaluate ownership using the same authenticated identity that the route and service layer use.

Keep private keys and credentials outside source-controlled configuration. The test project includes key files because it is a self-contained learning and testing environment; a deployed application should load secrets securely.

## `standalone.js` is the launcher

The `server/standalone.js` file is a command-line entry point. It creates the application with `getApplication()`, applies options such as port, host, and API origin, and starts it with `serveApplication()`:

```javascript
const app = getApplication(cwd)
const service = app.get('ExpressDataApplication')
service.configuration.setSourceAt('settings/api/origin', origin)
await serveApplication(app, port, host)
```

Keeping the launcher separate from `app.js` makes the application easy to reuse. Tests can import `getApplication()` without starting a permanent process, while the command-line package can choose its own port and host.

## A request through the structure

A request to the test API passes through the layers in a predictable order:

```text
client request
    |
    v
Express routes and authentication
    |
    v
ExpressDataApplication middleware
    |
    v
request-scoped ExpressDataContext
    |
    v
model schema and model behavior
    |
    v
@themost/query expression
    |
    v
configured database adapter
    |
    v
SQLite, PostgreSQL, MySQL, Oracle, or another provider
```

The same model definition can therefore participate in HTTP APIs, background jobs, tests, privileges, listeners, and database operations without each layer inventing a separate representation.

## A useful starting structure

When creating a new application, begin with the shape demonstrated by `@themost/test`:

```text
server/
├── app.js              # compose the application
├── config/
│   ├── app.json        # adapters and runtime settings
│   └── models/         # domain schemas
├── models/             # executable model behavior
├── routes/             # HTTP-specific routes and services
├── db/                 # local or test database fixtures
└── views/              # server-rendered pages, if needed
```

The most important habit is to keep configuration explicit. Put adapter selection, model loading, API origin, authentication settings, and environment-specific options in configuration. Put domain shape in schemas. Put executable domain behavior in model classes or listeners. Put HTTP behavior in routes and services.

That separation is what makes `@themost/test` useful as a learning application: every concern has a visible home, but all of them meet through the same `ExpressDataApplication` and model context.
