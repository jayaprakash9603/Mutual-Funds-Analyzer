DROP INDEX idx_nav_point_lookup ON nav_point;
DROP INDEX idx_matrix_snapshot_scheme_mode_start ON matrix_snapshot;
DROP INDEX idx_fund_report_snapshot_scheme_start ON fund_report_snapshot;
DROP INDEX idx_fund_report_section_snapshot_lookup ON fund_report_section_snapshot;
DROP INDEX idx_peer_fund_snapshot_lookup ON peer_fund_snapshot;
DROP INDEX idx_peer_comparison_snapshot_lookup ON peer_comparison_snapshot;

ALTER TABLE nav_point DROP INDEX uk_nav_point;
ALTER TABLE nav_point DROP PRIMARY KEY;
ALTER TABLE nav_point DROP COLUMN id;
ALTER TABLE nav_point ADD PRIMARY KEY (scheme_code, series, nav_date);
CREATE INDEX idx_nav_point_covering ON nav_point (scheme_code, series, nav_date, nav);
