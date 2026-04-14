import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import BaseTable from "../../global/BaseTable";
import apiService from "../../services/apiService";
import useAuthStore from "../../store/authStore";
import { Link } from "react-router-dom";
import noimg from "../../assets/No_Image.png";
import styles from '../../styles/sidebar.module.css';

// Custom hook for debounced search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized Image Component to prevent unnecessary re-renders
const ItemImage = React.memo(({ imageUrl }) => (
  <img
    src={imageUrl || noimg}
    alt="Item"
    style={{
      width: "50px",
      height: "50px",
      objectFit: "cover",
      borderRadius: "6px",
    }}
    onError={(e) => {
      e.target.onerror = null;
      e.target.src = noimg;
    }}
  />
));

// Memoized Action Button Component
const ActionButton = React.memo(({ itemCode }) => (
  <button className={styles.btn}>
    <Link to={`/editItem/${itemCode}`}>
      More Details
    </Link>
  </button>
));

const ItemsPage = () => {
  const { user } = useAuthStore();

  // State management
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [searchText, setSearchText] = useState("");
  
  // Refs for optimization
  const abortControllerRef = useRef(null);
  const isInitialMountRef = useRef(true);
  
  // Debounced search value to prevent excessive API calls
  const debouncedSearchText = useDebounce(searchText, 500);

  // Memoized API call function
  const fetchData = useCallback(async (page, size, search = "") => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getItems(
        page + 1, 
        size, 
        user.token, 
        search,
        abortControllerRef.current.signal
      );
      
      if (!abortControllerRef.current.signal.aborted) {
        setData(response.data.products || []);
        setTotalPages(response.data.lastPageNo || 0);
      }
    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(error.message);
        setData([]);
        setTotalPages(0);
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user.token]);

  // Effect for data fetching with search
  useEffect(() => {
    if (!user?.token) return;

    // Reset to first page when search changes (except on initial mount)
    if (!isInitialMountRef.current && debouncedSearchText !== searchText) {
      setPageIndex(0);
    }
    
    fetchData(
      debouncedSearchText !== searchText ? 0 : pageIndex, 
      pageSize, 
      debouncedSearchText
    );

    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [pageIndex, pageSize, debouncedSearchText, user?.token, fetchData]);

  // Optimized handlers
  const handleRetry = useCallback(() => {
    fetchData(pageIndex, pageSize, debouncedSearchText);
  }, [fetchData, pageIndex, pageSize, debouncedSearchText]);

  const handlePaginationChange = useCallback((updater) => {
    const newPagination = typeof updater === "function"
      ? updater({ pageIndex, pageSize })
      : updater;
    
    setPageIndex(newPagination.pageIndex);
    setPageSize(newPagination.pageSize);
  }, [pageIndex, pageSize]);

  const handleSearchChange = useCallback((searchValue) => {
    setSearchText(searchValue);
  }, []);

  // Memoized columns definition
  const columns = useMemo(() => [
    {
      accessorKey: "itemCode",
      header: "Item Code",
    },
    {
      accessorKey: "mainPic",
      header: "Main Picture",
      Cell: ({ cell }) => <ItemImage imageUrl={cell.getValue()} />,
    },
    {
      accessorKey: "itemName",
      header: "Item Name",
    },
    {
      accessorKey: "price",
      header: "Price",
      Cell: ({ cell }) => `EGP ${cell.getValue()}`,
    },
    {
      accessorKey: "dealPrice",
      header: "Deal Price",
      Cell: ({ cell }) => {
        const price = cell.getValue();
        return price > 0 ? `EGP ${price}` : "No Deal";
      },
    },
    {
      accessorKey: "go",
      header: "Details",
      Cell: ({ row }) => <ActionButton itemCode={row.original.itemCode} />,
    },
  ], []);

  // Memoized error component
  const errorComponent = useMemo(() => (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h3>Error Loading Data</h3>
      <p>{error}</p>
      <button onClick={handleRetry} style={{ marginTop: "10px" }}>
        Retry
      </button>
    </div>
  ), [error, handleRetry]);

  // Early return for error state
  if (error) {
    return errorComponent;
  }

  return (
    <div style={{ padding: "20px" }}>
      <BaseTable
        title="Items Management"
        tableData={data}
        columns={columns}
        isLoading={loading}
        enablePagination={true}
        manualPagination={true}
        pageCount={totalPages}
        currentPage={pageIndex}
        pageSize={pageSize}
        onPaginationChange={handlePaginationChange}
        searchText={searchText}
        onSearchChange={handleSearchChange}
        enableSearch={true}
      />
    </div>
  );
};

export default React.memo(ItemsPage);