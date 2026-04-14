import React from 'react'
import apiService from '../../services/apiService';
import useAuthStore from '../../store/authStore';
import useSWR from 'swr';
import BaseTable from '../../global/BaseTable';

const fetcher = async (token) => {
  try {
    return await apiService.getBranches(token);
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};
const Branches = () => {
      const { user } = useAuthStore();
    const shouldFetch = user?.token;
      const initialFormState = {
    branchName: "",
    branchAddress:"",
    locationLink:""
  };
      const { data, error, isLoading, mutate } = useSWR(
        shouldFetch ? `branches-${user.token}` : null,
        () => fetcher(user.token),
        {
          revalidateOnFocus: false,
          onError: (error) => {
            console.error("SWR Error:", error);
          },
        }
      );

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
      const branches = data?.data;
 const columns = [
   {
     accessorKey: "branchName",
     header: "Branch Name",
   },
   {
     accessorKey: "branchAddress",
     header: "Branch Address",
   },
   {
     accessorKey: "tel",
     header: "Telephone",
   },
   {
     accessorKey: "locationLink",
     header: "Location",
     columnDefType: "display",
     enableColumnOrdering: 1,
     Cell: ({ cell }) => {
       const location = cell.getValue();
       return location ? (
         <a href={location} target="_blank" rel="noopener noreferrer">
           {location}
         </a>
       ) : (
         "No Location"
       );
     },
   },
 ];
   const handleEdit = async (id, formData, { resetForm }, handleClose) => {
    try {
          const req = {
            languageCode: formData.language,
            branchCode: id,
            name: formData.branchName,
            adress: formData?.branchAddress,
            locationLink:formData?.locationLink
          };

          const result = await apiService.editBranch(req, user.token);
          if (result.success) {
            mutate();
            resetForm();
            handleClose();
          }
        } catch (error) {
          console.error("Error editing Branch:", error);
          alert("Error updating Branch. Please try again.");
        }
   };
 
  return (
    <div style={{ padding: "20px" }}>
      <BaseTable
        title="Branches"
        tableData={branches}
        columns={columns}
        isLoading={isLoading}
        enablePagination={true}
        manualPagination={true}
        haveEdit={true}
        includeImg={false}
        onEdit={handleEdit}
                 initialFormState={initialFormState}
          modalWidth={500}
        haveChild={false}
      />
    </div>
  );
}

export default Branches
