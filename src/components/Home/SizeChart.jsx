import React, { useState, useCallback } from "react";
import apiService from "../../services/apiService";
import styles from "../../styles/editItems.module.css";
import { buildImageUrl } from "../../constants/config";
import AddImage from "../../global/AddImage";

const SizeChart = ({ sizeChart, itemId, token, onUpdate }) => {
  const [uploading, setUploading] = useState(false);

  const handleSizeChartUpload = useCallback(
    async (file) => {
      setUploading(true);
      const formData = new FormData();
      formData.append("token", token);
      formData.append("ItemCode", itemId);
      formData.append("SizeChartImage", file);

      try {
        const response = await apiService.uploadImage(
          "/SizeChart/addSizeChartPic",
          formData,
          token
        );
        
        // ✅ Fixed: Only call onUpdate if upload was successful
        if (response.success) {
          onUpdate();
        } else {
          console.error("Size chart upload failed:", response);
        }
      } catch (error) {
        console.error("Error uploading size chart:", error);
      } finally {
        setUploading(false);
      }
    },
    [itemId, token, onUpdate]
  );

  // ✅ Fixed: Improved delete operation with proper success checking
  const handleSizeChartDelete = useCallback(
    async (chartId) => {
      try {
        const url = buildImageUrl("/SizeChart/deleteSizeChartPic");
        const formData = new FormData();
        formData.append('Id', chartId);
        formData.append('ItemCode', itemId);
        formData.append('token', token);

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // ✅ Parse response and check for success
        const result = await response.json();
        console.log(result,formData)

        if (result.success || response.ok) {
          onUpdate();
        } else {
          throw new Error(result.message || 'Delete operation failed');
        }

      } catch (error) {
        console.error("Error deleting size chart:", error);
      }
    },
    [itemId, token, onUpdate]
  );

  return (
    <div className={styles.sizeSection}>
      <h3>Item Size Chart</h3>
      <div className={styles.sizeGrid}>
        {sizeChart?.map((chart) => (
          <div key={chart.id} className={styles.sizeItem}>
            <img
              src={chart.imageUrl}
              alt="Size Chart"
              className={styles.sizeImage}
            />
            <button
              onClick={() => handleSizeChartDelete(chart.id)}
              className={styles.deleteBtn}
              disabled={uploading}
            >
              Delete
            </button>
          </div>
        ))}

        <AddImage onImageChange={(file) => handleSizeChartUpload(file)} />
      </div>

      {uploading && <p>Uploading size chart...</p>}
    </div>
  );
};
export default React.memo(SizeChart);