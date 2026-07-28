DROP INDEX IF EXISTS idx_nav_point_lookup;
DROP INDEX IF EXISTS idx_matrix_snapshot_scheme_mode_start;
DROP INDEX IF EXISTS idx_fund_report_snapshot_scheme_start;
DROP INDEX IF EXISTS idx_fund_report_section_snapshot_lookup;
DROP INDEX IF EXISTS idx_peer_fund_snapshot_lookup;
DROP INDEX IF EXISTS idx_peer_comparison_snapshot_lookup;

ALTER TABLE nav_point DROP CONSTRAINT IF EXISTS uk_nav_point;
ALTER TABLE nav_point DROP PRIMARY KEY;
ALTER TABLE nav_point DROP COLUMN IF EXISTS id;
ALTER TABLE nav_point ADD PRIMARY KEY (scheme_code, series, nav_date);
CREATE INDEX idx_nav_point_covering ON nav_point (scheme_code, series, nav_date, nav);
