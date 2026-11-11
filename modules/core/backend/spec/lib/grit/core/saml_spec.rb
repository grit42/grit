#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

require "rails_helper"
require "omniauth-saml"

RSpec.describe Grit::Core::Saml do
  def with_env(vars)
    previous = vars.keys.to_h { |key| [ key, ENV[key] ] }
    vars.each { |key, value| ENV[key] = value }
    yield
  ensure
    previous.each { |key, value| ENV[key] = value }
  end

  around do |example|
    with_env("GRIT_SERVER_URL" => "https://grit.example.com", "SAML_SP_ENTITY_ID" => nil, "SAML_ACS_URL" => nil, "SAML_EMAIL_ATTRIBUTE" => nil) { example.run }
  end

  describe ".sp_options" do
    it "derives our entity id and callback URL from GRIT_SERVER_URL" do
      expect(described_class.sp_options).to include(
        sp_entity_id: "https://grit.example.com/api/grit/core/auth/saml/metadata",
        assertion_consumer_service_url: "https://grit.example.com/api/grit/core/auth/saml/callback",
        name_identifier_format: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
      )
    end

    it "keeps the old Animals app's entity id and callback URL when configured" do
      with_env("SAML_SP_ENTITY_ID" => "https://animals.example.com/saml/metadata", "SAML_ACS_URL" => "https://animals.example.com/saml/consume") do
        expect(described_class.sp_options).to include(
          sp_entity_id: "https://animals.example.com/saml/metadata",
          assertion_consumer_service_url: "https://animals.example.com/saml/consume"
        )
      end
    end

    it "looks for the e-mail in the configured attribute first" do
      with_env("SAML_EMAIL_ATTRIBUTE" => "urn:company:mail") do
        expect(described_class.sp_options[:attribute_statements][:email].first).to eq("urn:company:mail")
      end
    end

    it "needs GRIT_SERVER_URL without explicit URLs" do
      with_env("GRIT_SERVER_URL" => nil) do
        expect { described_class.sp_options }.to raise_error(/GRIT_SERVER_URL/)
      end
    end
  end

  describe ".idp_options" do
    let(:parser) { instance_double(OneLogin::RubySaml::IdpMetadataParser) }

    before do
      described_class.expire_idp_options!
      allow(OneLogin::RubySaml::IdpMetadataParser).to receive(:new).and_return(parser)
      allow(parser).to receive(:parse_remote_to_hash).and_return(idp_sso_service_url: "https://idp.example.com/sso", idp_cert: "CERT", idp_slo_service_url: "ignored")
    end

    after { described_class.expire_idp_options! }

    it "fetches the IdP's metadata once and caches it" do
      with_env("SAML_IDP_METADATA_URL" => "https://idp.example.com/metadata") do
        2.times { expect(described_class.idp_options).to eq(idp_sso_service_url: "https://idp.example.com/sso", idp_cert: "CERT") }
      end

      expect(parser).to have_received(:parse_remote_to_hash).once
        .with("https://idp.example.com/metadata", true, name_id_format: Grit::Core::Saml::EMAIL_NAME_ID_FORMAT)
    end

    it "fetches it again after it expired (a failed login)" do
      with_env("SAML_IDP_METADATA_URL" => "https://idp.example.com/metadata") do
        described_class.idp_options
        described_class.expire_idp_options!
        described_class.idp_options
      end

      expect(parser).to have_received(:parse_remote_to_hash).twice
    end
  end

  describe ".email_from" do
    it "prefers the e-mail attribute, lower-cased" do
      expect(described_class.email_from("uid" => "x@example.com", "info" => { "email" => "Jane@Example.com" })).to eq("jane@example.com")
    end

    it "falls back to an e-mail NameID" do
      expect(described_class.email_from("uid" => "Jane@Example.com", "info" => {})).to eq("jane@example.com")
    end

    it "ignores a NameID that isn't an e-mail" do
      expect(described_class.email_from("uid" => "_a1b2c3", "info" => {})).to be_nil
    end
  end

  describe Grit::Core::Saml::LegacyPaths do
    let(:seen) { [] }
    let(:middleware) { described_class.new(->(env) { seen << [ env["REQUEST_METHOD"], env["PATH_INFO"] ]; [ 200, {}, [] ] }) }

    def call(method, path)
      middleware.call(Rack::MockRequest.env_for(path, method: method))
    end

    it "handles the old callback as the new one" do
      call("POST", "/saml/consume")
      expect(seen).to eq([ [ "POST", "/api/grit/core/auth/saml/callback" ] ])
    end

    it "serves our metadata on the old path, also for the old app's POST" do
      call("POST", "/saml/metadata")
      expect(seen).to eq([ [ "GET", "/api/grit/core/auth/saml/metadata" ] ])
    end

    it "sends the old login link to the login page" do
      status, headers, = call("GET", "/saml/init")
      expect([ status, headers["location"] ]).to eq([ 302, "/app/core/authenticate" ])
      expect(seen).to be_empty
    end

    it "leaves other paths alone" do
      call("GET", "/api/grit/core/user_session")
      expect(seen).to eq([ [ "GET", "/api/grit/core/user_session" ] ])
    end
  end

  # The OmniAuth SAML strategy with our settings, against responses signed by
  # a test IdP: only a correctly signed response for us logs in.
  describe "validating IdP responses" do
    let(:idp_key) { OpenSSL::PKey::RSA.new(2048) }
    let(:idp_cert) do
      cert = OpenSSL::X509::Certificate.new
      cert.version = 2
      cert.serial = 1
      cert.subject = cert.issuer = OpenSSL::X509::Name.parse("/CN=Test IdP")
      cert.public_key = idp_key.public_key
      cert.not_before = Time.now - 60
      cert.not_after = Time.now + 3600
      cert.sign(idp_key, OpenSSL::Digest.new("SHA256"))
      cert
    end
    let(:idp_entity_id) { "https://idp.example.com" }
    let(:acs_url) { "https://grit.example.com/api/grit/core/auth/saml/callback" }
    let(:sp_entity_id) { "https://grit.example.com/api/grit/core/auth/saml/metadata" }

    let(:app) do
      sp_options = described_class.sp_options
      Rack::Builder.new do
        use(Class.new do
          def initialize(app) = @app = app
          def call(env) = @app.call(env.merge("rack.session" => {}))
        end)
        use OmniAuth::Builder do
          provider :saml, name: :saml, path_prefix: "/api/grit/core/auth", **sp_options,
            setup: ->(env) { env["omniauth.strategy"].options.merge!(Grit::Core::Saml.idp_options) }
        end
        run ->(env) { [ 200, {}, [ Grit::Core::Saml.email_from(env["omniauth.auth"]) ] ] }
      end
    end

    before do
      allow(described_class).to receive(:idp_options)
        .and_return(idp_entity_id: idp_entity_id, idp_sso_service_url: "#{idp_entity_id}/sso", idp_cert: idp_cert.to_pem)
    end

    def response_xml(email: "jane@example.com", audience: sp_entity_id)
      now = Time.now.utc
      <<~XML.gsub(/>\s+</, "><")
        <samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
          ID="_response" Version="2.0" IssueInstant="#{now.iso8601}" Destination="#{acs_url}">
          <saml:Issuer>#{idp_entity_id}</saml:Issuer>
          <samlp:Status><samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/></samlp:Status>
          <saml:Assertion ID="_assertion" Version="2.0" IssueInstant="#{now.iso8601}">
            <saml:Issuer>#{idp_entity_id}</saml:Issuer>
            <saml:Subject>
              <saml:NameID Format="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">_transient</saml:NameID>
              <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
                <saml:SubjectConfirmationData NotOnOrAfter="#{(now + 300).iso8601}" Recipient="#{acs_url}"/>
              </saml:SubjectConfirmation>
            </saml:Subject>
            <saml:Conditions NotBefore="#{(now - 60).iso8601}" NotOnOrAfter="#{(now + 300).iso8601}">
              <saml:AudienceRestriction><saml:Audience>#{audience}</saml:Audience></saml:AudienceRestriction>
            </saml:Conditions>
            <saml:AuthnStatement AuthnInstant="#{now.iso8601}" SessionIndex="_session">
              <saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:Password</saml:AuthnContextClassRef></saml:AuthnContext>
            </saml:AuthnStatement>
            <saml:AttributeStatement>
              <saml:Attribute Name="email"><saml:AttributeValue>#{email}</saml:AttributeValue></saml:Attribute>
            </saml:AttributeStatement>
          </saml:Assertion>
        </samlp:Response>
      XML
    end

    def signed(xml)
      document = XMLSecurity::Document.new(xml)
      document.sign_document(idp_key, idp_cert, XMLSecurity::Document::RSA_SHA256, XMLSecurity::Document::SHA256)
      document.to_s
    end

    def post_response(xml)
      Rack::MockRequest.new(app).post("/api/grit/core/auth/saml/callback", params: { "SAMLResponse" => Base64.strict_encode64(xml) })
    end

    def failure_message(response)
      Rack::Utils.parse_query(URI.parse(response.location).query)["message"]
    end

    it "accepts a response signed by the IdP" do
      response = post_response(signed(response_xml))

      expect(response.status).to eq(200)
      expect(response.body).to eq("jane@example.com")
    end

    it "rejects a signed response altered afterwards" do
      tampered = signed(response_xml).sub("jane@example.com", "admin@example.com")

      expect(failure_message(post_response(tampered))).to eq("invalid_ticket")
    end

    it "rejects an unsigned response" do
      expect(failure_message(post_response(response_xml))).to eq("invalid_ticket")
    end

    it "rejects a response signed by another key" do
      other_key = OpenSSL::PKey::RSA.new(2048)
      document = XMLSecurity::Document.new(response_xml)
      document.sign_document(other_key, idp_cert, XMLSecurity::Document::RSA_SHA256, XMLSecurity::Document::SHA256)

      expect(failure_message(post_response(document.to_s))).to eq("invalid_ticket")
    end

    it "rejects a response meant for another service" do
      expect(failure_message(post_response(signed(response_xml(audience: "https://other.example.com"))))).to eq("invalid_ticket")
    end
  end
end
