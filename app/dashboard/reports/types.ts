import type {
  Filters,
  FilterChangeHandler,
  SaleRow,
} from "../sales/features/columns";

export type ReportSale = SaleRow;

export type ReportFilters = Filters;

export type ReportFilterChangeHandler = FilterChangeHandler;

export interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export interface SalesListResponse<T extends ReportSale = ReportSale> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
}

export type DeleteHandler<T extends ReportSale = ReportSale> = (
  item: T
) => Promise<void> | void;
