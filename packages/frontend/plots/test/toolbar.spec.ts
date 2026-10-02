/** *Add note* and *Download* as buttons in Plotly's toolbar. */
import { describe, expect, test } from "vitest";
import {
  DOWNLOAD_ICON,
  NOTE_ICON,
  figureToolbarButtons,
} from "../lib/PlotBase/toolbar";

const options = (overrides = {}) => ({
  canAnnotate: true,
  annotating: false,
  onToggleNote: () => {},
  canDownload: true,
  onDownload: () => {},
  ...overrides,
});

describe("figureToolbarButtons", () => {
  test("offers a note button and a download button, note first", () => {
    const buttons = figureToolbarButtons(options());
    expect(buttons.map((button) => button.title)).toEqual([
      "Add note",
      "Download",
    ]);
    expect(buttons[0]!.icon).toBe(NOTE_ICON);
    expect(buttons[1]!.icon).toBe(DOWNLOAD_ICON);
  });

  test("names the note button for what a click will do", () => {
    const [note] = figureToolbarButtons(options({ annotating: true }));
    expect(note!.title).toBe("Cancel the note");
  });

  test("leaves out what the host cannot do", () => {
    expect(
      figureToolbarButtons(options({ canAnnotate: false })).map((b) => b.name),
    ).toEqual(["grit-download"]);
    expect(
      figureToolbarButtons(options({ canDownload: false })).map((b) => b.name),
    ).toEqual(["grit-add-note"]);
  });

  test("hands each click to its own action", () => {
    const clicked: string[] = [];
    const buttons = figureToolbarButtons(
      options({
        onToggleNote: () => clicked.push("note"),
        onDownload: () => clicked.push("download"),
      }),
    );
    for (const button of buttons) {
      (button.click as unknown as () => void)();
    }
    expect(clicked).toEqual(["note", "download"]);
  });

  test("draws its icons in a 24-unit box, as Plotly's viewBox reads them", () => {
    for (const icon of [NOTE_ICON, DOWNLOAD_ICON]) {
      expect(icon).toMatchObject({ width: 24, height: 24 });
      expect(icon.path.length).toBeGreaterThan(0);
    }
  });
});
