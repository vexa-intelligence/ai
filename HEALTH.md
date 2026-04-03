# Health

```
GET /health
```

Returns live status of Vexa (text) and Vexa Image Model (image) upstream services.

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
    },
    "models": {
      "vexa": { "ok": true, "latency_ms": 340 },
      "gemini-2.5-flash-lite": { "ok": true, "latency_ms": 410 },
      "gpt-4.1-nano": { "ok": false, "error": "DeepAI error 429", "latency_ms": 120 }
    }
  },
  "failed_models": ["gpt-4.1-nano"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `ok` if all checks pass, `degraded` otherwise |
| `timestamp` | number | Unix timestamp of the check |
| `total_ms` | number | Total time for all checks in parallel |
| `checks.page` | object | Vexa page reachability |
| `checks.token` | object | Vexa token endpoint |
| `checks.image` | object | Vexa Image Model endpoint reachability |
| `checks.models` | object | Per-model live probe results keyed by model ID |
| `checks.models[id].ok` | boolean | Whether the model responded successfully |
| `checks.models[id].latency_ms` | number | Round-trip time for this model's probe |
| `checks.models[id].error` | string | Error message if `ok` is `false` |
| `failed_models` | array | Model IDs that failed — omitted when all models pass |