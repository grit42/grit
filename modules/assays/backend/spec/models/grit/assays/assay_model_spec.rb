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

module Grit::Assays
  RSpec.describe AssayModel, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:published_status) { create(:grit_core_publication_status, :published) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }

    before do
      Grit::Core::UserSession.create(admin)
    end

    let(:draft_model) do
      create(:grit_assays_assay_model, :draft,
        name: "Draft Kinase Assay",
        assay_type: biochemical
      )
    end

    let(:published_model) do
      create(:grit_assays_assay_model, :published,
        name: "Published Cell Viability Assay",
        assay_type: create(:grit_assays_assay_type, :cellular)
      )
    end

    # --- Factories ---

    describe "factories" do
      it "creates records correctly" do
        expect(draft_model).not_to be_nil
        expect(published_model).not_to be_nil
        expect(draft_model.name).to eq("Draft Kinase Assay")
        expect(published_model.name).to eq("Published Cell Viability Assay")
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to assay_type" do
        expect(draft_model.assay_type).to eq(biochemical)
      end

      it "belongs to publication_status" do
        expect(draft_model.publication_status.name).to eq("Draft")
        expect(published_model.publication_status.name).to eq("Published")
      end

      it "has many assay_model_metadata" do
        expect(draft_model).to respond_to(:assay_model_metadata)
        expect(draft_model.assay_model_metadata).to be_a(ActiveRecord::Associations::CollectionProxy)
      end

      it "has many assay_data_sheet_definitions" do
        create(:grit_assays_assay_data_sheet_definition, assay_model: draft_model, sort: 1)
        create(:grit_assays_assay_data_sheet_definition, assay_model: draft_model, sort: 2)
        expect(draft_model.assay_data_sheet_definitions.count).to eq(2)
      end

      it "has many experiments" do
        expect(draft_model).to respond_to(:experiments)
        expect(draft_model.experiments).to be_a(ActiveRecord::Associations::CollectionProxy)
      end
    end

    # --- Validations ---

    describe "validations" do
      it "requires name" do
        model = AssayModel.new(
          assay_type: biochemical,
          publication_status: draft_status
        )
        expect(model).not_to be_valid
        expect(model.errors[:name]).to include("can't be blank")
      end

      it "requires assay_type" do
        model = AssayModel.new(
          name: "Test Model",
          publication_status: draft_status
        )
        expect(model).not_to be_valid
        expect(model.errors[:assay_type]).to include("must exist")
      end
    end

    # --- Publication Status Callback ---

    describe "publication status callbacks" do
      it "draft model can be modified" do
        draft_model.name = "Updated Draft Name"
        expect(draft_model.save).to be true
        expect(draft_model.reload.name).to eq("Updated Draft Name")
      end

      it "published model cannot be modified" do
        expect {
          published_model.update!(name: "Cannot Change This")
        }.to raise_error(RuntimeError)
      end

      it "published model can change publication_status" do
        published_model.publication_status = draft_status
        expect(published_model.save).to be true
      end
    end

    # --- Create/Drop Tables ---

    describe "create/drop tables" do
      it "create_tables creates dynamic tables for each sheet definition" do
        model = AssayModel.create!(
          name: "Table Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        integer_type = create(:grit_core_data_type, :integer)
        AssayDataSheetColumn.create!(
          name: "Test Column",
          safe_name: "test_column",
          assay_data_sheet_definition: sheet,
          data_type: integer_type,
          sort: 1,
          required: false
        )

        model.reload

        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be false

        model.create_tables

        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        model.drop_tables
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be false

        model.destroy
      end

      it "drop_tables removes dynamic tables for each sheet definition" do
        model = AssayModel.create!(
          name: "Drop Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Drop Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        model.reload

        model.create_tables
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        model.drop_tables
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be false

        model.destroy
      end

      it "before_destroy callback drops tables" do
        model = AssayModel.create!(
          name: "Destroy Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Destroy Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        table_name = sheet.table_name
        model.reload
        model.create_tables
        expect(ActiveRecord::Base.connection.table_exists?(table_name)).to be true

        model.destroy

        expect(ActiveRecord::Base.connection.table_exists?(table_name)).to be false
      end
    end

    # --- Scopes ---

    describe "scopes" do
      it "published scope filters by publication status" do
        expect(AssayModel).to respond_to(:published)

        # Ensure at least one published model exists
        published_model

        published_count = AssayModel.joins(:publication_status)
          .where("grit_core_publication_statuses.name = ?", "Published").count
        expect(published_count).to be > 0
      end
    end

    # --- Dependent Destroy ---

    describe "dependent destroy" do
      it "destroying model destroys dependent sheet definitions" do
        model = AssayModel.create!(
          name: "Dependent Destroy Test",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Dependent Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        sheet_id = sheet.id

        model.destroy

        expect(AssayDataSheetDefinition.exists?(sheet_id)).to be false
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = AssayModel.entity_crud

        expect(crud[:create]).to include("Administrator")
        expect(crud[:create]).to include("AssayAdministrator")
        expect(crud[:update]).to include("Administrator")
        expect(crud[:update]).to include("AssayAdministrator")
        expect(crud[:destroy]).to include("Administrator")
        expect(crud[:destroy]).to include("AssayAdministrator")
      end
    end
  end
end
