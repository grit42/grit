SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit_generic_log(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.audit_generic_log() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
            DECLARE
              r record;
              old_row jsonb;
              changed_cols jsonb := jsonb_build_object();
              l_usr varchar(30);
            BEGIN

              IF TG_OP = 'DELETE' THEN
              changed_cols := jsonb_strip_nulls(to_jsonb(OLD));
                -- To be fixed, the app username is not tracked on delete, here the table "core_current_user" is used, maybe not safe?
                select max(created_by) into l_usr from core_current_user;
                INSERT INTO audit_trail_generic (chgtime, action, username, table_name, record_id, row_data) VALUES (now(), 'D', coalesce(l_usr, session_user), TG_TABLE_NAME, old.id, changed_cols);
              ELSIF TG_OP = 'UPDATE' THEN
                old_row := to_jsonb(OLD);
                FOR r IN SELECT t.key, t.value FROM jsonb_each(to_jsonb(NEW)) AS t WHERE t.key not in ('updated_at', 'updated_by')
                LOOP
                  IF r.value IS DISTINCT FROM jsonb_extract_path(old_row, r.key)
                AND NOT ( nullif(r.value, '""') is null AND old_row::jsonb ->> r.key is null )
                AND r.key not in ('updated_at', 'updated_by')
              THEN
                    --RAISE WARNING 'Change in %.% - OLD: %s, NEW: %s', TG_TABLE_NAME, r.key, jsonb_extract_path(old_row, r.key), r.value;
                    changed_cols := jsonb_set(changed_cols, array[r.key], r.value);
                  END IF;
                END LOOP;
                -- any cols changed?
                IF changed_cols != jsonb_build_object() THEN
                  INSERT INTO audit_trail_generic (chgtime, action, username, table_name, record_id, row_data) VALUES (new.updated_at, 'U', new.updated_by, TG_TABLE_NAME, old.id, to_jsonb(changed_cols));
                ELSE
                  NULL;
                END IF;
              ELSIF TG_OP = 'INSERT' THEN
                changed_cols := jsonb_strip_nulls(to_jsonb(NEW));
              INSERT INTO audit_trail_generic (chgtime, action, username, table_name, record_id, row_data) VALUES (new.created_at, 'I' , new.created_by, TG_TABLE_NAME, new.id, changed_cols);
              END IF;

              RETURN NULL;
            END;
            $$;


--
-- Name: create_audit_view(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_audit_view(p_table_name text) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
            DECLARE
              r record;
              str1 text := ' (chgtime, username, action, id ';
              str2 text := 'chgtime, username, action, record_id ';
            BEGIN
                FOR r IN select table_name, column_name, 'row_data->>'''||column_name||''' as '||column_name as json_column
                  from information_schema.columns
                  where table_name = p_table_name
                  and   column_name not in ('id')
                LOOP
                str1 := str1||', '||r.column_name;
                str2 := str2||', '||r.json_column;
                END LOOP;
              str1 := str1||' )';
                EXECUTE 'CREATE OR REPLACE VIEW AUD_'
                || quote_ident(p_table_name)
              || ' '||str1
              || ' AS SELECT '||str2
              || ' FROM audit_trail_generic'
              || ' WHERE table_name = '''||quote_ident(p_table_name)||'''';
              RETURN 'View aud_'||p_table_name||' created';
            END;
            $$;


--
-- Name: disable_audit_trg(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.disable_audit_trg() RETURNS character varying
    LANGUAGE plpgsql
    AS $_$
            DECLARE r record;
            BEGIN
                FOR r IN select table_schema, table_name
                  FROM information_schema.tables
                  WHERE
                    table_schema NOT IN ('pg_catalog', 'information_schema')
                  AND table_type = 'BASE TABLE'
                  AND table_schema = 'public'
                  AND table_name not like 'grit42%'
                  AND table_name not like 'tmp%'
                  AND table_name not like '%aud$%'
                  AND table_name not like 'load_%'
                  AND table_name not in ('audit_trail_generic', 'schema_migrations', 'mm_schema_information')
                LOOP
              EXECUTE 'drop trigger if exists '
              || quote_ident(r.table_name || '_audtrg')
              || ' on '
              || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name);
                END LOOP;
              RETURN 'OK';
            END;
            $_$;


--
-- Name: enable_audit_trg(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.enable_audit_trg() RETURNS character varying
    LANGUAGE plpgsql
    AS $_$
            DECLARE r record;
            BEGIN
                FOR r IN select table_schema, table_name
                  FROM information_schema.tables
                  WHERE
                    table_schema NOT IN ('pg_catalog', 'information_schema')
                  AND table_type = 'BASE TABLE'
                  AND table_schema = 'public'
                  AND table_name not like 'grit42%'
                  AND table_name not like 'tmp%'
                  AND table_name not like '%aud$%'
                  AND table_name not like 'load_%'
                  AND table_name not in ('audit_trail_generic', 'schema_migrations', 'mm_schema_information', 'experiment_result_set_files', 'blob_values', 'mol_molecules')
                LOOP
                    EXECUTE 'CREATE OR REPLACE TRIGGER '
                || quote_ident(r.table_name || '_audtrg')
                || ' AFTER INSERT OR UPDATE OR DELETE ON '
                || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name)
                || ' FOR EACH ROW EXECUTE FUNCTION audit_generic_log()';
                END LOOP;
              RETURN 'OK';
            END;
            $_$;


--
-- Name: manage_stamps(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.manage_stamps() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
      	IF (TG_OP = 'INSERT') THEN
              IF NEW.created_at IS NULL THEN
      			NEW.created_at = CURRENT_TIMESTAMP;
      		END IF;
      		IF NEW.created_by IS NULL THEN
      			NEW.created_by = 'SYSTEM';
      		END IF;
      	ELSIF (TG_OP = 'UPDATE') THEN
      		IF NEW.updated_at IS NULL THEN
      			NEW.updated_at = CURRENT_TIMESTAMP;
      		END IF;
      		IF NEW.updated_by IS NULL THEN
      			NEW.updated_by = 'SYSTEM';
      		END IF;
      	END IF;
      	RETURN NEW;
      END
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ar_internal_metadata; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ar_internal_metadata (
    key character varying NOT NULL,
    value character varying,
    created_at timestamp(6) without time zone NOT NULL,
    updated_at timestamp(6) without time zone NOT NULL
);


--
-- Name: audit_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_trail_generic; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_trail_generic (
    id bigint DEFAULT nextval('public.audit_seq'::regclass) NOT NULL,
    chgtime timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    action character varying(1) NOT NULL,
    username character varying NOT NULL,
    table_name character varying NOT NULL,
    record_id integer NOT NULL,
    row_data jsonb NOT NULL,
    CONSTRAINT audit_trial_generic_action_check CHECK (((action)::text = ANY (ARRAY[('I'::character varying)::text, ('U'::character varying)::text, ('D'::character varying)::text])))
);


--
-- Name: grit_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grit_seq
    START WITH 10000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: grit_core_countries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_countries (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    iso character varying NOT NULL
);


--
-- Name: grit_core_data_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_data_types (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    is_entity boolean DEFAULT false,
    table_name character varying,
    description text
);


--
-- Name: grit_core_load_set_loaded_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_load_set_loaded_records (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    "table" character varying NOT NULL,
    record_id bigint NOT NULL,
    load_set_id bigint
);


--
-- Name: grit_core_load_set_loading_record_property_values; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_load_set_loading_record_property_values (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying,
    numeric_sign character varying,
    string_value character varying,
    integer_value integer,
    decimal_value numeric,
    float_value double precision,
    text_value text,
    datetime_value timestamp(6) without time zone DEFAULT NULL::timestamp without time zone,
    date_value date,
    boolean_value boolean,
    entity_id_value bigint,
    load_set_id bigint NOT NULL,
    load_set_loading_record_id bigint NOT NULL
);


--
-- Name: grit_core_load_set_loading_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_load_set_loading_records (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    number integer,
    load_set_id bigint NOT NULL
);


--
-- Name: grit_core_load_set_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_load_set_statuses (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    description character varying
);


--
-- Name: grit_core_load_sets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_load_sets (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    entity character varying NOT NULL,
    process_start timestamp(6) without time zone,
    process_end timestamp(6) without time zone,
    data bytea NOT NULL,
    parsed_data jsonb DEFAULT '[]'::jsonb NOT NULL,
    mappings json,
    record_errors json,
    item_count integer,
    status_id bigint NOT NULL,
    origin_id bigint NOT NULL,
    record_warnings json,
    separator character varying
);


--
-- Name: grit_core_locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_locations (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    print_address text,
    country_id bigint NOT NULL,
    origin_id bigint NOT NULL
);


--
-- Name: grit_core_origins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_origins (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    domain character varying,
    status character varying
);


--
-- Name: grit_core_publication_statuses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_publication_statuses (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    description text
);


--
-- Name: grit_core_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_roles (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    description text
);


--
-- Name: grit_core_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_units (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    abbreviation character varying NOT NULL,
    unit_type character varying,
    si_unit character varying
);


--
-- Name: grit_core_user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_user_roles (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    user_id bigint NOT NULL,
    role_id bigint NOT NULL
);


--
-- Name: grit_core_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grit_core_users (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying,
    email character varying,
    login character varying,
    crypted_password character varying,
    password_salt character varying,
    persistence_token character varying,
    single_access_token character varying,
    perishable_token character varying,
    login_count integer DEFAULT 0 NOT NULL,
    failed_login_count integer DEFAULT 0 NOT NULL,
    last_request_at timestamp(6) without time zone,
    current_login_at timestamp(6) without time zone,
    last_login_at timestamp(6) without time zone,
    current_login_ip character varying,
    last_login_ip character varying,
    active boolean DEFAULT false,
    activation_token character varying,
    forgot_token character varying,
    two_factor boolean,
    two_factor_token character varying,
    two_factor_expiry timestamp(6) without time zone,
    settings jsonb DEFAULT '{}'::jsonb,
    origin_id bigint NOT NULL,
    location_id bigint
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: test_entities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.test_entities (
    id bigint DEFAULT nextval('public.grit_seq'::regclass) NOT NULL,
    created_by character varying(30) DEFAULT 'SYSTEM'::character varying NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by character varying(30),
    updated_at timestamp(6) without time zone,
    name character varying NOT NULL,
    another_string character varying,
    "integer" integer,
    "decimal" numeric,
    "float" double precision,
    text text,
    datetime timestamp(6) without time zone,
    date date,
    "boolean" boolean,
    user_id bigint
);


--
-- Name: ar_internal_metadata ar_internal_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ar_internal_metadata
    ADD CONSTRAINT ar_internal_metadata_pkey PRIMARY KEY (key);


--
-- Name: audit_trail_generic audit_trail_generic_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_trail_generic
    ADD CONSTRAINT audit_trail_generic_pkey PRIMARY KEY (id);


--
-- Name: grit_core_countries grit_core_countries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_countries
    ADD CONSTRAINT grit_core_countries_pkey PRIMARY KEY (id);


--
-- Name: grit_core_data_types grit_core_data_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_data_types
    ADD CONSTRAINT grit_core_data_types_pkey PRIMARY KEY (id);


--
-- Name: grit_core_load_set_loaded_records grit_core_load_set_loaded_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_set_loaded_records
    ADD CONSTRAINT grit_core_load_set_loaded_records_pkey PRIMARY KEY (id);


--
-- Name: grit_core_load_set_loading_record_property_values grit_core_load_set_loading_record_property_values_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_set_loading_record_property_values
    ADD CONSTRAINT grit_core_load_set_loading_record_property_values_pkey PRIMARY KEY (id);


--
-- Name: grit_core_load_set_loading_records grit_core_load_set_loading_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_set_loading_records
    ADD CONSTRAINT grit_core_load_set_loading_records_pkey PRIMARY KEY (id);


--
-- Name: grit_core_load_set_statuses grit_core_load_set_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_set_statuses
    ADD CONSTRAINT grit_core_load_set_statuses_pkey PRIMARY KEY (id);


--
-- Name: grit_core_load_sets grit_core_load_sets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_sets
    ADD CONSTRAINT grit_core_load_sets_pkey PRIMARY KEY (id);


--
-- Name: grit_core_locations grit_core_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_locations
    ADD CONSTRAINT grit_core_locations_pkey PRIMARY KEY (id);


--
-- Name: grit_core_origins grit_core_origins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_origins
    ADD CONSTRAINT grit_core_origins_pkey PRIMARY KEY (id);


--
-- Name: grit_core_publication_statuses grit_core_publication_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_publication_statuses
    ADD CONSTRAINT grit_core_publication_statuses_pkey PRIMARY KEY (id);


--
-- Name: grit_core_roles grit_core_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_roles
    ADD CONSTRAINT grit_core_roles_pkey PRIMARY KEY (id);


--
-- Name: grit_core_units grit_core_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_units
    ADD CONSTRAINT grit_core_units_pkey PRIMARY KEY (id);


--
-- Name: grit_core_user_roles grit_core_user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_user_roles
    ADD CONSTRAINT grit_core_user_roles_pkey PRIMARY KEY (id);


--
-- Name: grit_core_users grit_core_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_users
    ADD CONSTRAINT grit_core_users_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: test_entities test_entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_entities
    ADD CONSTRAINT test_entities_pkey PRIMARY KEY (id);


--
-- Name: idx_countries_on_iso_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_countries_on_iso_unique ON public.grit_core_countries USING btree (iso);


--
-- Name: idx_countries_on_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_countries_on_name_unique ON public.grit_core_countries USING btree (name);


--
-- Name: idx_locations_on_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_locations_on_name_unique ON public.grit_core_locations USING btree (name);


--
-- Name: idx_on_load_set_id_b4686def04; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_on_load_set_id_b4686def04 ON public.grit_core_load_set_loading_record_property_values USING btree (load_set_id);


--
-- Name: idx_on_load_set_loading_record_id_c95f80162e; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_on_load_set_loading_record_id_c95f80162e ON public.grit_core_load_set_loading_record_property_values USING btree (load_set_loading_record_id);


--
-- Name: idx_origins_on_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_origins_on_name_unique ON public.grit_core_origins USING btree (name);


--
-- Name: idx_publication_statuses_on_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_publication_statuses_on_name_unique ON public.grit_core_publication_statuses USING btree (name);


--
-- Name: idx_roles_on_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_roles_on_name_unique ON public.grit_core_roles USING btree (name);


--
-- Name: idx_units_on_abbreviation_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_units_on_abbreviation_unique ON public.grit_core_units USING btree (abbreviation);


--
-- Name: idx_units_on_name_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_units_on_name_unique ON public.grit_core_units USING btree (name);


--
-- Name: index_grit_core_data_types_on_name; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_grit_core_data_types_on_name ON public.grit_core_data_types USING btree (name);


--
-- Name: index_grit_core_load_set_loaded_records_on_load_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_load_set_loaded_records_on_load_set_id ON public.grit_core_load_set_loaded_records USING btree (load_set_id);


--
-- Name: index_grit_core_load_set_loading_records_on_load_set_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_load_set_loading_records_on_load_set_id ON public.grit_core_load_set_loading_records USING btree (load_set_id);


--
-- Name: index_grit_core_load_sets_on_origin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_load_sets_on_origin_id ON public.grit_core_load_sets USING btree (origin_id);


--
-- Name: index_grit_core_load_sets_on_status_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_load_sets_on_status_id ON public.grit_core_load_sets USING btree (status_id);


--
-- Name: index_grit_core_locations_on_country_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_locations_on_country_id ON public.grit_core_locations USING btree (country_id);


--
-- Name: index_grit_core_locations_on_origin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_locations_on_origin_id ON public.grit_core_locations USING btree (origin_id);


--
-- Name: index_grit_core_user_roles_on_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_user_roles_on_role_id ON public.grit_core_user_roles USING btree (role_id);


--
-- Name: index_grit_core_user_roles_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_user_roles_on_user_id ON public.grit_core_user_roles USING btree (user_id);


--
-- Name: index_grit_core_users_on_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_grit_core_users_on_email ON public.grit_core_users USING btree (email);


--
-- Name: index_grit_core_users_on_location_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_users_on_location_id ON public.grit_core_users USING btree (location_id);


--
-- Name: index_grit_core_users_on_login; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_grit_core_users_on_login ON public.grit_core_users USING btree (login);


--
-- Name: index_grit_core_users_on_origin_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_grit_core_users_on_origin_id ON public.grit_core_users USING btree (origin_id);


--
-- Name: index_grit_core_users_on_perishable_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_grit_core_users_on_perishable_token ON public.grit_core_users USING btree (perishable_token);


--
-- Name: index_grit_core_users_on_persistence_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_grit_core_users_on_persistence_token ON public.grit_core_users USING btree (persistence_token);


--
-- Name: index_grit_core_users_on_single_access_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX index_grit_core_users_on_single_access_token ON public.grit_core_users USING btree (single_access_token);


--
-- Name: index_test_entities_on_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX index_test_entities_on_user_id ON public.test_entities USING btree (user_id);


--
-- Name: grit_core_countries manage_stamps_grit_core_countries; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_countries BEFORE INSERT OR UPDATE ON public.grit_core_countries FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_data_types manage_stamps_grit_core_data_types; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_data_types BEFORE INSERT OR UPDATE ON public.grit_core_data_types FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_load_set_loaded_records manage_stamps_grit_core_load_set_loaded_records; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_load_set_loaded_records BEFORE INSERT OR UPDATE ON public.grit_core_load_set_loaded_records FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_load_set_loading_record_property_values manage_stamps_grit_core_load_set_loading_record_property_values; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_load_set_loading_record_property_values BEFORE INSERT OR UPDATE ON public.grit_core_load_set_loading_record_property_values FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_load_set_loading_records manage_stamps_grit_core_load_set_loading_records; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_load_set_loading_records BEFORE INSERT OR UPDATE ON public.grit_core_load_set_loading_records FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_load_set_statuses manage_stamps_grit_core_load_set_statuses; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_load_set_statuses BEFORE INSERT OR UPDATE ON public.grit_core_load_set_statuses FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_load_sets manage_stamps_grit_core_load_sets; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_load_sets BEFORE INSERT OR UPDATE ON public.grit_core_load_sets FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_locations manage_stamps_grit_core_locations; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_locations BEFORE INSERT OR UPDATE ON public.grit_core_locations FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_origins manage_stamps_grit_core_origins; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_origins BEFORE INSERT OR UPDATE ON public.grit_core_origins FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_publication_statuses manage_stamps_grit_core_publication_statuses; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_publication_statuses BEFORE INSERT OR UPDATE ON public.grit_core_publication_statuses FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_roles manage_stamps_grit_core_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_roles BEFORE INSERT OR UPDATE ON public.grit_core_roles FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_units manage_stamps_grit_core_units; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_units BEFORE INSERT OR UPDATE ON public.grit_core_units FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_user_roles manage_stamps_grit_core_user_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_user_roles BEFORE INSERT OR UPDATE ON public.grit_core_user_roles FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_users manage_stamps_grit_core_users; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER manage_stamps_grit_core_users BEFORE INSERT OR UPDATE ON public.grit_core_users FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();


--
-- Name: grit_core_load_set_loaded_records core_load_set_loaded_records_core_load_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_set_loaded_records
    ADD CONSTRAINT core_load_set_loaded_records_core_load_set_id_fkey FOREIGN KEY (load_set_id) REFERENCES public.grit_core_load_sets(id);


--
-- Name: grit_core_load_set_loading_record_property_values core_load_set_loading_record_property_values_core_load_set_id_f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_set_loading_record_property_values
    ADD CONSTRAINT core_load_set_loading_record_property_values_core_load_set_id_f FOREIGN KEY (load_set_id) REFERENCES public.grit_core_load_sets(id);


--
-- Name: grit_core_load_set_loading_records core_load_set_loading_records_core_load_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_set_loading_records
    ADD CONSTRAINT core_load_set_loading_records_core_load_set_id_fkey FOREIGN KEY (load_set_id) REFERENCES public.grit_core_load_sets(id);


--
-- Name: grit_core_load_set_loading_record_property_values core_load_set_loading_records_core_load_set_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_set_loading_record_property_values
    ADD CONSTRAINT core_load_set_loading_records_core_load_set_id_fkey FOREIGN KEY (load_set_loading_record_id) REFERENCES public.grit_core_load_set_loading_records(id);


--
-- Name: grit_core_load_sets core_load_sets_core_load_set_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_sets
    ADD CONSTRAINT core_load_sets_core_load_set_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.grit_core_load_set_statuses(id);


--
-- Name: grit_core_load_sets core_load_sets_core_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_load_sets
    ADD CONSTRAINT core_load_sets_core_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.grit_core_origins(id);


--
-- Name: grit_core_locations core_locations_core_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_locations
    ADD CONSTRAINT core_locations_core_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.grit_core_countries(id);


--
-- Name: grit_core_locations core_locations_core_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_locations
    ADD CONSTRAINT core_locations_core_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.grit_core_origins(id);


--
-- Name: grit_core_user_roles core_user_roles_core_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_user_roles
    ADD CONSTRAINT core_user_roles_core_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.grit_core_roles(id);


--
-- Name: grit_core_user_roles core_user_roles_core_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_user_roles
    ADD CONSTRAINT core_user_roles_core_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.grit_core_users(id);


--
-- Name: grit_core_users core_users_core_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_users
    ADD CONSTRAINT core_users_core_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.grit_core_locations(id);


--
-- Name: grit_core_users core_users_core_origin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grit_core_users
    ADD CONSTRAINT core_users_core_origin_id_fkey FOREIGN KEY (origin_id) REFERENCES public.grit_core_origins(id);


--
-- Name: test_entities test; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.test_entities
    ADD CONSTRAINT test FOREIGN KEY (user_id) REFERENCES public.grit_core_users(id);


--
-- PostgreSQL database dump complete
--

SET search_path TO "$user", public;

INSERT INTO "schema_migrations" (version) VALUES
('20250522140707'),
('20250521124829'),
('20250411144141'),
('20250411045043'),
('20250408050849'),
('20250326121851'),
('20250205130307'),
('20250205093246'),
('20250109121325'),
('20241212062610'),
('20241212062036'),
('20241212062035'),
('20241212062034'),
('20241212061707'),
('20241104161825'),
('20241104160815'),
('20241104160507'),
('20241104142644'),
('20241104142643'),
('20241104141757'),
('20241104141756'),
('20241104141755'),
('20241104141754');

