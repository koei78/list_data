CREATE TABLE source_import_rows (
 source_id text NOT NULL,
 row_number integer NOT NULL,
 restaurant_id text,
 raw_json jsonb NOT NULL,
 payload_sha256 text NOT NULL,
 validation_errors jsonb NOT NULL DEFAULT '[]',
 PRIMARY KEY(source_id,row_number)
);
CREATE INDEX source_import_rows_restaurant ON source_import_rows(restaurant_id);
