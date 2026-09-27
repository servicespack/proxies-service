# Proxies Service

---

* Dynamic reverse proxy
* Configurable persistence drivers (LowDB, MongoDB)
* OpenAPI / Swagger documentation (`/docs`)
* Prometheus metrics (`/metrics`)
* Protected by [helmet](https://helmetjs.github.io/)
* Graceful shutdown

## How it works

Proxies Service dynamically routes incoming HTTP requests based on the first path segment (`/:namespace`):

1. Register a proxy pointing a `namespace` to a `target` URL (e.g. `users` ➔ `https://users.yourmicroservices.dev`).
2. Any request sent to `http://localhost:3000/users/path?query=val` is transparently proxied to `https://users.yourmicroservices.dev/path?query=val`.

## Getting started

Start the service using Docker:

```sh
docker container run \
  -p 3000:3000 \
  -v "proxies-service-data:/usr/src/app/data" \
  -e CONFIG_PATH=/usr/src/app/data/config.json \
  -e TOKEN=your-secret-token \
  -e NODE_ENV=production \
  --name proxies-service \
  servicespack/proxies-service
```

> **Note:** `TOKEN` is required on startup when management routes are enabled (`ENABLE_PROXIES_CRUD=true`).

## API Documentation

Interactive API documentation and full schema references are available via Swagger UI at:

> **http://localhost:3000/docs**

### Authentication

Management routes under `/proxies` are protected and require the secret token passed via query parameter:

```sh
?token=<TOKEN>
```

### Healthcheck

A lightweight ping endpoint is available at the root:

> `GET /`

Response:

```json
{
  "I": "am alive"
}
```

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP server port | `3000` |
| `TOKEN` | Secret authentication token | Required if `ENABLE_PROXIES_CRUD=true` |
| `DATABASE_DRIVER` | Database storage driver (`lowdb` or `mongodb`) | `lowdb` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017` |
| `MONGODB_DATABASE` | MongoDB database name | `proxies` |
| `ENABLE_PROXIES_CRUD` | Enable `/proxies` management endpoints | `'true'` |
| `ENABLE_METRICS_ROUTER` | Enable `/metrics` Prometheus endpoint | `'false'` |
| `ENABLE_SWAGGER` | Enable `/docs` Swagger UI endpoint | `'true'` |

## License

MIT
