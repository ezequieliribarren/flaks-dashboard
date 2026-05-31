# Ideas para iteraciones futuras

Cosas identificadas durante la migración que quedan fuera del scope v1.

## UX / Producto

- **Notificaciones push**: Avisar a Germán cuando Ezequiel agenda una tarea para él (y viceversa). Podría ser un webhook de Supabase + email.
- **Vista de semana / calendario**: Un mini-calendario que muestre los eventos agendados de la semana actual para ver de un vistazo qué hay.
- **Filtro de objetivos por responsable**: Botón para ver solo las tareas de EZE o de GER en el cliente activo.
- **Drag-and-drop de objetivos**: Poder reordenar los objetivos dentro de cada sección (similar al drag de las pestañas).
- **Inline status click mejorado**: Mostrar un pequeño popover con los 4 estados en vez de ciclar secuencialmente.
- **Búsqueda global**: Barra de búsqueda que filtre por texto en nombre de cliente, objetivos y actividad.
- **Archivado de clientes**: En vez de eliminar un cliente, moverlo a un "archivo" donde no aparece en las pestañas pero sí en el historial.

## Técnico

- **Realtime con Supabase**: Usar `supabase.channel()` para recibir cambios en tiempo real sin esperar los 60 segundos de revalidación de SWR.
- **Optimistic updates más granulares**: Actualizar el estado local antes de que responda el servidor (especialmente para el ciclo de status, que se usa mucho).
- **Tests del cálculo de facturación**: 2-3 unit tests para `clientMonthlyRevenue` y `topClientConcentration` con casos edge (sin servicios, billing_type included, amount null).
- **Múltiples timezones**: Actualmente hardcodeado a `America/Argentina/Buenos_Aires`. Si el equipo tiene clientes en otras zonas, hacer esto configurable.
- **Historial de cambios por objetivo**: Tabla separada de `objective_history` para ver quién cambió qué y cuándo en cada objetivo.

## Facturación

- **Gráfico de facturación mensual**: Mini sparkline de los últimos 6 meses (requiere historial de montos).
- **Proyección anual**: Suma de todos los servicios recurrentes × 12, mostrado en la summary bar.
- **Alertas de concentración**: Enviar email si un cliente supera el 60% de la facturación total.
- **Exportar a CSV**: Exportar la tabla de clientes y servicios para usarla en reportes.
