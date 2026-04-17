/* eslint-disable react-hooks/refs */
import { Menu, Portal, TooltipRender } from "@grit42/client-library/components";
import { RefObject } from "react";
import styles from "./spreadsheetProcessor.module.scss";

const SheetOptionDropdown = ({
  setFieldValue,
  focusedCellRef,
  focusedCellInfo,
  setFocusedCellInfo,
}: {
  setFieldValue: (field: string, value: string | number) => void;
  focusedCellRef: RefObject<HTMLTableCellElement | null>;
  focusedCellInfo: { row: number; column: string } | null;
  setFocusedCellInfo: (info: { row: number; column: string } | null) => void;
}) => {
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
            <div className={styles.cellInfo}>
              {focusedCellInfo.column}:{focusedCellInfo.row}
            </div>
            <Menu
              menuItems={[
                {
                  id: "headerRowIndex",
                  text: "Use this row for column identifier",
                  onClick: (e) => {
                    e.stopPropagation();
                    setFieldValue("headerRowIndex", focusedCellInfo.row);
                    setFocusedCellInfo(null);
                    focusedCellRef.current = null;
                  },
                },
                {
                  id: "dataRowIndex",
                  text: "Use this row for data offset",
                  onClick: (e) => {
                    e.stopPropagation();
                    setFieldValue("dataRowIndex", focusedCellInfo.row);
                    setFocusedCellInfo(null);
                    focusedCellRef.current = null;
                  },
                },
                {
                  id: "dataColumnOffset",
                  text: "Use this column for data offset",
                  onClick: (e) => {
                    e.stopPropagation();
                    setFieldValue("dataColumnOffset", focusedCellInfo.column);
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
