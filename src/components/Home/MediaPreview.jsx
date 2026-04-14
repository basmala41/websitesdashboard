import React, { useState, useEffect, useMemo } from "react";
import styles from "../../styles/editItems.module.css";

const MediaPreview = ({ selectedColor, videosEnabled }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const allMedia = useMemo(() => {
    if (!selectedColor) return [];
    
    const mediaArray = [
      ...(selectedColor.images || []).map((img) => ({
        ...img,
        type: "image",
        src: img.picLink,
      })),
    ];

    // Only add videos if enabled
    if (videosEnabled) {
      mediaArray.push(...(selectedColor.videos || []).map((vid) => ({
        ...vid,
        type: "video",
        src: vid.videoLink,
      })));
    }

    return mediaArray;
  }, [selectedColor, videosEnabled]);

  // Reset index when selectedColor changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedColor]);

  if (!allMedia.length) {
    return (
      <div className={styles.previewSection}>
        <h3>Preview</h3>
        <p>No media to show</p>
      </div>
    );
  }

  const currentMedia = allMedia[currentIndex];

  return (
    <div className={styles.previewSection}>
      <h3>Preview ({allMedia.length} items)</h3>
      <div className={styles.carousel}>
        <div className={styles.mainPreview}>
          {currentMedia.type === "image" ? (
            <img
              src={currentMedia.src}
              alt="Preview"
              className={styles.previewMedia}
            />
          ) : (
            <video
              src={currentMedia.src}
              className={styles.previewMedia}
              controls
            />
          )}
        </div>

        <div className={styles.thumbnails}>
          {allMedia.map((media, index) => (
            <div
              key={`${media.type}-${media.id}`}
              className={`${styles.thumbnail} ${
                index === currentIndex ? styles.active : ""
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              {media.type === "image" ? (
                <img src={media.src} alt="" />
              ) : (
                <video src={media.src} />
              )}
              <span className={styles.mediaTypeLabel}>{media.type}</span>
            </div>
          ))}
        </div>

        <div className={styles.carouselControls}>
          <button
            onClick={() =>
              setCurrentIndex((prev) =>
                prev > 0 ? prev - 1 : allMedia.length - 1
              )
            }
            className={styles.carouselBtn}
          >
            Previous
          </button>
          <span>
            {currentIndex + 1} of {allMedia.length}
          </span>
          <button
            onClick={() =>
              setCurrentIndex((prev) =>
                prev < allMedia.length - 1 ? prev + 1 : 0
              )
            }
            className={styles.carouselBtn}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
export default React.memo(MediaPreview);