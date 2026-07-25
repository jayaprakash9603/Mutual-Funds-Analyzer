CREATE TABLE fund_analysis (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scheme VARCHAR(512) NOT NULL,
    period VARCHAR(32) NOT NULL,
    analysed_at TIMESTAMP NOT NULL,
    result_json LONGTEXT NOT NULL,
    insights_json LONGTEXT NOT NULL,
    timeline_json LONGTEXT NOT NULL
);

CREATE INDEX idx_fund_analysis_scheme_period ON fund_analysis (scheme, period, analysed_at DESC);

CREATE TABLE rolling_aggregate (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    scheme VARCHAR(512) NOT NULL,
    period VARCHAR(32) NOT NULL,
    fund_name VARCHAR(512) NOT NULL DEFAULT '',
    benchmark_name VARCHAR(512) NOT NULL DEFAULT '',
    category VARCHAR(256) NOT NULL DEFAULT '',
    fund_count BIGINT NOT NULL DEFAULT 0,
    fund_mean DOUBLE NOT NULL DEFAULT 0,
    fund_m2 DOUBLE NOT NULL DEFAULT 0,
    fund_min DOUBLE NOT NULL DEFAULT 0,
    fund_max DOUBLE NOT NULL DEFAULT 0,
    index_count BIGINT NOT NULL DEFAULT 0,
    index_mean DOUBLE NOT NULL DEFAULT 0,
    index_m2 DOUBLE NOT NULL DEFAULT 0,
    index_min DOUBLE NOT NULL DEFAULT 0,
    index_max DOUBLE NOT NULL DEFAULT 0,
    aligned_count BIGINT NOT NULL DEFAULT 0,
    fund_win_count BIGINT NOT NULL DEFAULT 0,
    watermark_nav_date TIMESTAMP NULL,
    computed_at TIMESTAMP NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_rolling_aggregate_scheme_period UNIQUE (scheme, period)
);

CREATE INDEX idx_rolling_aggregate_scheme_period ON rolling_aggregate (scheme, period);
