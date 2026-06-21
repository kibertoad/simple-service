# Application — Domain rules

> Cross-cutting invariants and constraints this service must never violate.

- **All telemetry data must comply with OpenTelemetry standards for trace format and instrumentation**
  - _Why:_ Ensures compatibility with observability tooling and maintains consistent telemetry data structure
- **Instrumentation must not introduce significant performance overhead**
  - _Why:_ Maintains application performance while enabling observability
