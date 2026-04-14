import React, { useMemo, useCallback, useState } from 'react';
import useSWR from 'swr';
import { useOrderFilters } from '../../hooks/useOrderFilters';
import { useOrderActions } from '../../hooks/useOrderActions';
import { formatDate, formatCurrency, getStatusColor } from '../../utils/orderHelpers';
import OrderFilters from './OrderFilters';
import OrderActionButtons from './OrderActionButtons';
import DetailsTable from './DetailsTable';
import BaseTable from '../../global/BaseTable';
import ShippingPopup from './ShippingPopup';
import apiService from '../../services/apiService';
import useAuthStore from '../../store/authStore';
import { ToastContainer } from 'react-toastify';

const OrderTable = () => {
  const { user } = useAuthStore();
  const shouldFetch = user?.token;
  
  // Shipping popup state
  const [shippingPopup, setShippingPopup] = useState({
    isOpen: false,
    order: null
  });

  const {
    filters,
    pagination,
    setPagination,
    orderStatusOptions,
    validateDateRange,
    handleFilterChange,
    handleClearFilters,
  } = useOrderFilters();

  // Create a stable key that includes all dependencies that should trigger refetch
  const swrKey = useMemo(() => {
    if (!shouldFetch) return null;
    
    return [
      'orders',
      user.token,
      pagination.pageIndex,
      pagination.pageSize,
      filters.dateFrom,
      filters.dateTo,
      filters.orderStatus
    ];
  }, [shouldFetch, user?.token, pagination.pageIndex, pagination.pageSize, filters.dateFrom, filters.dateTo, filters.orderStatus]);

  // Create fetcher that uses current values
  const fetcher = useCallback(async ([
    _key, 
    token, 
    pageIndex, 
    pageSize, 
    dateFrom, 
    dateTo, 
    orderStatus
  ]) => {
    try {
      const currentPagination = { pageIndex, pageSize };
      const currentFilters = { dateFrom, dateTo, orderStatus };
      
      return await apiService.getOrderss(token, currentPagination, currentFilters);
    } catch (error) {
      console.error("Fetcher error:", error);
      throw error;
    }
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  const { loadingActions, actionConfigs, handleOrderAction, isActionEnabled } = useOrderActions(user?.token, mutate);

  // Memoize table data
  const tableData = useMemo(() => data?.data?.orders || [], [data?.data?.orders]);
  const totalRows = useMemo(() => data?.data?.totalCount || 0, [data?.data?.totalCount]);
  const lastPageNo = useMemo(() => data?.data?.lastPageNo || 1, [data?.data?.lastPageNo]);

  // Handle shipping popup
  const handleOpenShippingPopup = useCallback((order) => {
    setShippingPopup({ isOpen: true, order });
  }, []);

  const handleCloseShippingPopup = useCallback(() => {
    setShippingPopup({ isOpen: false, order: null });
  }, []);

  const handleShippingSubmit = useCallback((orderId, actionType, orderData) => {
    handleOrderAction(orderId, actionType, orderData);
    handleCloseShippingPopup();
  }, [handleOrderAction, handleCloseShippingPopup]);

  // Enhanced action handler that includes shipping popup logic
  const enhancedHandleOrderAction = useCallback((osid, actionType, order) => {
    if (actionType === 'shipping') {
      handleOpenShippingPopup(order);
    } else {
      handleOrderAction(osid, actionType, order);
    }
  }, [handleOrderAction, handleOpenShippingPopup]);

  // Memoize columns configuration
  const columns = useMemo(() => [
    {
      accessorKey: "osid",
      header: "ID",
      size: 50,
      enableColumnFilter: false,
    },
    {
      accessorKey: "docNo",
      header: "Doc No",
      size: 0,
    },
    {
      accessorKey: "docCode",
      header: "Code",
      size: 90,
    },
    {
      accessorKey: "docDate",
      header: "Date",
      size: 120,
      Cell: ({ cell }) => (
        <div style={{ fontSize: "12px" }}>{formatDate(cell.getValue())}</div>
      ),
      enableColumnFilter: false,
      sortingFn: "datetime",
    },
    {
      accessorKey: "userName",
      header: "User Name",
      size: 120,
    },
    {
      accessorKey: "governorateName",
      header: "Gov.",
      size: 80,
      Cell: ({ cell }) => (
        <div style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "70px",
        }}>
          {cell.getValue()}
        </div>
      ),
    },
    {
      accessorKey: "custName",
      header: "Customer",
      size: 130,
      Cell: ({ cell }) => (
        <div style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "120px",
        }}>
          {cell.getValue() || "N/A"}
        </div>
      ),
    },
    {
      accessorKey: "custMobile",
      header: "Mobile",
      size: 100,
      enableColumnFilter: false,
      Cell: ({ cell }) => (
        <div style={{ fontSize: "12px" }}>{cell.getValue()}</div>
      ),
    },
    {
      accessorKey: "typeText",
      header: "Payment",
      size: 90,
      Cell: ({ cell }) => (
        <span style={{
          padding: "2px 6px",
          borderRadius: "4px",
          backgroundColor: cell.getValue() === "عند الاستلام" ? "#e3f2fd" : "#fff3e0",
          color: cell.getValue() === "عند الاستلام" ? "#1976d2" : "#f57c00",
          fontSize: "10px",
          fontWeight: "500",
          whiteSpace: "nowrap",
        }}>
          {cell.getValue()}
        </span>
      ),
    },
    {
      accessorKey: "quantity",
      header: "Qty",
      size: 40,
      enableColumnFilter: false,
    },
    {
      accessorKey: "totalValue",
      header: "Total",
      size: 60,
      Cell: ({ cell }) => (
        <div style={{ fontSize: "12px" }}>
          {formatCurrency(cell.getValue())}
        </div>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "netTotalValue",
      header: "Net Total",
      size: 50,
      Cell: ({ cell }) => (
        <strong style={{ color: "#2e7d32", fontSize: "12px" }}>
          {formatCurrency(cell.getValue())}
        </strong>
      ),
      enableColumnFilter: false,
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 60,
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => {
        const { orderStatus } = row.original;
        const status = getStatusColor(orderStatus);
        return (
          <span style={{
            padding: "2px 6px",
            borderRadius: "8px",
            backgroundColor: status.color,
            color: "#333",
            fontSize: "10px",
            fontWeight: "600",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}>
            {status.text}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      size: 140,
      enableColumnFilter: false,
      enableSorting: false,
      Cell: ({ row }) => (
        <OrderActionButtons
          order={row.original}
          actionConfigs={actionConfigs}
          loadingActions={loadingActions}
          isActionEnabled={isActionEnabled}
          onAction={enhancedHandleOrderAction}
          token={user?.token}
        />
      ),
    },
  ], [loadingActions, actionConfigs, isActionEnabled, enhancedHandleOrderAction, user?.token]);

  // Memoized refresh handler
  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  if (!shouldFetch) {
    return <div>No authentication token available</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <h6>Error loading orders</h6>
        <p>Please try refreshing the page or contact support if the problem persists.</p>
        <button className="btn btn-outline-primary" onClick={() => mutate()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <OrderFilters
        filters={filters}
        orderStatusOptions={orderStatusOptions}
        validateDateRange={validateDateRange}
        handleFilterChange={handleFilterChange}
        handleClearFilters={handleClearFilters}
        isLoading={isLoading}
        onRefresh={handleRefresh}
      />

      <BaseTable
        title="Orders"
        tableData={tableData}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
        manualPagination={true}
        pageCount={Math.ceil(totalRows / pagination.pageSize) || lastPageNo}
        currentPage={pagination.pageIndex}
        pageSize={pagination.pageSize}
        onPaginationChange={setPagination}
        haveChild={true}
        ChildComponent={DetailsTable}
        enableExpanding={true}
        enableColumnResizing={true}
        enableSorting={true}
        enableColumnFilters={true}
        enableGlobalFilter={true}
      />

      {/* Shipping Popup - Now managed at table level */}
      {shippingPopup.isOpen && shippingPopup.order && (
        <ShippingPopup
          order={shippingPopup.order}
          isOpen={shippingPopup.isOpen}
          onClose={handleCloseShippingPopup}
          onSubmit={handleShippingSubmit}
          token={user?.token}
        />
      )}

      <ToastContainer />
    </div>
  );
};

export default React.memo(OrderTable);