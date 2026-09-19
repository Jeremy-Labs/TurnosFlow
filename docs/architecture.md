# Arquitectura de TurnosFlow

## Forma general

TurnosFlow es un monolito modular en Next.js App Router. Las rutas sirven UI y endpoints; `lib/domain` contiene reglas puras y `lib/booking.ts` concentra la transacción de reserva. Prisma es el único acceso a PostgreSQL.

## Multi-tenancy y permisos

`User` se relaciona con `Business` mediante `Membership`, por lo que una persona puede pertenecer a varios negocios. Todos los recursos tienen `businessId` directo. Las consultas privadas deben obtener primero la membresía del usuario y aplicar el `businessId` resuelto también en la consulta del recurso; nunca se autoriza por un ID enviado por el navegador.

## Autenticación

Auth.js y el adaptador de Prisma son la integración prevista. La sesión identifica al `User`; el selector de negocio resuelve una `Membership`. El seed crea un usuario demo para desarrollo.

## Disponibilidad y timezone

`Availability` guarda bloques semanales locales del profesional y admite varios bloques por día. `Business.timezone` es IANA. Las citas se almacenan como `DateTime` UTC. El servidor convierte la fecha/hora de negocio al instante UTC antes de consultar o crear; el dominio recibe instantes y no guarda horas ambiguas.

## Booking y doble reserva

Los slots se generan al vuelo a partir de bloques, duración y citas existentes; no se persisten slots. La creación pública valida que la hora sea futura, resuelve negocio+servicio+profesional+relación EmployeeService en el mismo tenant, deriva el día local del negocio, calcula slots y exige coincidencia exacta antes de crear cliente+cita. Todo ocurre en una transacción Serializable. Un error de serialización se reintenta una vez y luego devuelve un conflicto legible al cliente.

## Hardening de timezone y autenticación

El motor trata la fecha elegida como una fecha local de `Business.timezone`, calcula el inicio y siguiente inicio de día en esa zona y consulta citas por solapamiento. Esto evita asumir que un día dura 24 horas o empieza a medianoche UTC. La UI formatea las citas con la timezone del negocio. Las contraseñas locales se guardan con bcrypt; el único password de demo es creado por el seed de desarrollo.

## Decisiones y límites

No se incluyen pagos, notificaciones, calendarios externos, múltiples sucursales ni API pública. La estructura deja esos módulos fuera del núcleo de reservas para agregarlos más adelante sin romper el aislamiento.
