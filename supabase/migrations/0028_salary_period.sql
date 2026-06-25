ALTER TABLE wallets ADD COLUMN salary_cycle_day SMALLINT NOT NULL DEFAULT 1
  CHECK (salary_cycle_day BETWEEN 1 AND 28);

COMMENT ON COLUMN wallets.salary_cycle_day IS
  'Tanggal mulai periode gaji (1-28). 1 = awal bulan kalender.';
