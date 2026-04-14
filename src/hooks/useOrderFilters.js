import { useState, useEffect, useMemo, useCallback } from 'react';

export const useOrderFilters = () => {
  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [filters, setFilters] = useState({
    dateFrom: getCurrentDate(),
    dateTo: getCurrentDate(),
    orderStatus: "",
  });

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const orderStatusOptions = useMemo(() => [
    { value: "", label: "All Status" },
    { value: 1, label: "Placed" },
    { value: 2, label: "Confirmed" },
    { value: 3, label: "Prepared" },
    { value: 4, label: "On Deliver" },
    { value: 5, label: "Delivered" },
    { value: 6, label: "Cancelled" },
    { value: 7, label: "System Cancelled" },
    { value: 8, label: "Refund" },
  ], []);

  const validateDateRange = useCallback(() => {
    if (filters.dateFrom && filters.dateTo) {
      return new Date(filters.dateFrom) <= new Date(filters.dateTo);
    }
    return true;
  }, [filters.dateFrom, filters.dateTo]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      dateFrom: getCurrentDate(),
      dateTo: getCurrentDate(),
      orderStatus: "",
    });
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [filters]);



  return {
    filters,
    pagination,
    setPagination,
    orderStatusOptions,
    validateDateRange,
    handleFilterChange,
    handleClearFilters
  };
};
