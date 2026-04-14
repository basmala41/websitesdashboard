import React, { useState, useCallback, useMemo } from "react";
import apiService from "../../services/apiService";
import useAuthStore from "../../store/authStore";
import useSWR from "swr";
import BaseTable from "../../global/BaseTable";
import { validateImageFile } from "../../constants/config";
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';

const fetcher = async (categoryID, token) => {
  try {
    return await apiService.getSubCategory(categoryID, token);
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

const SubCategory = ({ mainData }) => {
  const { user } = useAuthStore();
  const [err, setErr] = useState("");
  const shouldFetch = user?.token;

  // Memoize initial form state
  const initialFormState = useMemo(() => ({
    name: "",
  }), []);

  // Memoize SWR key to prevent unnecessary refetches
  const swrKey = useMemo(() => 
    shouldFetch ? `subCategories-${mainData.code}-${user.token}` : null,
    [shouldFetch, mainData.code, user.token]
  );

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    () => fetcher(mainData.code, user.token),
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error("SWR Error:", error);
      },
    }
  );

  // Memoize columns to prevent recreation
  const columns = useMemo(() => [
    {
      accessorKey: "code",
      header: "subCategory Code",
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

  // Memoize edit handler
  const handleEdit = useCallback(async (id, formData, { resetForm }, handleClose) => {
    try {
      
      if (formData.image) {
        const validation = validateImageFile(formData.image);
        if (!validation.valid) {
          setErr(`Image validation failed: ${validation.error}`);
          return;
        }
        setErr("");
      }
      
      const requestData = {
        mainCategoryCode: mainData.code,
        languageCode: formData.language,
        subCategoryCode: id,
        subCategoryName: formData.name,
        ...(formData.image && { image: formData.image }),
      };
      
      
      
      const result = await apiService.EditSubCategory(requestData, user.token);
      if (result.success) {
        mutate();
        resetForm();
        handleClose();
      }
    } catch (error) {
      console.error("Error editing Category:", error);
      alert("Error updating category. Please try again.");
    }
  }, [mainData.code, user.token, mutate]);

  // Memoize retry handler
  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  // Early returns
  if (!shouldFetch) {
    return <div>No authentication token available</div>;
  }

  if (error) {
    return (
      <div>
        <div>❌ Error loading subCategory: {error.message}</div>
        <button onClick={handleRetry}>Retry</button>
      </div>
    );
  }

  // Memoize error alert
  const ErrorAlert = useMemo(() => {
    if (!err) return null;
    
    return (
      <Stack sx={{ width: "100%", marginBottom: "5px" }} spacing={2}>
        <Alert severity="error">{err}</Alert>
      </Stack>
    );
  }, [err]);

  // Memoize container style
  const containerStyle = useMemo(() => ({
    padding: "20px"
  }), []);

  return (
    <div style={containerStyle}>
      {ErrorAlert}
      <BaseTable
        title="subCategory"
        tableData={data}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
        manualPagination={true}
        haveEdit={true}
        includeImg={true}
        onEdit={handleEdit}
        initialFormState={initialFormState}
        modalWidth={500}
        haveChild={false}
        enableSearch={true}
      />
    </div>
  );
};

export default React.memo(SubCategory);