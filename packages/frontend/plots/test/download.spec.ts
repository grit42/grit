/** Filename and request construction for plot downloads. */
import { describe, expect, test } from "vitest";
import {
  buildDownloadRequest,
  DEFAULT_EXPORT_SCALE,
  EXPORT_FORMATS,
  EXPORT_SCALES,
  isRasterFormat,
  sanitiseFilename,
  suggestedFilename,
} from "../lib/PlotBase/download";
import type { PlotExportFormat } from "../lib/types";

describe("sanitiseFilename", () => {
  test("strips the separators a generated plot title contains", () => {
    expect(sanitiseFilename("% inhibition : compound_name")).toBe(
      "pct inhibition - compound_name",
    );
  });

  test("writes a percent sign as 'pct'", () => {
    expect(sanitiseFilename("50% response")).toBe("50pct response");
  });

  test("removes every character a filesystem or browser would reject", () => {
    expect(sanitiseFilename('a/b\\c?d*e:f|g"h<i>j')).toBe(
      "a-b-c-d-e-f-g-h-i-j",
    );
  });

  test("collapses the runs that stripping leaves behind", () => {
    expect(sanitiseFilename("a // b")).toBe("a - b");
  });

  test("trims leading and trailing separators", () => {
    expect(sanitiseFilename("  : plot : ")).toBe("plot");
  });

  test("falls back when nothing survives", () => {
    expect(sanitiseFilename("///")).toBe("plot");
    expect(sanitiseFilename("   ")).toBe("plot");
    expect(sanitiseFilename("", "fallback")).toBe("fallback");
  });

  test("caps the length", () => {
    expect(sanitiseFilename("x".repeat(500))).toHaveLength(200);
  });

  test("leaves an already-clean name alone", () => {
    expect(sanitiseFilename("body-weight over time")).toBe(
      "body-weight over time",
    );
  });
});

describe("suggestedFilename", () => {
  test("prefers the configured filename", () => {
    expect(suggestedFilename({ filename: "custom" }, "Some title")).toBe(
      "custom",
    );
  });

  test("falls back to the plot title, sanitised", () => {
    expect(suggestedFilename(undefined, "% inhibition : x")).toBe(
      "pct inhibition - x",
    );
  });

  test("falls back again when there is no title", () => {
    expect(suggestedFilename(undefined, undefined)).toBe("plot");
  });
});

describe("buildDownloadRequest", () => {
  /** `null` is Plotly's documented "use the graph's current size" */

  test("asks for the graph's current size", () => {
    const request = buildDownloadRequest({ format: "svg", filename: "a" });
    expect(request.width).toBeNull();
    expect(request.height).toBeNull();
  });

  test("sanitises the filename on the way through", () => {
    expect(
      buildDownloadRequest({ format: "png", filename: "a/b" }).filename,
    ).toBe("a-b");
  });

  test("passes scale for raster formats", () => {
    expect(
      buildDownloadRequest({ format: "png", filename: "a", scale: 2 }),
    ).toHaveProperty("scale", 2);
  });

  /** svg is resolution-independent, so a scale would be meaningless. */
  test("drops scale for svg", () => {
    expect(
      buildDownloadRequest({ format: "svg", filename: "a", scale: 2 }),
    ).not.toHaveProperty("scale");
  });

  test("omits scale entirely when none is configured", () => {
    expect(
      buildDownloadRequest({ format: "png", filename: "a" }),
    ).not.toHaveProperty("scale");
  });
});

describe("the offered formats", () => {
  test("match what Plotly's downloadImage accepts", () => {
    const supported: PlotExportFormat[] = ["svg", "png", "jpeg", "webp"];
    expect(EXPORT_FORMATS.map((f) => f.value).sort()).toEqual(
      [...supported].sort(),
    );
  });

  /** The Resolution select is shown only for these, so it must match. */
  test("the default scale is a no-op multiplier", () => {
    expect(DEFAULT_EXPORT_SCALE).toBe(1);
    expect(EXPORT_SCALES.map((s) => s.value)).toContain(DEFAULT_EXPORT_SCALE);
  });

  test("every offered scale is a positive multiplier", () => {
    expect(EXPORT_SCALES.every((s) => s.value > 0)).toBe(true);
  });

  test("only rasters are scalable", () => {
    expect(
      EXPORT_FORMATS.filter((f) => isRasterFormat(f.value)).map((f) => f.value),
    ).toEqual(["png", "jpeg", "webp"]);
  });
});
