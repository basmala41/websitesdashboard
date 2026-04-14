import useSWR from "swr";
import { fetchItems } from "../services/apiOrder";

const useItems = (token) => {
  const { data, error, isLoading } = useSWR(
    token ? "items-dropdown" : null,
    () => fetchItems(token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );

  return {
    items: data?.success ? data.data : [],
    isLoading,
    error: error || (!data?.success ? data?.errorMessage : null),
  };
};
export default useItems;