# Health

```
GET /health
```

Returns live status of Toolbaz (text) and DeepAI (image) upstream services.

---

## Response

```json
{
  "success": true,
  "status": "ok",
  "timestamp": 1700000000,
  "total_ms": 812,
  "checks": {
    "page": {
      "reachable": true,
      "status_code": 200,
      "latency_ms": 310
    },
    "token": {
      "reachable": true,
      "token_received": true,
      "status_code": 200,
      "latency_ms": 290
    },
    "image": {
      "reachable": true,
      "status_code": 200,
      "latency_ms": 212
    }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `ok` if all checks pass, `degraded` otherwise |
| `timestamp` | number | Unix timestamp of the check |
| `total_ms` | number | Total time for all checks in parallel |
| `checks.page` | object | Toolbaz page reachability |
| `checks.token` | object | Toolbaz token endpoint |
| `checks.image` | object | DeepAI image endpoint reachability |