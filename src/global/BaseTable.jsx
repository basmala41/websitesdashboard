import React, { useMemo, useCallback } from "react";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import Model from "./Model";
import { getStatusColor } from '../utils/orderHelpers';

const BaseTable = ({
  title,
  tableData = [],
  columns,
  isLoading = false,
  enablePagination = true,
  manualPagination = false,
  pageCount = 0,
  currentPage = 0,
  pageSize = 20,
  onPaginationChange,
  haveEdit = false,
  includeImg = false,
  onEdit,
  initialFormState,
  modalWidth,
  haveChild = false,
  includeColor = false,
  ChildComponent,
  haveJoditEdit = false,
  // Search configuration
  enableSearch = true, // Always enable search by default
  searchText = "",
  onSearchChange = null, // If provided, uses API search; if null, uses client-side search
  searchPlaceholder = "Search...",
}) => {
  // Determine if this is API-based search or client-side search
  const isApiSearch = typeof onSearchChange === "function";
  
  // Memoized enhanced columns to prevent recreation
  const enhancedColumns = useMemo(
    () => [
      ...columns,
      ...(haveEdit ? [{
        accessorKey: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <div>
            <Model
              Id={row.original.id}
              initialFormState={initialFormState}
              initialData={row.original}
              modalTitle={title}
              onEdit={onEdit}
              isEdit={true}
              modalWidth={modalWidth}
              includeImg={includeImg}
              includeColor={includeColor}
              haveJoditEdit={haveJoditEdit}
            />
          </div>
        ),
      }] : [])
    ],
    [columns, haveEdit, title, initialFormState, onEdit, modalWidth, includeImg, includeColor, haveJoditEdit]
  );

  // Handle global filter change - works for both API and client-side search
  const handleGlobalFilterChange = useCallback((searchValue) => {
    if (isApiSearch) {
      // API-based search: call the parent component's search handler
      onSearchChange(searchValue || "");
    }
    // For client-side search, Material React Table handles it automatically
  }, [isApiSearch, onSearchChange]);

  // Memoized table configuration
  const tableConfig = useMemo(() => ({
    columns: enhancedColumns,
    data: tableData,
    muiTableBodyCellProps: {
      sx: {
        fontFamily: "Alexandria, sans-serif",
        fontSize: "16px",
      },
    },
    muiTableHeadCellProps: {
      sx: {
        fontFamily: "Alexandria, sans-serif",
        fontWeight: "600",
      },
    },
    muiToolbarAlertBannerProps: {
      sx: {
        fontFamily: "Alexandria, sans-serif",
      },
    },
    
    enablePagination,
    manualPagination,
    pageCount,
    rowCount: pageCount * pageSize,
    muiPaginationProps: {
      rowsPerPageOptions: [5, 10, 15, 20, 50],
      variant: "outlined",
      sx: {
        fontFamily: "Alexandria, sans-serif",
      },
    },
    paginationDisplayMode: "pages",
    
    // Search configuration - flexible based on search type
    enableGlobalFilter: enableSearch,
    manualFiltering: isApiSearch, // Only manual filtering for API search
    
    state: {
      isLoading,
      pagination: {
        pageIndex: currentPage,
        pageSize,
      },
      // Only set globalFilter state for API search
      ...(isApiSearch && { globalFilter: searchText }),
    },
    
    onPaginationChange: (updater) => {
      if (typeof onPaginationChange === "function") {
        onPaginationChange(updater);
      }
    },
    
    // Only handle global filter change for API search
    ...(isApiSearch && { onGlobalFilterChange: handleGlobalFilterChange }),
    
    // Search input customization
    muiSearchTextFieldProps: {
      placeholder: searchPlaceholder,
      sx: {
        fontFamily: "Alexandria, sans-serif",
      },
      variant: "outlined",
      size: "small",
    },
    
    ...(haveChild && {
      renderDetailPanel: ({ row }) => (
        <ChildComponent mainData={row.original} />
      ),
    }),
    
    ...(title === "Orders" && {
      muiTableContainerProps: {
        sx: {
          overflowX: "auto",
          minWidth: "800px"
        },
      },
      enableColumnResizing: true,
      columnResizeDirection: "rtl",
      enableSorting: true,
      enableColumnFilters: true,
      enableDensityToggle: false,
      enableFullScreenToggle: false,
      muiTableBodyRowProps: ({ row }) => {
        const { orderStatus } = row.original;
        const status = getStatusColor(orderStatus);

        return {
          sx: {
            cursor: "pointer",
            backgroundColor: status.color,
          },
        };
      },
    })
  }), [
    enhancedColumns,
    tableData,
    enablePagination,
    manualPagination,
    pageCount,
    pageSize,
    isLoading,
    currentPage,
    searchText,
    searchPlaceholder,
    onPaginationChange,
    handleGlobalFilterChange,
    enableSearch,
    isApiSearch,
    haveChild,
    ChildComponent,
    title
  ]);

  const table = useMaterialReactTable(tableConfig);

  return (
    <div style={{ width: "100%" ,backgroundColor:"green"}}>
      <MaterialReactTable table={table} />
    </div>
  );
};

export default React.memo(BaseTable);
