import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import BaseTable from '../../global/BaseTable';
import apiService from '../../services/apiService';
import useAuthStore from '../../store/authStore';
import { toast } from 'react-toastify';
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

// Memoized Reset Password Button Component
const ResetPasswordButton = React.memo(({ userId, onReset }) => (
  <button 
    className={styles.btn} 
    onClick={() => onReset(userId)}
  >
    Reset Password
  </button>
));

const Users = () => {
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
  const fetchData = useCallback(async (page, size, mobile = "") => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getUsers(
        page + 1,
        size,
        user.token,
        mobile,
        abortControllerRef.current.signal
      );
      
      if (!abortControllerRef.current.signal.aborted) {
        setData(response.data.users || []);
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

  // Reset password handler
  const handleReset = useCallback(async (userId) => {
    try {
      const response = await apiService.resetUserPassword(userId, user.token);
      
      if (response.success) {
        toast.success('Password reset successfully');
      } else {
        toast.error(response.errorMessage || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.message || 'An error occurred while resetting password');
    }
  }, [user.token]);

  // Memoized columns definition
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'mobile',
      header: 'Mobile',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'registerType',
      header: 'Register Type',
    },
    {
      accessorKey: 'reset',
      header: 'Reset Password',
      Cell: ({ row }) => (
        <ResetPasswordButton 
          userId={row.original.id}
          onReset={handleReset}
        />
      ),
    },
  ], [handleReset]);

  // Memoized error component
  const errorComponent = useMemo(() => (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Error Loading Data</h3>
      <p>{error}</p>
      <button onClick={handleRetry} style={{ marginTop: '10px' }}>
        Retry
      </button>
    </div>
  ), [error, handleRetry]);

  // Early return for error state
  if (error) {
    return errorComponent;
  }

  return (
    <div style={{ padding: '20px' }}>
      <BaseTable
        title="Users Management"
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
        searchPlaceholder="Search by mobile number..."
      />
    </div>
  );
};

export default React.memo(Users);