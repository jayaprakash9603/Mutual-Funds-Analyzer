CREATE TABLE matrix_snapshot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scheme VARCHAR(512) NOT NULL,
    mode VARCHAR(32) NOT NULL,
    start_date VARCHAR(32) NOT NULL,
    matrix_json LONGTEXT NOT NULL,
    watermark_nav_date TIMESTAMP NULL,
    computed_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_matrix_snapshot_scheme_mode_start UNIQUE (scheme, mode, start_date)
);

CREATE INDEX idx_matrix_snapshot_scheme_mode_start ON matrix_snapshot (scheme, mode, start_date);
