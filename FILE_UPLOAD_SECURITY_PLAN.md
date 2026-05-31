# File Upload Security Hardening Plan

## Background

`SECURITY_AUDIT.md` flags experiment attachments as needing a deeper look:

> **File-upload validation:** experiment attachments — verify content-type and size limits, and that stored filenames cannot influence later file operations.

The current implementation (`ExperimentAttachmentsController#create`) attaches any file without content-type or size validation. The ZIP export uses the raw `attached_file.filename` as the ZIP entry path, which is a path traversal risk when extracting crafted archives.

Two attachment surfaces exist:
- `Experiment#attached_files` (`has_many_attached`) — arbitrary user uploads
- `LoadSetBlock#data` (`has_one_attached`) — CSV/TSV data files for bulk import

---

## Proposed Policy

| Concern | Experiment attachments | LoadSetBlock data |
|---|---|---|
| Allowed types | All except executables/scripts (blocklist) | `text/plain`, `text/csv`, `text/tab-separated-values`, `application/octet-stream` (allowlist) |
| Per-file size limit | 100 MB | 200 MB |
| Total size limit | 500 MB per experiment | — |
| MIME detection | Server-side via Marcel (not client header) | Same |

Marcel is already bundled with ActiveStorage — no new gem dependency required.

---

## Changes

### 1. `Experiment` model — content-type and size validation

**File:** `modules/assays/backend/app/models/grit/assays/experiment.rb`

Add a `validate :attached_files_are_valid` callback. On each attached blob it:

1. Opens the blob bytes and calls `Marcel::MimeType.for(io, name: blob.filename.to_s)` to detect the real MIME type, ignoring the client-supplied `Content-Type` header.
2. Rejects any type on the executable/script blocklist.
3. Rejects blobs over 100 MB, or a batch where the total exceeds 500 MB.
4. Calls `blob.update_column(:content_type, detected_type)` so the value stored in `active_storage_blobs` is the server-verified type, which makes it trustworthy for use in download headers.

Blocked MIME types (non-exhaustive starting point for team review):

```
application/x-executable        application/x-msdownload
application/x-msdos-program     application/vnd.microsoft.portable-executable
application/x-dosexec           application/x-sh
application/x-csh               application/x-bat
application/javascript          text/javascript
text/html                       application/x-httpd-php
application/x-perl              application/x-python
application/x-ruby              image/svg+xml
```

> **Discussion point:** Should we use a blocklist (permissive by default) or an allowlist (deny by default)? A blocklist is easier to live with day-to-day but harder to keep complete. An allowlist is safer but may need tuning as new file types are uploaded legitimately.

---

### 2. `ExperimentAttachmentsController` — upload path hardening

**File:** `modules/assays/backend/app/controllers/grit/assays/experiment_attachments_controller.rb`

Two changes to `create` (lines 37–64):

**a) Early request size guard** — reject before streaming to avoid memory pressure:

```ruby
if request.content_length.to_i > 510.megabytes
  render json: { success: false, errors: "Request too large" },
         status: :payload_too_large
  return
end
```

**b) Validate after attach** — `has_many_attached` validations only fire when the record is saved or `valid?` is called, not on bare `.attach()`. Wrap in a transaction so invalid blobs are rolled back:

```ruby
ActiveRecord::Base.transaction do
  record.attached_files.attach(permitted[:files])
  raise ActiveRecord::Rollback if record.invalid?
end

if record.errors[:attached_files].any?
  render json: { success: false, errors: record.errors[:attached_files].join(", ") },
         status: :unprocessable_entity
  return
end
render json: { success: true }
```

---

### 3. `LoadSetBlock` model — data file validation

**File:** `modules/core/backend/app/models/grit/core/load_set_block.rb`

Add a `validate :data_file_is_valid` callback using the narrow allowlist and 200 MB limit above. Same Marcel detection pattern as `Experiment`.

No controller change is needed here — `LoadSetBlock` is created via the generic `Writable` concern (`klass.new(params).save`), so the validation fires automatically on save.

---

### 4. ZIP path traversal fix

A filename like `../../etc/passwd` stored in `active_storage_blobs.filename` would become a dangerous ZIP entry path when a user extracts the archive.

**Files:**
- `modules/assays/backend/app/controllers/grit/assays/experiment_attachments_controller.rb` (line 128, `export_many`)
- `modules/assays/backend/app/controllers/grit/assays/experiments_controller.rb` (full-experiment ZIP export)

```ruby
# Before
entry_name = "#{record[:name]}_attachments/#{attached_file.filename}"

# After
safe_dir  = record[:name].gsub(/[\/\\:*?"<>|\r\n]/, "_")
safe_name = File.basename(attached_file.filename.to_s)
entry_name = "#{safe_dir}_attachments/#{safe_name}"
```

Apply the same `safe_dir` sanitization to `archive_filename` to keep the `Content-Disposition` response header clean.

---

### 5. `X-Content-Type-Options` response header

**File:** `modules/assays/backend/app/controllers/grit/assays/application_controller.rb`

Add a `before_action` to prevent MIME-sniffing in browsers across all assays controllers:

```ruby
before_action { response.headers["X-Content-Type-Options"] = "nosniff" }
```

`export_one` already sends `disposition: "attachment"`, which forces download rather than inline rendering — no change needed there.

---

## Files to Modify

| File | Change |
|---|---|
| `modules/assays/backend/app/models/grit/assays/experiment.rb` | Blocklist constants, size limits, `validate` callback |
| `modules/assays/backend/app/controllers/grit/assays/experiment_attachments_controller.rb` | Content-length guard, transaction+validate in `create`, sanitize ZIP entry names |
| `modules/core/backend/app/models/grit/core/load_set_block.rb` | Allowlist constants, size limit, `validate` callback |
| `modules/assays/backend/app/controllers/grit/assays/application_controller.rb` | `X-Content-Type-Options` header |
| `modules/assays/backend/app/controllers/grit/assays/experiments_controller.rb` | Sanitize ZIP entry names in full-experiment export |

---

## Verification

- **Model specs** on `Experiment` validator: blocked MIME type → model invalid; file over 100 MB → invalid; valid CSV → valid
- **Request specs** on `ExperimentAttachmentsController`: upload `.exe` → 422; upload oversized file → 413; export ZIP with `../` in a stored filename → entry path contains no `..`
- **Regression:** run existing suite `rspec modules/assays`
