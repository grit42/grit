# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/assays.
#
# @grit42/assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/assays. If not, see <https://www.gnu.org/licenses/>.

require "rails_helper"
require "zip"

module Grit::Assays
  RSpec.describe "ExperimentAttachments API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
    let(:experiment) { create(:grit_assays_experiment) }
    let(:base_path) { "/api/grit/assays/experiments/#{experiment.id}/experiment_attachments" }

    before { login_as(admin) }

    # Creates a Tempfile with the given extension so Marcel can use the name as a hint.
    def make_upload(content, extension, content_type = "application/octet-stream")
      tmp = Tempfile.new([ "test_upload", extension ])
      tmp.binmode
      tmp.write(content)
      tmp.rewind
      Rack::Test::UploadedFile.new(tmp.path, content_type, true)
    end

    describe "POST (upload)" do
      context "with a valid CSV file" do
        it "returns success and attaches the file" do
          file = make_upload("col1,col2\nval1,val2", ".csv", "text/csv")
          post base_path, params: { files: [ file ] }
          expect(response).to have_http_status(:ok)
          expect(JSON.parse(response.body)["success"]).to be true
          expect(experiment.attached_files.reload.count).to eq(1)
        end
      end

      context "with an HTML file" do
        it "returns 422, reports a disallowed type, and does not attach" do
          # Marcel detects text/html from the <html> prefix regardless of declared type
          file = make_upload("<html><body><script>xss()</script></body></html>", ".html")
          post base_path, params: { files: [ file ] }
          expect(response).to have_http_status(:unprocessable_entity)
          body = JSON.parse(response.body)
          expect(body["success"]).to be false
          expect(body["errors"]).to include("disallowed file type")
          expect(experiment.attached_files.reload.count).to eq(0)
        end
      end

      context "with a JavaScript file" do
        it "returns 422 for a .js file" do
          # Marcel detects application/javascript from the .js extension
          file = make_upload("alert('xss')", ".js")
          post base_path, params: { files: [ file ] }
          expect(response).to have_http_status(:unprocessable_entity)
          expect(JSON.parse(response.body)["errors"]).to include("disallowed file type")
        end
      end

      context "with a file exceeding the per-file size limit" do
        it "returns 422 with a size error" do
          file = make_upload("col1,col2\n1,2", ".csv", "text/csv")
          allow_any_instance_of(ActionDispatch::Http::UploadedFile)
            .to receive(:size).and_return(Experiment::MAX_ATTACHMENT_SIZE + 1)
          post base_path, params: { files: [ file ] }
          expect(response).to have_http_status(:unprocessable_entity)
          expect(JSON.parse(response.body)["errors"]).to include("exceeds")
        end
      end

      context "with a duplicate filename" do
        before do
          experiment.attached_files.attach(
            io: StringIO.new("existing data"),
            filename: "existing.csv",
            content_type: "text/csv"
          )
        end

        it "returns 422 when re-uploading a file with the same name" do
          file = make_upload("new data", ".csv", "text/csv")
          # Rename temp file to match existing
          existing_file = Rack::Test::UploadedFile.new(
            file.path, "text/csv", true
          )
          # Use params with original_filename matching the existing attachment
          allow_any_instance_of(ActionDispatch::Http::UploadedFile)
            .to receive(:original_filename).and_return("existing.csv")
          post base_path, params: { files: [ file ] }
          expect(response).to have_http_status(:unprocessable_entity)
          expect(JSON.parse(response.body)["errors"]).to include("same name")
        end
      end
    end

    describe "GET /export" do
      before do
        experiment.attached_files.attach(
          io: StringIO.new("col1,col2\n1,2"),
          filename: "results.csv",
          content_type: "text/csv"
        )
      end

      it "sets X-Content-Type-Options: nosniff" do
        attachment_id = experiment.attached_files.first.id
        get "#{base_path}/export", params: { ids: attachment_id.to_s }
        expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
      end

      it "sends single file as an attachment with correct disposition" do
        attachment_id = experiment.attached_files.first.id
        get "#{base_path}/export", params: { ids: attachment_id.to_s }
        expect(response.headers["Content-Disposition"]).to include("attachment")
      end

      context "when a stored filename contains path traversal characters" do
        before do
          # Attach directly (bypassing controller MIME check) to test the ZIP layer
          experiment.attached_files.attach(
            io: StringIO.new("evil"),
            filename: "../../etc/passwd",
            content_type: "text/plain"
          )
        end

        it "sanitizes ZIP entry names to remove path traversal sequences" do
          get "#{base_path}/export"
          expect(response).to have_http_status(:ok)

          zip_entries = []
          Zip::InputStream.open(StringIO.new(response.body)) do |zis|
            while (entry = zis.get_next_entry)
              zip_entries << entry.name
            end
          end

          # No path component of any entry should be ".." — that would escape the directory
          zip_entries.each do |entry|
            expect(entry.split("/")).not_to include("..")
          end

          # The malicious filename should appear, sanitized (/ replaced by -)
          expect(zip_entries).to include(a_string_including("passwd"))
        end
      end
    end

    describe "GET /index" do
      it "sets X-Content-Type-Options: nosniff" do
        get base_path
        expect(response.headers["X-Content-Type-Options"]).to eq("nosniff")
      end
    end
  end
end
