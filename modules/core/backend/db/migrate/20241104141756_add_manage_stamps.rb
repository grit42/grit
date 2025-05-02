class AddManageStamps < ActiveRecord::Migration[7.2]
  def up
    execute <<-SQL
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
    SQL
  end

  def down
    execute "DROP FUNCTION IF EXISTS public.manage_stamps();"
  end
end
