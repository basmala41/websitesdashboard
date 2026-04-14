import React, { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import useAuthStore from "../../store/authStore";
import apiService from "../../services/apiService";
import BaseTable from "../../global/BaseTable";
import { validateImageFile } from "../../constants/config";
import Alert from '@mui/material/Alert';
import SubCategory from "./SubCategory";
import Stack from '@mui/material/Stack';

const fetcher = async (token) => {
  try {
    return await apiService.getCategory(token);
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

const Category = () => {
  const { user } = useAuthStore();
  const [err, setErr] = useState('');
  const shouldFetch = user?.token;

  // Memoize initial form state to prevent recreation
  const initialFormState = useMemo(() => ({
    name: "",
  }), []);

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `categories-${user.token}` : null,
    () => fetcher(user.token),
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error("SWR Error:", error);
      },
    }
  );

  // Memoize columns to prevent recreation on every render
  const columns = useMemo(() => [
    {
      accessorKey: "code",
      header: "Category Code",
    },
    {
      accessorKey: "name",
      header: "Name Ar",
    },
    {
      accessorKey: "nameE",
      header: "Name En",
    },
    {
      accessorKey: "picLink",
      header: "Image",
      columnDefType: "display",
      enableColumnOrdering: 1,
      Cell: ({ cell }) => {
        const imageUrl = cell.getValue();
        return imageUrl ? (
          <img
            src={imageUrl}
            alt="Item"
            style={{ width: "50px", height: "50px", objectFit: "cover" }}
          />
        ) : (
          "No Image"
        );
      },
    },
  ], []);

  // Memoize edit handler to prevent recreation
  const handleEdit = useCallback(async (id, formData, { resetForm }, handleClose) => {
    try {
      if (formData.image) {
        const validation = validateImageFile(formData.image);
        if (!validation.valid) {
          setErr(`Image validation failed: ${validation.error}`);
          return;
        }
        setErr('');
      }
      
      const requestData = {
        languageCode: formData.language,
        mainCategoryCode: id,
        mainCategoryName: formData.name,
        ...(formData.image && { image: formData.image }),
      };
      
      
      
      const result = await apiService.EditCategory(requestData, user.token);
      if (result.success) {
        mutate();
        resetForm();
        handleClose();
      }
    } catch (error) {
      console.error("Error editing Category:", error);
      alert("Error updating category. Please try again.");
    }
  }, [user.token, mutate]);

  // Memoize retry handler
  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  // Early returns with memoized content
  if (!shouldFetch) {
    return <div>No authentication token available</div>;
  }

  if (error) {
    return (
      <div>
        <div>❌ Error loading categories: {error.message}</div>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  const categories = data?.data;

  // Memoize error alert to prevent recreation
  const ErrorAlert = useMemo(() => {
    if (!err) return null;
    
    return (
      <Stack sx={{ width: '100%', marginBottom: "5px" }} spacing={2}>
        <Alert severity="error">{err}</Alert>
      </Stack>
    );
  }, [err]);

  return (
    <div style={{ padding: "20px" }}>
      {ErrorAlert}
      <BaseTable
        title="Category"
        tableData={categories}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
        manualPagination={true}
        haveEdit={true}
        includeImg={true}
        onEdit={handleEdit}
        initialFormState={initialFormState}
        modalWidth={500}
        haveChild={true}
        ChildComponent={SubCategory}
        enableSearch={true}
      />
    </div>
  );
};

export default React.memo(Category);