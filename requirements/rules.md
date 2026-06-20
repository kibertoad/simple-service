# OpenTelemetry Integration Service — Domain rules

> Cross-cutting invariants and constraints this service must never violate.

- **All traces must include request context**
  - _Why:_ To enable proper distributed tracing
- **Traces must be exported to OTLP endpoint**
  - _Why:_ To ensure observability across services
