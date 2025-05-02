class AddGritSeq < ActiveRecord::Migration[7.2]
  def up
    execute <<-SQL
      CREATE SEQUENCE public.grit_seq
          START WITH 10000
          INCREMENT BY 1
          NO MINVALUE
          NO MAXVALUE
          CACHE 1;
    SQL
  end

  def down
    execute "DROP SEQUENCE public.grit_seq;"
  end
end
