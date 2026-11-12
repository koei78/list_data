CREATE TABLE growth_events (
 id text PRIMARY KEY,
 event text NOT NULL CHECK(event IN ('sample_view','sample_start','sample_submit','sample_download')),
 area text NOT NULL DEFAULT '',
 source text NOT NULL CHECK(source IN ('google','search','social','direct','internal','other')),
 day text NOT NULL,
 created_at text NOT NULL
);
CREATE INDEX growth_events_day ON growth_events(day,event);
CREATE INDEX growth_events_created ON growth_events(created_at);
