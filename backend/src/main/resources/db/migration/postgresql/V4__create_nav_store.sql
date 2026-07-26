CREATE TABLE nav_point (
    id BIGSERIAL PRIMARY KEY,
    scheme_code INT NOT NULL,
    series VARCHAR(16) NOT NULL,
    nav_date DATE NOT NULL,
    nav DOUBLE NOT NULL,
    CONSTRAINT uk_nav_point UNIQUE (scheme_code, series, nav_date)
);

CREATE INDEX idx_nav_point_lookup ON nav_point (scheme_code, series, nav_date);

CREATE TABLE nav_series_meta (
    id BIGSERIAL PRIMARY KEY,
    scheme_code INT NOT NULL,
    scheme VARCHAR(512) NOT NULL,
    fund_name VARCHAR(512) NOT NULL DEFAULT '',
    benchmark_name VARCHAR(512) NOT NULL DEFAULT '',
    category VARCHAR(256) NOT NULL DEFAULT '',
    amc VARCHAR(256) NOT NULL DEFAULT '',
    first_nav_date TIMESTAMP,
    watermark_nav_date TIMESTAMP,
    benchmark_watermark_nav_date TIMESTAMP,
    refreshed_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_nav_series_meta_code UNIQUE (scheme_code)
);

CREATE TABLE fund_report_snapshot (
    id BIGSERIAL PRIMARY KEY,
    scheme VARCHAR(512) NOT NULL,
    start_date VARCHAR(32) NOT NULL,
    report_json TEXT NOT NULL,
    watermark_nav_date TIMESTAMP,
    computed_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_fund_report_snapshot UNIQUE (scheme, start_date)
);

CREATE INDEX idx_fund_report_snapshot_scheme_start ON fund_report_snapshot (scheme, start_date);
