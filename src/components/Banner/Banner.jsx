import React, { useCallback, useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import useAuthStore from "../../store/authStore";
import apiService from "../../services/apiService";
import styles from "../../styles/banner.module.css";
import { Box, IconButton } from "@mui/material";
import { ChevronLeft, ChevronRight, Trash } from "lucide-react";
import AddImage from "../../global/AddImage";

const fetcher = async (token) => {
  try {
    return await apiService.getBanners(token);
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

const BannerThumbnail = React.memo(({ banner, onDelete }) => (
  <div key={banner.id} className={styles.bannerItem}>
    <img
      src={banner.picLink}
      alt={banner.id}
      className={styles.bannerThumbnail}
    />
    <Trash
      size={16}
      className={styles.deleteIcon}
      onClick={() => onDelete(banner.id)}
    />
  </div>
));

const CurrentBanner = React.memo(({ banner, index }) => {
  if (!banner) return null;
  
  return (
    <img 
      src={banner.picLink} 
      alt={`Slide ${index}`}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
    />
  );
});

// Memoized NavigationButton component
const NavigationButton = React.memo(({ onClick, direction, style }) => {
  const Icon = direction === 'left' ? ChevronLeft : ChevronRight;
  
  return (
    <IconButton onClick={onClick} sx={style}>
      <Icon />
    </IconButton>
  );
});

const Banner = () => {
  const { user } = useAuthStore();
  const shouldFetch = user?.token;
  const [uploadLoading, setUploadLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [index, setIndex] = useState(0);
  const [addImageKey, setAddImageKey] = useState(0);

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `banners-${user.token}` : null,
    () => fetcher(user.token),
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error("SWR Error:", error);
      },
    }
  );

  // Memoize banners array to prevent unnecessary re-renders
  const banners = useMemo(() => data?.data || [], [data?.data]);

  // Reset index when banners change to prevent out-of-bounds errors
  useEffect(() => {
    if (banners.length > 0 && index >= banners.length) {
      setIndex(0);
    }
  }, [banners.length, index]);

  // Memoize navigation handlers with improved logic
  const handlePrev = useCallback(() => {
    setIndex((prev) => {
      if (banners.length === 0) return 0;
      return prev === 0 ? banners.length - 1 : prev - 1;
    });
  }, [banners.length]);

  const handleNext = useCallback(() => {
    setIndex((prev) => {
      if (banners.length === 0) return 0;
      return prev === banners.length - 1 ? 0 : prev + 1;
    });
  }, [banners.length]);

  // Optimize handleImageChange - already well optimized
  const handleImageChange = useCallback((file, preview) => {
    setImageFile(file);
    setPreviewUrl(preview);
  }, []);

  // Memoize delete handler - already well optimized
  const handleDeleteBanner = useCallback(
    async (id) => {
      try {
        const result = await apiService.deleteBanner(id, user.token);
        if (result.success) {
          mutate();
          // Adjust index if current banner is deleted
          setIndex(prev => {
            const newLength = banners.length - 1;
            if (newLength === 0) return 0;
            if (prev >= newLength) return newLength - 1;
            return prev;
          });
        }
      } catch (error) {
        console.error("Error deleting banner:", error);
      }
    },
    [user.token, mutate, banners.length]
  );

  // Memoize upload handler with better state management
  const handleUpload = useCallback(async () => {
    if (!imageFile) return;

    setUploadLoading(true);
    try {
      const result = await apiService.postBanner(
        { BannerImages: imageFile },
        user.token
      );
      if (result.success) {
        await mutate(); // Wait for mutation to complete
        setImageFile(null);
        setPreviewUrl(null);
        setAddImageKey((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error uploading banner:", error);
    } finally {
      setUploadLoading(false);
    }
  }, [imageFile, user.token, mutate]);

  // Memoize retry handler
  const handleRetry = useCallback(() => {
    mutate();
  }, [mutate]);

  // Memoize current banner for display
  const currentBanner = useMemo(() => 
    banners.length > 0 ? banners[index] : null, 
    [banners, index]
  );

  // Memoize banner thumbnails with improved performance
  const bannerThumbnails = useMemo(() => {
    if (!banners.length) {
      return <div className={styles.noBanners}>No banners available</div>;
    }

    return banners.map((banner) => (
      <BannerThumbnail 
        key={banner.id} 
        banner={banner} 
        onDelete={handleDeleteBanner} 
      />
    ));
  }, [banners, handleDeleteBanner]);

  // Memoize upload button text
  const uploadButtonText = useMemo(() => 
    uploadLoading ? "Uploading..." : "Upload",
    [uploadLoading]
  );

  // Memoize upload button disabled state
  const isUploadDisabled = useMemo(() => 
    !imageFile || uploadLoading,
    [imageFile, uploadLoading]
  );

  // Memoize navigation button styles - already well optimized
  const navigationButtonStyle = useMemo(
    () => ({
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
      backgroundColor: "rgba(255,255,255,0.6)",
      "&:hover": { backgroundColor: "white" },
      zIndex: 2,
    }),
    []
  );

  const leftButtonStyle = useMemo(
    () => ({
      ...navigationButtonStyle,
      left: "10px",
    }),
    [navigationButtonStyle]
  );

  const rightButtonStyle = useMemo(
    () => ({
      ...navigationButtonStyle,
      right: "10px",
    }),
    [navigationButtonStyle]
  );

  // Memoize main box styles - already well optimized
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

  // Memoize upload section JSX
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
  const BannerHeader = useMemo(() => (
    <div className={styles.bannerHeader}>
      {bannerThumbnails}
      <div className={styles.bannerUpload}>
        <AddImage
          key={addImageKey}
          onImageChange={handleImageChange}
          initialImage={null}
        />
      </div>
    </div>
  ), [bannerThumbnails, addImageKey, handleImageChange]);

  // Memoize loading state
  if (isLoading) {
    return <div className={styles.loading}>Loading banners...</div>;
  }

  if (!shouldFetch) {
    return <div className={styles.error}>No authentication token available</div>;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          ❌ Error loading banners: {error.message}
        </div>
        <button className={styles.retryButton} onClick={handleRetry}>
          Retry
        </button>
      </div>
    );
  }

  // Show message when no banners and no upload in progress
  const showNoBannersMessage = banners.length === 0 && !uploadLoading;

  return (
    <section className={styles.bannerSection}>
      <Box sx={mainBoxStyle}>
        {BannerHeader}
        {UploadSection}
      </Box>

      <div className={styles.bannerContent}>
        <Box sx={bannerBoxStyle}>
          {showNoBannersMessage ? (
            <div className={styles.noBannersMessage}>
              No banners available. Upload your first banner above.
            </div>
          ) : (
            <>
              <CurrentBanner banner={currentBanner} index={index} />
              {banners.length > 1 && (
                <>
                  <NavigationButton 
                    onClick={handlePrev} 
                    direction="left" 
                    style={leftButtonStyle} 
                  />
                  <NavigationButton 
                    onClick={handleNext} 
                    direction="right" 
                    style={rightButtonStyle} 
                  />
                </>
              )}
            </>
          )}
        </Box>
      </div>
    </section>
  );
};

export default React.memo(Banner);