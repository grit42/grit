import { Menu, Portal, TooltipRender } from "@grit42/client-library/components";
import { MutableRefObject, useEffect } from "react";
import styles from "../dataSheetStructureLoader.module.scss";

const SheetOptionDropdown = ({
  setFieldValue,
  focusedCellRef,
  focusedCellInfo,
  setFocusedCellInfo,
}: {
  setFieldValue: (field: string, value: string | number) => void;
  focusedCellRef: MutableRefObject<HTMLTableCellElement | null>;
  focusedCellInfo: { row: number; column: string } | null;
  setFocusedCellInfo: (info: { row: number; column: string } | null) => void;
}) => {
  useEffect(() => {
    if (!focusedCellInfo) return;
    const cell = focusedCellRef.current;
    const parentDiv = cell?.closest("div");

    const clearCellInfo = () => {
      setFocusedCellInfo(null);
      focusedCellRef.current = null;
    };

    const clearCellInfoIfNotInView = () => {
      const parentRect = parentDiv?.getBoundingClientRect();
      const cellRect = cell?.getBoundingClientRect();

      const isCellVisible =
        parentRect &&
        cellRect &&
        cellRect.right < parentRect.right &&
        cellRect.left > parentRect.left &&
        cellRect.top > parentRect.top &&
        cellRect.bottom < parentRect.bottom;
      if (!isCellVisible) {
        setFocusedCellInfo(null);
        focusedCellRef.current = null;
      }
    };

    document.addEventListener("click", clearCellInfo);
    document.addEventListener("scroll", clearCellInfoIfNotInView, true);
    return () => {
      document.removeEventListener("click", clearCellInfo);
      document.removeEventListener("scroll", clearCellInfoIfNotInView, true);
    };
  }, [focusedCellInfo, focusedCellRef, setFocusedCellInfo]);

  if (focusedCellInfo === null) {
    return null;
  }

  return (
    <Portal>
      <TooltipRender
        key={focusedCellInfo.column + focusedCellInfo.row}
        childRef={focusedCellRef.current}
        onTransitionEnd={() => {}}
        isHovering={true}
        className={styles.tooltip}
        content={
          <>
            <div style={{ textAlign: "center", padding: "var(--spacing)" }}>
              {focusedCellInfo.column}:{focusedCellInfo.row}
            </div>
            <Menu
              menuItems={[
                {
                  id: "nameRowIndex",
                  text: "Use this row for name",
                  onClick: (e) => {
                    e.stopPropagation();
                    setFieldValue(
                      "columnDefinitionsFromSheetOptions.nameRowIndex",
                      focusedCellInfo.row,
                    );
                    setFocusedCellInfo(null);
                    focusedCellRef.current = null;
                  },
                },
                {
                  id: "descriptionRowIndex",
                  text: "Use this row for description",
                  onClick: (e) => {
                    e.stopPropagation();
                    setFieldValue(
                      "columnDefinitionsFromSheetOptions.descriptionRowIndex",
                      focusedCellInfo.row,
                    );
                    setFocusedCellInfo(null);
                    focusedCellRef.current = null;
                  },
                },
                {
                  id: "identifierRowIndex",
                  text: "Use this row for safe_name",
                  onClick: (e) => {
                    e.stopPropagation();
                    setFieldValue(
                      "columnDefinitionsFromSheetOptions.identifierRowIndex",
                      focusedCellInfo.row,
                    );
                    setFocusedCellInfo(null);
                    focusedCellRef.current = null;
                  },
                },
                {
                  id: "dataRowOffset",
                  text: "Use this row for data offset",
                  onClick: (e) => {
                    e.stopPropagation();
                    setFieldValue(
                      "columnDefinitionsFromSheetOptions.dataRowOffset",
                      focusedCellInfo.row,
                    );
                    setFocusedCellInfo(null);
                    focusedCellRef.current = null;
                  },
                },
                {
                  id: "dataColumnOffset",
                  text: "Use this column for data offset",
                  onClick: (e) => {
                    e.stopPropagation();
                    setFieldValue(
                      "columnDefinitionsFromSheetOptions.columnOffset",
                      focusedCellInfo.column,
                    );
                    setFocusedCellInfo(null);
                    focusedCellRef.current = null;
                  },
                },
              ]}
            />
          </>
        }
        autoPlacementOptions={{
          allowedPlacements: ["top", "bottom"],
        }}
      />
    </Portal>
  );
};

export default SheetOptionDropdown;
