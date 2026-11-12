CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target" text,
	"created_at" text NOT NULL
);

CREATE INDEX "audits_time" ON "audit_logs" ("created_at");
CREATE TABLE "error_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"path" text NOT NULL,
	"created_at" text NOT NULL
);

CREATE TABLE "field_evidence" (
	"restaurant_id" text NOT NULL,
	"field" text NOT NULL,
	"source_id" text NOT NULL,
	"checked_at" text,
	"status" text NOT NULL,
	"note" text,
	PRIMARY KEY("restaurant_id", "field")
);

CREATE TABLE "favorites" (
	"user_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"created_at" text NOT NULL,
	PRIMARY KEY("user_id", "restaurant_id")
);

CREATE TABLE "disclosure_grants" (
	"user_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"inquiry_id" text NOT NULL,
	"granted_by" text NOT NULL,
	"granted_at" text NOT NULL,
	PRIMARY KEY("user_id", "restaurant_id")
);

CREATE TABLE "search_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"query" text NOT NULL,
	"created_at" text NOT NULL
);

CREATE INDEX "history_user" ON "search_history" ("user_id","created_at");
CREATE TABLE "import_errors" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"row_number" integer,
	"message" text NOT NULL,
	"created_at" text NOT NULL
);

CREATE TABLE "import_jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text,
	"actor" text NOT NULL,
	"accepted" integer DEFAULT 0 NOT NULL,
	"rejected" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);

CREATE TABLE "inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"restaurant_id" text,
	"company" text NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"purpose" text NOT NULL,
	"consent_at" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"review_note" text,
	"reviewed_by" text,
	"reviewed_at" text,
	"created_at" text NOT NULL
);

CREATE INDEX "inquiries_user" ON "inquiries" ("user_id","created_at");
CREATE INDEX "inquiries_status" ON "inquiries" ("status","created_at");
CREATE TABLE "sales_list_items" (
	"list_id" text NOT NULL,
	"restaurant_id" text NOT NULL,
	"status" text DEFAULT '未接触' NOT NULL,
	"memo" text DEFAULT '' NOT NULL,
	"updated_at" text NOT NULL,
	PRIMARY KEY("list_id", "restaurant_id")
);

CREATE TABLE "sales_lists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" text NOT NULL
);

CREATE INDEX "lists_user" ON "sales_lists" ("user_id");
CREATE TABLE "merge_history" (
	"id" text PRIMARY KEY NOT NULL,
	"from_id" text NOT NULL,
	"to_id" text NOT NULL,
	"actor" text NOT NULL,
	"created_at" text NOT NULL
);

CREATE TABLE "restaurant_private_details" (
	"restaurant_id" text PRIMARY KEY NOT NULL,
	"operator_name" text,
	"corporate_number" text,
	"representative_name" text,
	"decision_maker_name" text,
	"decision_maker_role" text,
	"authority_status" text DEFAULT '未確認' NOT NULL,
	"website" text,
	"sns" text,
	"sales_info" text
);

CREATE INDEX "private_operator" ON "restaurant_private_details" ("operator_name");
CREATE INDEX "private_person" ON "restaurant_private_details" ("decision_maker_name");
CREATE TABLE "restaurants" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"kana" text,
	"postal_code" text,
	"prefecture" text NOT NULL,
	"municipality" text NOT NULL,
	"address" text NOT NULL,
	"normalized_address" text NOT NULL,
	"latitude" double precision,
	"longitude" double precision,
	"phone" text,
	"phone_normalized" text,
	"hours" text,
	"open_time" text,
	"close_time" text,
	"holiday" text,
	"category" text NOT NULL,
	"station" text,
	"store_type" text,
	"opened_at" text,
	"store_count" integer,
	"business_status" text DEFAULT '未確認' NOT NULL,
	"source_id" text NOT NULL,
	"checked_at" text,
	"verification" text DEFAULT '未確認' NOT NULL,
	"updated_at" text NOT NULL,
	"created_at" text NOT NULL,
	"redirect_to" text,
	"indexable" integer DEFAULT 1 NOT NULL,
	"deleted" integer DEFAULT 0 NOT NULL
);

CREATE INDEX "restaurants_name" ON "restaurants" ("normalized_name","id");
CREATE INDEX "restaurants_phone" ON "restaurants" ("phone_normalized");
CREATE INDEX "restaurants_area" ON "restaurants" ("prefecture","municipality","id");
CREATE INDEX "restaurants_category" ON "restaurants" ("category","id");
CREATE INDEX "restaurants_address" ON "restaurants" ("normalized_address");
CREATE INDEX "restaurants_updated" ON "restaurants" ("updated_at","id");
CREATE INDEX "restaurants_source" ON "restaurants" ("source_id");
CREATE INDEX "restaurants_visible" ON "restaurants" ("deleted","id");
CREATE TABLE "saved_searches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"query" text NOT NULL,
	"created_at" text NOT NULL
);

CREATE INDEX "saved_searches_user" ON "saved_searches" ("user_id");
CREATE TABLE "seo_checks" (
	"restaurant_id" text PRIMARY KEY NOT NULL,
	"status" text NOT NULL,
	"checked_at" text NOT NULL,
	"note" text
);

CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);

CREATE TABLE "data_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"license" text NOT NULL,
	"license_url" text NOT NULL,
	"record_date" text,
	"acquired_at" text NOT NULL,
	"scope" text NOT NULL
);

CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"company" text,
	"phone" text,
	"role" text DEFAULT 'member' NOT NULL,
	"disabled" integer DEFAULT 0 NOT NULL,
	"created_at" text NOT NULL
);

ALTER TABLE restaurant_private_details ADD CONSTRAINT private_restaurant_fk FOREIGN KEY (restaurant_id) REFERENCES restaurants(id);
CREATE INDEX "restaurants_public_sort" ON "restaurants" ("deleted","redirect_to",updated_at DESC,"id");
CREATE INDEX "restaurants_municipality_sort" ON "restaurants" ("municipality","deleted","redirect_to",updated_at DESC,"id");
CREATE INDEX "restaurants_category_sort" ON "restaurants" ("category","deleted","redirect_to",updated_at DESC,"id");