import React, { useCallback, useMemo } from 'react';
import apiService from '../../services/apiService';
import useSWR from 'swr';
import useAuthStore from '../../store/authStore';
import BaseTable from '../../global/BaseTable';

const fetcher = async (token) => {
  try {
    return await apiService.getPolicies(token);
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

const TermsandCondition = () => {
  const { user } = useAuthStore();
  
  const shouldFetch = Boolean(user?.token);

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `policies-${user.token}` : null,
    () => fetcher(user.token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 1000,
      onError: (error) => {
        console.error("SWR Error:", error);
      },
    }
  );

  // Memoize columns to prevent recreation
  const columns = useMemo(() => [
    {
      accessorKey: "privacyCode",
      header: "Privacy Code",
    },
    {
      accessorKey: "privacyName",
      header: "Privacy Name",
    },
    {
      accessorKey: "langName",
      header: "Lang Name",
    },
  ], []);

  // Memoize initial form state
  const initialFormState = useMemo(() => ({
    privacyName: "",
    // Add other form fields as needed based on your API structure
  }), []);

  const handleEdit = useCallback(async (id, formData, { resetForm }, handleClose) => {
    const req={
          id: 0,
  languageCode: formData.language,
  privacyCode: id,
  privacyText: formData.privacyText
    }
   try {
      // TODO: Implement the actual API call
      const response = await apiService.postPolicies(req,user.token);
      
      if (response.success) {
        // Refresh data after successful update
        await mutate();
        resetForm();
        handleClose();
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      alert(`Error updating policy: ${error.message}. Please try again.`);
    } 
  }, [user.token, mutate]);

  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  // Early returns with memoized content
  if (!shouldFetch) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>❌ No authentication token available</div>
        <div>Please log in to view policies.</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div>❌ Error loading policies: {error.message}</div>
        <button 
          onClick={handleRetry}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const policies = data?.data || [];

  return (
    <div style={{ padding: "20px" }}>
      <BaseTable
        title="policies"
        tableData={policies}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
        manualPagination={true}
        haveEdit={true}
        includeImg={false}
        modalWidth={800}
        haveChild={false}
        onEdit={handleEdit}
        haveJoditEdit={true}
        initialFormState={initialFormState}
      />
    </div>
  );
};

export default React.memo(TermsandCondition);