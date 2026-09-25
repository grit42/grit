Export from the running container:
docker ps                          # find the container name/id
docker cp apps/grit/server/script/assay_export.rb <container>:/tmp/assay_export.rb
docker exec -e OUTPUT=/tmp/assay_dump.json <container> bin/rails runner /tmp/assay_export.rb
docker cp <container>:/tmp/assay_dump.json ./assay_dump.json
(add -e ASSAY_MODEL_ID=123 to export just one)

Import into another (e.g. target/staging) container:
docker cp apps/grit/server/script/assay_import.rb <target-container>:/tmp/assay_import.rb
docker cp ./assay_dump.json <target-container>:/tmp/assay_dump.json
docker exec -e FILE=/tmp/assay_dump.json <target-container> bin/rails runner /tmp/assay_import.rb


Export from a local install:
cd grit/apps/grit/server
rails runner script/AssayExportImport/assay_export.rb

