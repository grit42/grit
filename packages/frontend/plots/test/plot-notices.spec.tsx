// @vitest-environment happy-dom
/** The figure's header row: one chip for every notice, the first to check, and the table. */
import { afterEach, describe, expect, test } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { act, type ReactNode } from "react";
import PlotNotices from "../lib/PlotBase/PlotNotices";
import CannotDraw from "../lib/PlotBase/CannotDraw";
import { FigureSummary } from "../lib/PlotBase/FigureSummary";
import type { PlotNotice } from "../lib/notices";

let root: Root | undefined;

afterEach(() => {
  act(() => root?.unmount());
  document.body.innerHTML = "";
});

const render = async (node: ReactNode) => {
  const host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  await act(async () => root!.render(node));
  return host;
};

const chip = (host: HTMLElement) =>
  host.querySelector<HTMLButtonElement>("button[aria-expanded]");

const rows = (host: HTMLElement) =>
  Array.from(host.querySelectorAll("tbody tr")).map((row) =>
    Array.from(row.querySelectorAll("td")).map((cell) => cell.textContent),
  );

const NOTICES: PlotNotice[] = [
  { kind: "info", reason: "values transformed" },
  { kind: "omitted", count: 2, reason: "units not analysed" },
  { kind: "warning", count: 12, reason: "subjects with more than one value" },
  {
    kind: "omitted",
    count: 6,
    reason: "groups not drawn",
    items: ["A", "B", "C", "D", "E", "F"],
  },
];

describe("the chip", () => {
  test("is absent without notices, and so is the row without a summary", async () => {
    const host = await render(<PlotNotices notices={[]} />);
    expect(host.innerHTML).toBe("");
  });

  test("leaves the summary its place when there is nothing to say", async () => {
    const host = await render(
      <PlotNotices notices={[]} summary={<span>48 of 52 animals</span>} />,
    );
    expect(host.textContent).toBe("48 of 52 animals");
    expect(chip(host)).toBeNull();
  });

  test("takes the frame's summary, unless told there is none", async () => {
    const framed = await render(
      <FigureSummary summary={<span>52 animals</span>}>
        <PlotNotices notices={[]} />
      </FigureSummary>,
    );
    expect(framed.textContent).toBe("52 animals");

    const none = await render(
      <FigureSummary summary={<span>52 animals</span>}>
        <PlotNotices notices={[]} summary={null} />
      </FigureSummary>,
    );
    expect(none.innerHTML).toBe("");
  });

  test("counts notices and takes the most serious level", async () => {
    const host = await render(<PlotNotices notices={NOTICES} />);
    expect(chip(host)?.textContent).toContain("4 notices");
    expect(chip(host)?.dataset.level).toBe("check");
    expect(chip(host)?.textContent).toContain("most serious: Check");
  });

  test("says one notice in the singular", async () => {
    const host = await render(<PlotNotices notices={[NOTICES[0]!]} />);
    expect(chip(host)?.textContent).toContain("1 notice,");
    expect(chip(host)?.dataset.level).toBe("note");
  });
});

describe("behind the chip", () => {
  test("is every notice, a check included, until the chip is opened", async () => {
    const host = await render(
      <PlotNotices notices={NOTICES} summary={<span>48 of 52 animals</span>} />,
    );
    expect(host.textContent).not.toContain("subjects with more than one value");
    expect(host.textContent).toBe(
      "48 of 52 animals4 notices, most serious: Check",
    );
  });
});

describe("the table", () => {
  test("opens from the chip and lists every notice, most serious first, with its count", async () => {
    const host = await render(<PlotNotices notices={NOTICES} />);
    expect(host.querySelector("table")).toBeNull();

    await act(async () => chip(host)!.click());

    expect(chip(host)?.getAttribute("aria-expanded")).toBe("true");
    expect(rows(host)).toEqual([
      ["Check", "subjects with more than one value", "12"],
      ["Left out", "units not analysed", "2"],
      ["Left out", "groups not drawn: A, B, C, D and 2 more show all 6", "6"],
      ["Note", "values transformed", "–"],
    ]);
  });

  test("names every item of a long list on request", async () => {
    const host = await render(<PlotNotices notices={NOTICES} />);
    await act(async () => chip(host)!.click());
    const more = host.querySelector<HTMLButtonElement>("tbody button");

    await act(async () => more!.click());

    expect(rows(host)[2]?.[1]).toBe(
      "groups not drawn: A, B, C, D, E, F show fewer",
    );
  });

  test("closes on Escape", async () => {
    const host = await render(<PlotNotices notices={NOTICES} />);
    await act(async () => chip(host)!.click());

    await act(async () =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })),
    );

    expect(host.querySelector("table")).toBeNull();
  });
});

describe("the guide", () => {
  const guideButton = (host: HTMLElement) =>
    host.querySelector<HTMLButtonElement>(
      'button[aria-label="How to read this"]',
    );
  const GUIDE = <p>Each endpoint against each study.</p>;

  test("is a ? beside the chip, from the frame, shut until pressed", async () => {
    const host = await render(
      <FigureSummary summary={<span>52 animals</span>} guide={GUIDE}>
        <PlotNotices notices={NOTICES} />
      </FigureSummary>,
    );
    expect(guideButton(host)?.textContent).toBe("?");
    expect(host.textContent).not.toContain("Each endpoint");

    await act(async () => guideButton(host)!.click());
    expect(
      host.querySelector('[role="region"][aria-label="How to read this"]')
        ?.textContent,
    ).toBe("Each endpoint against each study.");
  });

  test("opens one panel at a time, the notices or the guide", async () => {
    const host = await render(
      <FigureSummary summary={null} guide={GUIDE}>
        <PlotNotices notices={NOTICES} />
      </FigureSummary>,
    );
    await act(async () => guideButton(host)!.click());
    await act(async () => chip(host)!.click());
    expect(host.textContent).not.toContain("Each endpoint");
    expect(rows(host)).toHaveLength(NOTICES.length);
  });

  test("shows with no notices and no summary, and not in a nested frame without one", async () => {
    const alone = await render(
      <FigureSummary summary={null} guide={GUIDE}>
        <PlotNotices notices={[]} />
      </FigureSummary>,
    );
    expect(guideButton(alone)).not.toBeNull();

    const nested = await render(
      <FigureSummary summary={null} guide={GUIDE}>
        <FigureSummary summary={null}>
          <PlotNotices notices={NOTICES} />
        </FigureSummary>
      </FigureSummary>,
    );
    expect(guideButton(nested)).toBeNull();
  });
});

describe("a figure that cannot be drawn", () => {
  test("shows its reason in the figure's place, with the frame's summary", async () => {
    const host = await render(
      <FigureSummary summary={<span>52 animals</span>}>
        <CannotDraw reason="LB carries no study day." notices={[NOTICES[0]!]} />
      </FigureSummary>,
    );
    expect(host.textContent).toContain("52 animals");
    expect(host.textContent).toContain("Cannot drawLB carries no study day.");
    // The reason is never behind the chip.
    expect(chip(host)?.textContent).toContain("1 notice");
  });
});
