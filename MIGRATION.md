# Migración de datos

## Qué hace el script

`scripts/migrate-from-json.ts` lee `flaks-data.json` (el archivo de producción del sistema anterior) y lo inserta en Supabase con la nueva estructura de tablas.

Mapeos importantes:
- `client.monthly[]` del JSON → tabla `objectives` con `type = 'task'`
- `client.quarterly[]` del JSON → tabla `objectives` con `type = 'monthly'`
- `obj.owner` (EZE/GER/AMBOS) → `objectives.owner_role`
- `obj.changedBy` (role code) → `objectives.changed_by_role` (el campo `changed_by` queda NULL porque no tenemos el UUID del auth.user aún)
- `obj.calendarEventId` → `objectives.calendar_event_id` (referencias a eventos ya existentes en Calendar)
- `config.team` → tabla `team_members` sin `user_id` (se vincula automáticamente en el primer login)

El script es **idempotente**: si una fila ya existe (misma PK), la actualiza con UPSERT. Se puede correr múltiples veces sin duplicar datos.

**Excepción**: `activity_log` usa INSERT (no UPSERT porque no tiene PK natural). Si corrés el script más de una vez, las entradas del log se duplican. Antes de correrlo por segunda vez, borrá las filas de `activity_log` en Supabase Table Editor.

## Cómo correrlo

```bash
# 1. Asegurate de tener .env.local con:
#    NEXT_PUBLIC_SUPABASE_URL=...
#    SUPABASE_SERVICE_ROLE_KEY=...
#    EZE_EMAIL=info@flaks.com.ar
#    GER_EMAIL=email-german@gmail.com

# 2. Tener el flaks-data.json en el directorio raíz del proyecto

# 3. Instalar deps si no lo hiciste
npm install

# 4. Correr
npm run migrate
```

## Salida esperada

```
🚀 Migrando flaks-data.json → Supabase…

  👥 Team members… ✓ 3 rows
  🏢 Clientes, servicios, objetivos, contenido fijo… ✓ 11 clientes | 22 servicios | 47 objetivos | 7 tareas fijas
  📋 Activity log… ✓ 80 entries

✅ Migración completada!
```

## Verificación

Después de correr el script, verificá en **Supabase → Table Editor**:

1. `clients` → 11 filas (una por cliente)
2. `objectives` → ~47 filas (suma de monthly + quarterly de todos los clientes)
3. `team_members` → 3 filas (EZE, GER, AMBOS) con `user_id = NULL`
4. `activity_log` → ~80 filas

La vinculación `team_members.user_id` se completa automáticamente cuando Ezequiel y Germán hagan su primer login con Google.

## Correrlo de nuevo (datos actualizados)

Si en el futuro quierés migrar datos nuevos desde un JSON actualizado:

```sql
-- En Supabase SQL Editor, limpiar activity_log antes:
DELETE FROM activity_log;
```

Luego correr `npm run migrate` nuevamente. Los clientes, servicios, objetivos y fixed_content se upsertean sin duplicados.
