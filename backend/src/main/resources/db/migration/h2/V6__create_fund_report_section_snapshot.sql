CREATE TABLE fund_report_section_snapshot (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scheme VARCHAR(512) NOT NULL,
    start_date VARCHAR(32) NOT NULL,
    section_group VARCHAR(32) NOT NULL,
    payload_json CLOB NOT NULL,
    watermark_nav_date TIMESTAMP NULL,
    computed_at TIMESTAMP NOT NULL,
    schema_version INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_fund_report_section_snapshot UNIQUE (scheme, start_date, section_group)
);

CREATE INDEX idx_fund_report_section_snapshot_lookup
    ON fund_report_section_snapshot (scheme, start_date, section_group);
