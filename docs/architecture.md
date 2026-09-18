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

Los slots se generan al vuelo a partir de bloques, duración y citas existentes; no se persisten slots. La creación pública valida negocio, servicio, profesional y pertenencia, calcula `endAt`, revisa el solapamiento en servidor y ejecuta cliente+cita en una transacción Serializable. En PostgreSQL, una migración posterior puede añadir una exclusión GiST como defensa adicional; la transacción y el índice de citas son el MVP.

## Decisiones y límites

No se incluyen pagos, notificaciones, calendarios externos, múltiples sucursales ni API pública. La estructura deja esos módulos fuera del núcleo de reservas para agregarlos más adelante sin romper el aislamiento.
