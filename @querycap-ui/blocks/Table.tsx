import { ReactNode, useMemo, useState } from "react";
import { select, theme, colors, roundedEm, CSSBuilder } from "@querycap-ui/core";
import { map, get, Dictionary, concat, includes, reject, isEmpty, every, uniq, size } from "lodash";
import { Checkbox } from "@querycap-ui/form-controls";
import { IconChevronDown, IconChevronRight } from "@querycap-ui/icons";
import { Loading, Empty } from "@querycap-ui/blocks";

export interface ITableColumn<T> {
  title: ReactNode;
  key: string;
  width?: string | number;
  ellipsis?: boolean;
  formatter?: (item: any, row: T, idx: number) => ReactNode;
}

interface ITableExpandable<T> {
  expandedRowRender: (item: T) => ReactNode;
  rowExpandable: (item: T) => boolean;
}

export interface ITableProps<T, P> {
  rowKey: P;
  columns: ITableColumn<T>[];
  dataSource: T[];
  align?: "left" | "center";
  disabledCheckds?: P[];
  checkds?: P[];
  onCheckdsChange?: (ckds: P[]) => void;
  onRowClick?: (row: T) => void;
  expandable?: ITableExpandable<T>;
  rowStyle?: (row: T) => CSSBuilder;
  tableLayout?: "fixed" | "auto";
  loading?: boolean;
}

interface ITableRow<T> {
  expandable?: ITableExpandable<T>;
  columns: ITableColumn<T>[];
  rowIndex: number;
  row: T;
  onRowClick?: (row: T) => void;
  rowStyle?: (row: T) => CSSBuilder;
}

const ellipsisStyle = select().overflowX("hidden").whiteSpace("nowrap").textOverflow("ellipsis").wordBreak("keep-all");

const TableRow = <T extends Dictionary<any>>({
  columns,
  rowIndex,
  row,
  expandable,
  onRowClick,
  rowStyle,
}: ITableRow<T>) => {
  const [visible, toggleVisible] = useState(false);

  return (
    <>
      <tr
        css={select()
          .cursor(onRowClick ? "pointer" : "")
          .with(rowStyle ? rowStyle(row) : null)}
        onClick={() => {
          onRowClick && onRowClick(row);
        }}>
        {map(columns, (column, index) => (
          <td
            key={column.key}
            css={select().with(column.ellipsis ? ellipsisStyle : null)}
            title={column.ellipsis ? get(row, column.key, "-") : ""}>
            {expandable?.rowExpandable(row) && index === 0 && (
              <span
                css={select()
                  .fontSize("1em")
                  .cursor("pointer")
                  .display("inline")
                  .colorFill(colors.gray5)
                  .transition("all 0.3s")}
                onClick={() => toggleVisible(!visible)}>
                {visible ? <IconChevronDown /> : <IconChevronRight />}
              </span>
            )}
            {column.formatter ? column.formatter(get(row, column.key), row, rowIndex) : get(row, column.key, "-")}
          </td>
        ))}
      </tr>
      {visible && expandable?.expandedRowRender(row)}
    </>
  );
};

export const Table = <T extends Dictionary<any>, P extends string>({
  rowKey,
  columns,
  dataSource,
  align = "left",
  disabledCheckds,
  checkds,
  onCheckdsChange,
  onRowClick,
  expandable,
  rowStyle,
  tableLayout,
  loading,
  ...otherProps
}: ITableProps<T, P>): JSX.Element => {
  const endColumns = useMemo(() => {
    if (checkds) {
      const isCheckedAll = every(map(dataSource, rowKey), (item) => includes(checkds, item));
      const isCheckedNone = every(map(dataSource, rowKey), (item) => !includes(checkds, item));
      const isIndeterminate = !isCheckedAll && !isCheckedNone;

      return concat(
        [
          {
            title: (
              <Checkbox
                disabled={!isEmpty(disabledCheckds)}
                value={!isCheckedNone}
                indeterminate={isIndeterminate}
                onValueChange={() => {
                  const ckds = isCheckedAll ? [] : map(dataSource, (i) => i[rowKey] as P);
                  onCheckdsChange && onCheckdsChange(uniq(concat(checkds, ckds)));
                }}
              />
            ),
            key: "_checked",
            width: "3em",
            formatter(_: undefined, item: T) {
              const isChecked = includes(checkds, item[rowKey]);
              const disabled = includes(disabledCheckds || [], item[rowKey]);

              return (
                <Checkbox
                  disabled={disabled}
                  value={isChecked}
                  onValueChange={() => {
                    const ckds = isChecked ? reject(checkds, (i) => i === item[rowKey]) : concat(checkds, item[rowKey]);
                    onCheckdsChange && onCheckdsChange(ckds);
                  }}
                />
              );
            },
          },
        ],
        columns,
      );
    }

    return columns;
  }, [checkds, dataSource, columns]);

  return (
    <>
      <table
        css={select()
          .width("100%")
          .borderCollapse("collapse")
          .tableLayout(tableLayout || "auto")}
        {...otherProps}>
        <thead>
          <tr css={select().backgroundColor(colors.gray1).borderSpacing(0)}>
            {map(endColumns, (column) => (
              <th
                key={column.key}
                css={select()
                  .paddingY(roundedEm(0.7))
                  .paddingX(roundedEm(0.9))
                  .width(column.width || "auto")
                  .textAlign(align)
                  .fontWeight(500)}>
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          css={select()
            .color(colors.gray6)
            .with(
              select("tr")
                .borderBottom(`1px solid`)
                .borderColor(theme.state.borderColor)
                .borderSpacing(0)
                .with(select("&:hover").backgroundColor(colors.gray2)),
            )
            .with(select("tr:last-child").borderBottom(`none`))
            .with(select("tr td").padding(roundedEm(0.9)).textAlign(align))}>
          {map(dataSource, (row, rowIdx) => (
            <TableRow
              key={get(row, rowKey)}
              columns={endColumns}
              expandable={expandable}
              row={row}
              rowIndex={rowIdx}
              onRowClick={onRowClick}
              rowStyle={rowStyle}
            />
          ))}
        </tbody>
      </table>
      {loading ? <Loading /> : size(dataSource) ? null : <Empty />}
    </>
  );
};
