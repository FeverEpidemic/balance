-- Migration 0024: Budget Carry-Over
-- Menambahkan toggle per kategori untuk carry-over sisa budget bulan sebelumnya

ALTER TABLE budgets ADD COLUMN carry_over_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN budgets.carry_over_enabled IS 'Apakah sisa budget dari bulan sebelumnya yang tidak terpakai akan ditambahkan ke budget bulan ini';
