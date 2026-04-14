import React, { useCallback } from "react";
import useAuthStore from "../../store/authStore";
import apiService from "../../services/apiService";
import useSWR from "swr";
import BaseTable from "../../global/BaseTable";

const fetcher = async (token) => {
  try {
    return await apiService.getColors(token);
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

const Colors = () => {
  const { user } = useAuthStore();
  const shouldFetch = user?.token;

  const initialFormState = {
    name: "",
    colorHex: "",
  };

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `colors-${user.token}` : null,
    () => fetcher(user.token),
    {
      revalidateOnFocus: false,
      /* onError: (error) => {
        console.error("SWR Error:", error);
      }, */
    }
  );

  // Memoize columns to prevent recreation
  const columns = React.useMemo(() => [
    {
      accessorKey: "code",
      header: "Color Code",
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
      accessorKey: "colorHex",
      header: "Color",
      columnDefType: "display",
      enableColumnOrdering: 1,
      Cell: ({ cell }) => {
        const colorHex = cell.getValue();
        return (
          <div
            style={{
              backgroundColor: colorHex.includes("#") ? colorHex : `#${colorHex}`,
              width: "30px",
              height: "30px",
              border: "1px solid #333",
            }}
          />
        );
      },
    },
  ], []);

  const handleEdit = useCallback(async (id, formData, { resetForm }, handleClose) => {
    try {
      const req = {
        languageCode: formData.language,
        colorCode: id,
        colorName: formData.name,
        colorHex: formData?.colorHex,
      };
      const result = await apiService.editColor(req, user.token);
      if (result.success) {
        mutate();
        resetForm();
        handleClose();
      }
    } catch (error) {
      alert("Error updating Color. Please try again.");
    }
  }, [user.token, mutate]);

  if (!shouldFetch) {
    return <div>No authentication token available</div>;
  }

  if (error) {
    return (
      <div>
        <div>❌ Error loading categories: {error.message}</div>
        <button onClick={() => mutate()}>Retry</button>
      </div>
    );
  }

  const colors = data?.data;

  return (
    <div style={{ padding: "20px" }}>
      <BaseTable
        title="Colors"
        tableData={colors}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
        manualPagination={true}
        haveEdit={true}
        includeImg={false}
        onEdit={handleEdit}
        modalWidth={500}
        haveChild={false}
        includeColor={true}
        initialFormState={initialFormState}
        enableSearch={true}
      />
    </div>
  );
};

export default React.memo(Colors);