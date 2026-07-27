CREATE TABLE peer_fund_snapshot (
    id BIGSERIAL PRIMARY KEY,
    scheme VARCHAR(512) NOT NULL,
    start_date VARCHAR(32) NOT NULL,
    payload_json TEXT NOT NULL,
    watermark_nav_date TIMESTAMP NULL,
    computed_at TIMESTAMP NOT NULL,
    schema_version INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_peer_fund_snapshot UNIQUE (scheme, start_date)
);

CREATE INDEX idx_peer_fund_snapshot_lookup
    ON peer_fund_snapshot (scheme, start_date);

CREATE TABLE peer_comparison_snapshot (
    id BIGSERIAL PRIMARY KEY,
    scheme VARCHAR(512) NOT NULL,
    category VARCHAR(256) NOT NULL,
    start_date VARCHAR(32) NOT NULL,
    peer_schemes_json TEXT NOT NULL,
    payload_json TEXT NOT NULL,
    watermark_nav_date TIMESTAMP NULL,
    computed_at TIMESTAMP NOT NULL,
    schema_version INT NOT NULL DEFAULT 0,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT uk_peer_comparison_snapshot UNIQUE (scheme, category, start_date)
);

CREATE INDEX idx_peer_comparison_snapshot_lookup
    ON peer_comparison_snapshot (scheme, category, start_date);
