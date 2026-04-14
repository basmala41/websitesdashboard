import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import useAuthStore from "../../store/authStore";
import apiService from "../../services/apiService";
import styles from "../../styles/editItems.module.css";
import ItemDetails from "./ItemDetails";
import MediaPreview from "./MediaPreview";
import SizeChart from "./SizeChart";
import MediaManager from "./MediaManager";

const fetcher = async (itemCode, token) => {
  try {
    return await apiService.getItemDetails(itemCode, token);
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

// Main EditItems Component
const EditItems = () => {
  const { id: itemCode } = useParams();
  const { user, LangData, appOptions } = useAuthStore();
  const token = user?.token;
  const [selectedColor, setSelectedColor] = useState(null);
  const shouldFetch = user?.token;

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `itemDetails-${user.token}` : null,
    () => fetcher(itemCode, user.token),
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error("SWR Error:", error);
      },
    }
  );

  const handleUpdate = useCallback(async () => {
    try {
      await mutate();
    } catch (error) {
      console.error("Error refreshing data:", error);
      throw error;
    }
  }, [mutate]);

  const processedData = useMemo(() => {
    if (!data?.success) return null;

    return {
      itemLangDetails: data.data.itemLangDetails || [],
      productPic: data.data.productPic || [],
      productVedio: data.data.productVedio || [],
      sizeChart: data.data.sizeChart || [],
      sizeChartLink: data.data.sizeChartLink || "",
    };
  }, [data]);

  useEffect(() => {
    if (processedData?.productPic?.length > 0) {
      if (selectedColor) {
        const updatedColor = processedData.productPic.find(
          color => color.itemColor === selectedColor.itemColor
        );
        if (updatedColor) {
          setSelectedColor(updatedColor);
        } else {
          setSelectedColor(processedData.productPic[0]);
        }
      } else {
        setSelectedColor(processedData.productPic[0]);
      }
    }
  }, [processedData, selectedColor?.itemColor]); 

  const handleColorSelect = useCallback((color) => {
    setSelectedColor(color);
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}>Loading item details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h3>Error Loading Item</h3>
        <p>{error}</p>
        <button onClick={handleUpdate} className={styles.retryBtn}>
          Retry
        </button>
      </div>
    );
  }

  // No data state
  if (!processedData) {
    return (
      <div className={styles.errorContainer}>
        <h3>Item Not Found</h3>
        <p>The requested item could not be found.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Edit Item {itemCode}</h2>
      </div>

      <div className={styles.content}>
        <div className={styles.leftColumn}>
          <ItemDetails
            itemLangDetails={processedData.itemLangDetails}
            languages={LangData}
            itemId={itemCode}
            token={token}
            onUpdate={handleUpdate}
          />

          <MediaManager
            productColors={processedData.productPic}
            itemId={itemCode}
            token={token}
            onUpdate={handleUpdate}
            appOptions={appOptions}
            selectedColor={selectedColor}
            onColorSelect={handleColorSelect}
          />

          <SizeChart
            sizeChart={processedData.sizeChart}
            itemId={itemCode}
            token={token}
            onUpdate={handleUpdate}
          />
        </div>

        <div className={styles.rightColumn}>
          <MediaPreview 
            selectedColor={selectedColor} 
            videosEnabled={appOptions?.itemsVideo === 1}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(EditItems);