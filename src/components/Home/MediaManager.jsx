import React, { useState, useEffect, useCallback } from "react";
import apiService from "../../services/apiService";
import AddImage from "../../global/AddImage";
import styles from "../../styles/editItems.module.css";
import { buildImageUrl } from "../../constants/config";

const MediaManager = ({ 
  productColors, 
  itemId, 
  token, 
  onUpdate, 
  appOptions, 
  selectedColor, 
  onColorSelect
}) => {
  const [uploadFiles, setUploadFiles] = useState([]);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [resetKey, setResetKey] = useState(0); // Key to force AddImage reset

  const videosEnabled = appOptions?.itemsVideo === 1;

  const handleColorSelect = useCallback((color) => {
    onColorSelect(color);
    // Clear upload state when switching colors
    setUploadFiles([]);
    setSelectedFiles([]);
    setAltText("");
  }, [onColorSelect]);

  // Handle multiple file selection (images + videos if enabled)
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      return isImage || (videosEnabled && isVideo);
    });

    const filePromises = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            file,
            preview: e.target.result,
            type: file.type.startsWith("image/") ? "image" : "video",
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then((results) => {
      setUploadFiles((prev) => [...prev, ...results]);
    });
  }, [videosEnabled]);

  const handleSingleFileAdd = useCallback((file, preview) => {
    const type = file.type.startsWith("image/") ? "image" : "video";
    if (type === "video" && !videosEnabled) return;
    
    setUploadFiles((prev) => [...prev, { file, preview, type }]);

    setResetKey(prev => prev + 1);
  }, [videosEnabled]);

  const handleFileRemove = useCallback((index) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ✅ Fixed: Improved file deletion with proper success checking
  const handleFileDelete = useCallback(
    async (fileId, isVideo = false) => {
      try {
        const endpoint = isVideo
          ? "/Item/deleteItemVideo"
          : "/Item/deleteItemPic";
        const payload = isVideo
          ? { videoId: fileId, token }
          : { picId: fileId, token };

        const url = buildImageUrl(endpoint);
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
console.log(response);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        // ✅ Parse response and check for success
        const result = await response.json();
        console.log(result);
        if (result.success || response.ok) {
          onUpdate();
        } else {
          throw new Error(result.message || 'Delete operation failed');
        }

      } catch (error) {
        console.error("Error deleting file:", error);
        // Optionally show user-friendly error message
      }
    },
    [token, onUpdate]
  );

  const handleSetPrimary = useCallback(
    async (fileId, isVideo = false) => {
      try {
        const endpoint = isVideo
          ? `/admin/VideoDetails/setDefaultVideo`
          : `/admin/ImageDetails/setDefaultImage`;

        const response = await apiService.post(endpoint, {}, token, {
          itemCode: itemId,
          [isVideo ? "videoId" : "picId"]: fileId,
        });

        // ✅ Fixed: Only call onUpdate if response is successful
        if (response.success) {
          onUpdate();
        } 
      } catch (error) {
        console.error("Error setting primary file:", error);
      }
    },
    [itemId, token, onUpdate]
  );

  const handleSubmitFiles = useCallback(async () => {
    if (!selectedColor || !uploadFiles.length) return;

    setUploading(true);

    try {
      // Separate images and videos
      const images = uploadFiles.filter((f) => f.type === "image");
      const videos = videosEnabled ? uploadFiles.filter((f) => f.type === "video") : [];

      // Track successful uploads
      const uploadResults = [];

      // Upload images
      if (images.length > 0) {
        const imageFormData = new FormData();
        imageFormData.append("token", token);
        imageFormData.append("ItemCode", itemId);
        imageFormData.append("ItemColor", selectedColor.itemColor);
        imageFormData.append("AltText", altText);

        images.forEach(({ file }) => {
          imageFormData.append("ItemColorImages", file);
        });

        const imageResult = await apiService.uploadImage("/Item/addItemPic", imageFormData, token);
        uploadResults.push(imageResult);
      }

      // Upload videos (only if enabled)
      if (videos.length > 0 && videosEnabled) {
        const videoFormData = new FormData();
        videoFormData.append("token", token);
        videoFormData.append("ItemCode", itemId);
        videoFormData.append("ItemColor", selectedColor.itemColor);

        videos.forEach(({ file }) => {
          videoFormData.append("ItemColorVideos", file);
        });

        const videoResult = await apiService.uploadImage("/Item/addItemVideo", videoFormData, token);
        uploadResults.push(videoResult);
      }

      // ✅ Fixed: Check if all uploads were successful before updating
      const allSuccessful = uploadResults.every(result => result.success);
      
      if (allSuccessful) {

        // Update data first to get fresh data
        await onUpdate();
        
        // Then clear state after a small delay to ensure data is refreshed
        setTimeout(() => {
          setUploadFiles([]);
          setAltText("");
          
          // Clear file input
          const fileInput = document.getElementById("multi-file-input");
          if (fileInput) {
            fileInput.value = "";
          }
        }, 100);

      }

    } catch (error) {
      console.error("Error uploading files:", error);
      // Optionally show user-friendly error message
    } finally {
      setUploading(false);
    }
  }, [selectedColor, uploadFiles, altText, itemId, token, onUpdate, videosEnabled]);

  // Clear file input when uploadFiles is cleared
  useEffect(() => {
    if (uploadFiles.length === 0) {
      const fileInput = document.getElementById("multi-file-input");
      if (fileInput) {
        fileInput.value = "";
      }
    }
  }, [uploadFiles.length]);

  // Generate accept attribute based on video settings
  const acceptedFiles = videosEnabled ? "image/*,video/*" : "image/*";
  const mediaTypeText = videosEnabled ? "Images & Videos" : "Images";

  return (
    <div className={styles.mediaSection}>
      <h3>Item Media ({mediaTypeText})</h3>

      <div className={styles.colorSection}>
        <h4>Choose color to upload</h4>
        <div className={styles.colorGrid}>
          {productColors?.map((color) => (
            <div
              key={color.itemColor}
              className={`${styles.colorItem} ${
                selectedColor?.itemColor === color.itemColor
                  ? styles.selected
                  : ""
              }`}
              style={{ backgroundColor: `#${color.colorHex}` }}
              onClick={() => handleColorSelect(color)}
            />
          ))}
        </div>
      </div>

      {selectedColor && (
        <>
          <p>Upload media for {selectedColor.colorName} color</p>

          <div className={styles.inputGroup}>
            <label>Alt Text (for images)</label>
            <input
              type="text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              className={styles.input}
              placeholder="Describe the images for accessibility"
            />
          </div>

          <div className={styles.uploadSection}>
            <input
              type="file"
              multiple
              accept={acceptedFiles}
              onChange={handleFileSelect}
              className={styles.fileInput}
              id="multi-file-input"
            />
            <label htmlFor="multi-file-input" className={styles.uploadLabel}>
              Select Multiple {mediaTypeText}
            </label>
          </div>

          <div className={styles.mediaGrid}>
            {selectedColor.images?.map((image) => (
              <div
                key={`img-${image.id}`}
                className={`${styles.mediaItem} ${
                  selectedFiles.includes(image.id) ? styles.selected : ""
                }`}
              >
                <div className={styles.mediaPreview}>
                  <img src={image.picLink} alt="" className={styles.media} />
                  <div className={styles.mediaType}>IMAGE</div>
                  {image.isDefualtPic && (
                    <div className={styles.primaryBadge}>PRIMARY</div>
                  )}
                </div>
                <div className={styles.mediaActions}>
                  <button
                    onClick={() => handleFileDelete(image.id, false)}
                    className={styles.deleteBtn}
                    disabled={uploading}
                  >
                    Delete
                  </button>
                  {!image.isDefualtPic && (
                    <button
                      onClick={() => handleSetPrimary(image.id, false)}
                      className={styles.primaryBtn}
                      disabled={uploading}
                    >
                      Set Primary
                    </button>
                  )}
                </div>
              </div>
            ))}

            {videosEnabled && selectedColor.videos?.map((video) => (
              <div
                key={`vid-${video.id}`}
                className={`${styles.mediaItem} ${
                  selectedFiles.includes(video.id) ? styles.selected : ""
                }`}
              >
                <div className={styles.mediaPreview}>
                  <video
                    src={video.videoLink}
                    className={styles.media}
                    controls
                  />
                  <div className={styles.mediaType}>VIDEO</div>
                  {video.isDefault && (
                    <div className={styles.primaryBadge}>PRIMARY</div>
                  )}
                </div>
                <div className={styles.mediaActions}>
                  <button
                    onClick={() => handleFileDelete(video.id, true)}
                    className={styles.deleteBtn}
                    disabled={uploading}
                  >
                    Delete
                  </button>
                  {!video.isDefault && (
                    <button
                      onClick={() => handleSetPrimary(video.id, true)}
                      className={styles.primaryBtn}
                      disabled={uploading}
                    >
                      Set Primary
                    </button>
                  )}
                </div>
              </div>
            ))}

            {uploadFiles.map((file, index) => (
              <div key={`new-${index}`} className={styles.mediaItem}>
                <div className={styles.mediaPreview}>
                  {file.type === "image" ? (
                    <img src={file.preview} alt="" className={styles.media} />
                  ) : (
                    <video
                      src={file.preview}
                      className={styles.media}
                      controls
                    />
                  )}
                  <div className={styles.mediaType}>
                    {file.type.toUpperCase()} (NEW)
                  </div>
                </div>
                <button
                  onClick={() => handleFileRemove(index)}
                  className={styles.deleteBtn}
                  disabled={uploading}
                >
                  Remove
                </button>
              </div>
            ))}

            <AddImage 
             key={resetKey}
              onImageChange={handleSingleFileAdd} 
              acceptVideo={videosEnabled}
            />
          </div>

          {uploadFiles.length > 0 && !uploading && (
            <button
              onClick={handleSubmitFiles}
              disabled={uploading}
              className={styles.submitBtn}
            >
              {uploading
                ? "Uploading..."
                : `Upload ${uploadFiles.length} Files`}
            </button>
          )}
          
          {uploading && (
            <div className={styles.uploadingIndicator}>
              <p>Uploading {uploadFiles.length} files...</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default React.memo(MediaManager);