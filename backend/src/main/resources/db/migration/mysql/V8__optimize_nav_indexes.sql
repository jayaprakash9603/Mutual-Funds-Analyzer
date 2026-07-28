SET @drop_nav_lookup := IF(
    (SELECT COUNT(*)
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'nav_point'
       AND index_name = 'idx_nav_point_lookup') > 0,
    'ALTER TABLE nav_point DROP INDEX idx_nav_point_lookup',
    'SELECT 1');
PREPARE stmt FROM @drop_nav_lookup;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_matrix := IF(
    (SELECT COUNT(*)
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'matrix_snapshot'
       AND index_name = 'idx_matrix_snapshot_scheme_mode_start') > 0,
    'ALTER TABLE matrix_snapshot DROP INDEX idx_matrix_snapshot_scheme_mode_start',
    'SELECT 1');
PREPARE stmt FROM @drop_matrix;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_fund_report := IF(
    (SELECT COUNT(*)
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'fund_report_snapshot'
       AND index_name = 'idx_fund_report_snapshot_scheme_start') > 0,
    'ALTER TABLE fund_report_snapshot DROP INDEX idx_fund_report_snapshot_scheme_start',
    'SELECT 1');
PREPARE stmt FROM @drop_fund_report;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_section := IF(
    (SELECT COUNT(*)
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'fund_report_section_snapshot'
       AND index_name = 'idx_fund_report_section_snapshot_lookup') > 0,
    'ALTER TABLE fund_report_section_snapshot DROP INDEX idx_fund_report_section_snapshot_lookup',
    'SELECT 1');
PREPARE stmt FROM @drop_section;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_peer_fund := IF(
    (SELECT COUNT(*)
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'peer_fund_snapshot'
       AND index_name = 'idx_peer_fund_snapshot_lookup') > 0,
    'ALTER TABLE peer_fund_snapshot DROP INDEX idx_peer_fund_snapshot_lookup',
    'SELECT 1');
PREPARE stmt FROM @drop_peer_fund;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_peer_cmp := IF(
    (SELECT COUNT(*)
     FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'peer_comparison_snapshot'
       AND index_name = 'idx_peer_comparison_snapshot_lookup') > 0,
    'ALTER TABLE peer_comparison_snapshot DROP INDEX idx_peer_comparison_snapshot_lookup',
    'SELECT 1');
PREPARE stmt FROM @drop_peer_cmp;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @nav_has_id := (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'nav_point'
      AND column_name = 'id');

SET @drop_uk := IF(
    @nav_has_id > 0
        AND (SELECT COUNT(*)
             FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = 'nav_point'
               AND index_name = 'uk_nav_point') > 0,
    'ALTER TABLE nav_point DROP INDEX uk_nav_point',
    'SELECT 1');
PREPARE stmt FROM @drop_uk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @strip_auto_increment := IF(
    @nav_has_id > 0,
    'ALTER TABLE nav_point MODIFY COLUMN id BIGINT NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @strip_auto_increment;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_pk := IF(
    @nav_has_id > 0,
    'ALTER TABLE nav_point DROP PRIMARY KEY',
    'SELECT 1');
PREPARE stmt FROM @drop_pk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @drop_id := IF(
    @nav_has_id > 0,
    'ALTER TABLE nav_point DROP COLUMN id',
    'SELECT 1');
PREPARE stmt FROM @drop_id;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_composite_pk := (
    SELECT COUNT(*)
    FROM information_schema.table_constraints tc
             JOIN information_schema.key_column_usage kcu
                  ON tc.constraint_schema = kcu.constraint_schema
                      AND tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = DATABASE()
      AND tc.table_name = 'nav_point'
      AND tc.constraint_type = 'PRIMARY KEY'
      AND kcu.column_name IN ('scheme_code', 'series', 'nav_date'));

SET @add_pk := IF(
    @nav_has_id > 0 AND @has_composite_pk < 3,
    'ALTER TABLE nav_point ADD PRIMARY KEY (scheme_code, series, nav_date)',
    'SELECT 1');
PREPARE stmt FROM @add_pk;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_covering := (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'nav_point'
      AND index_name = 'idx_nav_point_covering');

SET @add_covering := IF(
    @has_covering = 0,
    'CREATE INDEX idx_nav_point_covering ON nav_point (scheme_code, series, nav_date, nav)',
    'SELECT 1');
PREPARE stmt FROM @add_covering;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
