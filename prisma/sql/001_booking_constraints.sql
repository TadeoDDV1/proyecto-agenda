-- Restricciones que Prisma no puede expresar en el schema.
-- Ejecutar después de `prisma db push` (o incluir en la migración SQL).
-- Idempotente: se puede correr varias veces.
--
-- Nota: Prisma usa los nombres de campo como nombres de columna
-- (`startTime`, `staffId`), salvo que el modelo tenga @map.

-- 1. `btree_gist` permite mezclar igualdad (staffId) con rangos (tstzrange).
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 2. Un profesional no puede tener dos citas activas solapadas.
--    Es la defensa final contra la condición de carrera entre web, admin y bot.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'appointments_no_overlap'
  ) THEN
    ALTER TABLE appointments
      ADD CONSTRAINT appointments_no_overlap
      EXCLUDE USING gist (
        "staffId" WITH =,
        tstzrange("startTime", "endTime", '[)') WITH &&
      )
      WHERE (
        status IN (
          'PENDING'::"AppointmentStatus",
          'CONFIRMED'::"AppointmentStatus"
        )
      );
  END IF;
END
$$;

-- 3. Índice para recordatorios y para "mis próximas citas" por cliente.
CREATE INDEX IF NOT EXISTS appointments_customer_start_idx
  ON appointments ("customerId", "startTime");
