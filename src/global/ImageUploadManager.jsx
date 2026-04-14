import React, { useCallback, useMemo, useState } from 'react';
import apiService from '../services/apiService';
import useAuthStore from '../store/authStore';
import useSWR from 'swr';
import styles from "../styles/banner.module.css";
import { Box } from "@mui/material";
import AddImage from "../global/AddImage";

const ImageUploadManager = ({
  title,
  fetchMethod,
  uploadMethod,
  swrKey,
  imageFieldName,
  altText = "Image",
  noImageMessage = "No images available. Upload your first image above."
}) => {
  const { user } = useAuthStore();
  const shouldFetch = user?.token;
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resetKey, setResetKey] = useState(0); // Key to force AddImage reset

  // Generic fetcher function
  const fetcher = async (token) => {
    try {
      return await apiService[fetchMethod](token);
    } catch (error) {
      console.error("Fetcher error:", error);
      throw error;
    }
  };

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `${swrKey}-${user.token}` : null,
    () => fetcher(user.token),
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error("SWR Error:", error);
      },
    }
  );

  const imageData = useMemo(() => data?.data || [], [data?.data]);

  const handleImageChange = useCallback((file, preview) => {
    setImageFile(file);
    setPreviewUrl(preview);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!imageFile) return;

    setUploadLoading(true);
    try {
      const uploadData = {
        [imageFieldName]: imageFile
      };
      
      const result = await apiService[uploadMethod](uploadData, user.token);
      
      if (result.success) {
        await mutate(); // Wait for mutation to complete
        setImageFile(null);
        setPreviewUrl(null);
        setResetKey(prev => prev + 1); // Force AddImage component to reset
      }
    } catch (error) {
      console.error(`Error uploading ${title.toLowerCase()}:`, error);
    } finally {
      setUploadLoading(false);
    }
  }, [imageFile, user.token, mutate, uploadMethod, imageFieldName, title]);

  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  const uploadButtonText = useMemo(() => 
    uploadLoading ? "Uploading..." : "Upload",
    [uploadLoading]
  );

  // Memoize upload button disabled state
  const isUploadDisabled = useMemo(() => 
    !imageFile || uploadLoading,
    [imageFile, uploadLoading]
  );

  const mainBoxStyle = useMemo(
    () => ({
      position: "relative",
      width: "800px",
      height: "auto",
      overflow: "hidden",
      borderRadius: 2,
      boxShadow: 3,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }),
    []
  );

  const bannerBoxStyle = useMemo(
    () => ({
      position: "relative",
      width: "800px",
      height: "400px",
      margin: "auto",
      overflow: "hidden",
      borderRadius: 2,
      boxShadow: 3,
    }),
    []
  );

  const CurrentImage = React.memo(({ imageData }) => {
    if (!imageData) return null;
    
    return (
      <img 
        src={imageData} 
        alt={altText}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  });

  const UploadSection = useMemo(() => (
    <div className={styles.uploadSection}>
      <button
        className={styles.uploadButton}
        disabled={isUploadDisabled}
        onClick={handleUpload}
      >
        {uploadButtonText}
      </button>
    </div>
  ), [isUploadDisabled, handleUpload, uploadButtonText]);

  // Memoize banner header JSX
  const ImageHeader = useMemo(() => (
    <div className={styles.bannerHeader}>
      <div className={styles.bannerUpload}>
        <AddImage
          key={resetKey} // This will force component to remount and reset
          onImageChange={handleImageChange}
          initialImage={null}
        />
      </div>
    </div>
  ), [handleImageChange, resetKey]); // Include resetKey in dependencies

  // Memoize loading state
  if (isLoading) {
    return <div className={styles.loading}>Loading {title.toLowerCase()}...</div>;
  }

  if (!shouldFetch) {
    return <div className={styles.error}>No authentication token available</div>;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          ❌ Error loading {title.toLowerCase()}: {error.message}
        </div>
        <button className={styles.retryButton} onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <section className={styles.bannerSection}>
      <Box sx={mainBoxStyle}>
        {ImageHeader}
        {UploadSection}
      </Box>

      <div className={styles.bannerContent}>
        <Box sx={bannerBoxStyle}>
          {!imageData ? (
            <div className={styles.noBannersMessage}>
              {noImageMessage}
            </div>
          ) : (
            <CurrentImage imageData={imageData} />
          )}
        </Box>
      </div>
    </section>
  );
};

export default ImageUploadManager;