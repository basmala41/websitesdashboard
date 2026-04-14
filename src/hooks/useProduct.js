import useSWR from "swr";
import { fetchProductDetails } from "../services/apiOrder";

const useProduct = (itemCode, token) => {
  const { data, error, isLoading } = useSWR(
    itemCode && token ? `product-${itemCode}` : null,
    () => fetchProductDetails(itemCode, token),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    product: data?.success ? data.data : null,
    isLoading,
    error: error || (!data?.success ? data?.errorMessage : null),
  };
};
export default useProduct;