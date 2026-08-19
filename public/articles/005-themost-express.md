---
title: "Getting Started with @themost/express"
summary: "Connect @themost/data to an Express application with request contexts, model queries, and the built-in service router."
category: "Express Integration"
readingTime: "5 min read"
---

# Getting Started with @themost/express

`@themost/express` connects the model-first data layer of `@themost/data` to an Express.js application. It gives each request a data context, makes your configured models available through `req.context`, and provides a router for exposing those models as an API.

The result is a useful boundary between HTTP and the domain model:

```text
HTTP request -> ExpressDataApplication -> DataContext -> Model query
```

Install the package alongside Express:

```bash
npm install express @themost/express
```

## Create a data application

The central class is `ExpressDataApplication`. It loads the application configuration and initializes the model builder and service infrastructure:

```javascript
import express from 'express'
import path from 'node:path'
import { ExpressDataApplication, dateReviver } from '@themost/express'

const app = express()
const dataApplication = new ExpressDataApplication(
  path.resolve(process.cwd(), 'config'),
)

app.use(express.json({ reviver: dateReviver }))
app.use(dataApplication.middleware(app))
```

The configuration path points to the directory containing the application configuration, adapters, and model schemas. You can also construct the application with a configuration object when that is more convenient for tests or small applications.

## Request-scoped data contexts

After the middleware is registered, each request receives a `context` property:

```javascript
app.get('/people', async (req, res, next) => {
  try {
    const people = await req.context
      .model('Person')
      .select('id', 'name', 'email')
      .orderBy('name')
      .getItems()

    return res.json(people)
  } catch (error) {
    return next(error)
  }
})
```

`req.context` is an `ExpressDataContext`. It is connected to the current application configuration and is the normal entry point for model queries during a request. The middleware also finalizes the context when the response closes, helping release request-specific data resources consistently.

This is the important difference from putting a shared database object directly on the Express application: the context belongs to the request, while the application holds the reusable configuration and services.

## Use the built-in service router

When you want to expose your configured entity models through the framework's standard API, use `serviceRouter`:

```javascript
import passport from 'passport'
import { serviceRouter } from '@themost/express'

app.use(
  '/api',
  passport.authenticate('bearer', { session: false }),
  serviceRouter,
)
```

The router provides common operations for entity sets, individual entities, navigation properties, functions, actions, and metadata. The exact access rules still come from your model configuration and authentication setup.

A client can then make a request such as:

```text
GET /api/People?$select=id,name,email
```

The API is model-driven: `People` is resolved from the configured model definitions, and the query options are translated into the data layer rather than being manually converted into SQL inside a route.

## Traditional Express routes still work

You do not have to use the service router for every endpoint. A regular route can use the same request context and add application-specific behavior:

```javascript
app.post('/people', async (req, res, next) => {
  try {
    const person = await req.context.model('Person').save(req.body)
    return res.status(201).json(person)
  } catch (error) {
    return next(error)
  }
})
```

This gives you a practical choice. Use the service router for consistent model APIs, and use ordinary Express routes when an endpoint needs a custom workflow, response, or integration with another service.

## Run work outside a request

Background jobs and command-line tasks do not have `req.context`. `ExpressDataApplication` can create a context directly, or execute a callback and finalize the context for you:

```javascript
dataApplication.execute(async (context, done) => {
  try {
    const latestPeople = await context
      .model('Person')
      .where('dateModified').greaterThan(new Date(Date.now() - 86400000))
      .getItems()

    return done(null, latestPeople)
  } catch (error) {
    return done(error)
  }
}, (error, value) => {
  if (error) {
    console.error(error)
    return
  }

  console.log(value)
})
```

For promise-based code, create a context directly and finalize it when the operation completes. The key rule is the same as with any data context: finish the context after the work is done.

## Extend the application

`ExpressDataApplication` supports application services and strategies. A service can add routes or coordinate a cross-cutting capability while still receiving the configured application instance:

```javascript
class HealthService {
  constructor(application) {
    application.container.subscribe((container) => {
      if (container) {
        container.get('/health', (req, res) => {
          res.json({ status: 'ok' })
        })
      }
    })
  }
}

dataApplication.useService(HealthService)
```

This keeps extension points inside the application container instead of coupling every feature to the top-level Express setup.

## The Express boundary

`@themost/express` is deliberately focused. Express remains responsible for HTTP concerns such as routing, authentication middleware, and response handling. `@themost/data` remains responsible for models, queries, validation, relationships, privileges, and persistence. `@themost/express` gives them a request-aware context and a standard API path between them.

Start with `ExpressDataApplication`, register its middleware before routes that need data access, and use `req.context.model('ModelName')` inside those routes. From there, the same model definitions can serve custom Express endpoints, the built-in service router, background work, and tests.

For the complete integration surface, explore the [`@themost/express` repository](https://github.com/themost-framework/express) and its [usage examples](https://github.com/themost-framework/express#usage).
