# Filter sequences related to load set block tables
Rake::Task["db:schema:dump"].enhance do
  file = Rails.root.join("db/structure.sql")
  content = File.read(file)

  dynamic_sequences = content
    .scan(/(?:CREATE|ALTER) SEQUENCE ((?:\w+\.)?(?:lsb|raw_lsb)_\w+)\b/)
    .flatten
    .uniq

  cleaned = content.dup
  dynamic_sequences.each do |seq|
    bare = seq.sub(/^\w+\./, "")
    comment = /\n\n--\n-- Name: #{Regexp.escape(bare)}; Type: SEQUENCE[^\n]*\n--\n\n/
    cleaned.gsub!(/#{comment.source}CREATE SEQUENCE #{Regexp.escape(seq)}[^;]+;\n?/, "")
    cleaned.gsub!(/#{comment.source}ALTER SEQUENCE #{Regexp.escape(seq)}[^;]+;\n?/, "")
  end

  File.write(file, cleaned)
end
