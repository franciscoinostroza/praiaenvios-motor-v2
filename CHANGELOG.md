# Changelog

## v2.0.0 (2026-06-25)

### Added
- Feature flag `FORMATO_COMPLETO` (default: `false`)
- Flujo combinado Praia + UPS para Venezuela (ejecución en paralelo, timeout 8s)
- Flujo internacional solo UPS con 1 reintento automático
- 15 formatos reutilizables con i18n (ES/PT/EN) basados en sistema de bloques
- Tabla `trechos_config`: 37 ciudades LATAM con códigos IATA, direcciones LATAM Cargo, días adicionales
- Tabla `config_texto`: configuración clave-valor (dirección base Curitiba, etc.)
- Motor: funciones `getInfoTrecho()` y `recolectaDisponible()`
- Admin panel: CRUD para trechos_config y config_texto
- Validación: `codigo_postal_destino` obligatorio para cotizaciones UPS
- Margen de ganancia UPS configurable (`porcentaje_ganancia_ups`, default 40%)
- Recargo sobre tasa de mercado (`tasa_ups_offset`, default +40 pts)
- Dirección base Curitiba configurable desde admin

### Changed
- `server.js`: startup con `runSetup()` (migrate + seed al iniciar)
- `server.js`: Express escucha antes de setup para que healthcheck responda inmediato
- `config.js`: carga `CONFIG_TEXTO`, `ZONAS_SIN_COBERTURA`, `ZONAS_RECOLECTA`, `TRECHOS_MAP`
- `railway.json`: preDeployCommand reducido a solo migrate
- Seed idempotente (ON CONFLICT DO NOTHING) para ejecución segura en cada startup

### Fixed
- Railway "Deploy failed" falso positivo: preDeploy ahora solo ejecuta migrate (rápido, sin seed)
- Healthcheck inmediato: Express escucha antes de runSetup

## v1.0.0 (Legacy)
- Motor original solo Praia Envíos
- Cotizaciones nacionales Brasil
- Formateo legacy sin soporte UPS
- Sin trecho configurable por ciudad
