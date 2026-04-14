import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import styles from "../styles/image.module.css";
import uploadimg from "../assets/upload.jpg";

const AddImage = ({
  onImageChange,
  initialImage,
  acceptVideo = false,
  multiple = false,
  onMultipleFilesChange,
  maxFiles = 10,
  showPreview = true,
  uploadText = "Click to upload",
}) => {
  const [formDataimg, setFormDataimg] = useState({
    img: null,
  });
  const [multipleFiles, setMultipleFiles] = useState([]);
  const addFileInput = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (initialImage) {
      setImageUrl(initialImage);
    }
  }, [initialImage]);

  const handleLogo = useCallback(() => {
    addFileInput.current?.click();
  }, []);

  // Single file upload (original functionality)
  const previewUploadImage = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file type
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !(acceptVideo && isVideo)) {
        alert(
          `Please select a valid ${
            acceptVideo ? "image or video" : "image"
          } file`
        );
        return;
      }

      const previewLink = URL.createObjectURL(file);
      setImageUrl(previewLink);
      setFormDataimg({ img: file });

      if (onImageChange) {
        onImageChange(file, previewLink);
      }

      // Cleanup previous object URL
      return () => {
        if (previewLink) {
          URL.revokeObjectURL(previewLink);
        }
      };
    },
    [onImageChange, acceptVideo]
  );

  // Multiple files upload
  const previewMultipleFiles = useCallback(
    (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      // Validate file count
      if (files.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file types
      const invalidFiles = files.filter((file) => {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");
        return !isImage && !(acceptVideo && isVideo);
      });

      if (invalidFiles.length > 0) {
        alert(
          `Please select valid ${
            acceptVideo ? "image or video" : "image"
          } files only`
        );
        return;
      }

      // Create preview objects
      const filePromises = files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve({
              file,
              preview: e.target.result,
              type: file.type.startsWith("image/") ? "image" : "video",
              name: file.name,
              size: file.size,
              id: Math.random().toString(36).substr(2, 9),
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(filePromises).then((results) => {
        setMultipleFiles(results);
        if (onMultipleFilesChange) {
          onMultipleFilesChange(results);
        }
      });
    },
    [acceptVideo, maxFiles, onMultipleFilesChange]
  );

  // Remove file from multiple selection
  const removeFile = useCallback(
    (fileId) => {
      setMultipleFiles((prev) => {
        const updated = prev.filter((f) => f.id !== fileId);
        if (onMultipleFilesChange) {
          onMultipleFilesChange(updated);
        }
        return updated;
      });
    },
    [onMultipleFilesChange]
  );

  // Clear all files
  const clearAllFiles = useCallback(() => {
    setMultipleFiles([]);
    setImageUrl(null);
    setFormDataimg({ img: null });
    if (onMultipleFilesChange) {
      onMultipleFilesChange([]);
    }
  }, [onMultipleFilesChange]);

  // Get file type icon
  const getFileTypeIcon = useCallback((type) => {
    if (type === "image") return "🖼️";
    if (type === "video") return "🎥";
    return "📄";
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Determine accept attribute
  const acceptAttribute = useMemo(() => {
    if (acceptVideo) {
      return "image/*,video/*";
    }
    return "image/*";
  }, [acceptVideo]);

  // Single image display (original functionality)
  const SingleImageDisplay = useMemo(() => {
    if (!imageUrl) {
      return (
        <div onClick={handleLogo} className={styles.uploadContainer}>
          <img alt="Upload" src={uploadimg} className={styles.img} />
          <p className={styles.uploadText}>
            {uploadText}
            {acceptVideo && (
              <>
                <br />
                <small>(Images & Videos)</small>
              </>
            )}
          </p>
        </div>
      );
    }

    const isVideo =
      imageUrl &&
      (imageUrl.includes("video") ||
        formDataimg.img?.type?.startsWith("video/"));

    return (
      <div onClick={handleLogo} className={styles.previewContainer}>
        {isVideo ? (
          <video className={styles.uploadimges} src={imageUrl} controls muted />
        ) : (
          <img className={styles.uploadimges} src={imageUrl} alt="Preview" />
        )}
        <div className={styles.overlay}>
          <p>Click to change</p>
        </div>
      </div>
    );
  }, [imageUrl, handleLogo, uploadText, acceptVideo, formDataimg.img?.type]);

  // Multiple files display
  const MultipleFilesDisplay = useMemo(() => {
    return (
      <div className={styles.multipleContainer}>
        <div onClick={handleLogo} className={styles.uploadZone}>
          <img alt="Upload" src={uploadimg} className={styles.uploadIcon} />
          <p className={styles.uploadText}>
            {uploadText}
            {acceptVideo && (
              <>
                <br />
                <small>(Images & Videos)</small>
              </>
            )}
            <br />
            <small>Max {maxFiles} files</small>
          </p>
        </div>

        {multipleFiles.length > 0 && showPreview && (
          <div className={styles.filesPreview}>
            <div className={styles.filesHeader}>
              <h4>{multipleFiles.length} file(s) selected</h4>
              <button
                onClick={clearAllFiles}
                className={styles.clearAllBtn}
                type="button"
              >
                Clear All
              </button>
            </div>

            <div className={styles.filesGrid}>
              {multipleFiles.map((fileObj) => (
                <div key={fileObj.id} className={styles.filePreviewItem}>
                  <div className={styles.filePreview}>
                    {fileObj.type === "image" ? (
                      <img
                        src={fileObj.preview}
                        alt={fileObj.name}
                        className={styles.previewThumb}
                      />
                    ) : (
                      <video
                        src={fileObj.preview}
                        className={styles.previewThumb}
                        muted
                      />
                    )}
                    <div className={styles.fileTypeIcon}>
                      {getFileTypeIcon(fileObj.type)}
                    </div>
                  </div>

                  <div className={styles.fileInfo}>
                    <p className={styles.fileName} title={fileObj.name}>
                      {fileObj.name.length > 20
                        ? fileObj.name.substring(0, 20) + "..."
                        : fileObj.name}
                    </p>
                    <p className={styles.fileSize}>
                      {formatFileSize(fileObj.size)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileObj.id);
                    }}
                    className={styles.removeFileBtn}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }, [
    multipleFiles,
    showPreview,
    handleLogo,
    uploadText,
    acceptVideo,
    maxFiles,
    clearAllFiles,
    removeFile,
    getFileTypeIcon,
    formatFileSize,
  ]);

  return (
    <div className={styles.im}>
      <input
        className={`${styles.fileImg} input-file-js`}
        ref={addFileInput}
        id="input-file"
        name="img"
        type="file"
        accept={acceptAttribute}
        multiple={multiple}
        onChange={multiple ? previewMultipleFiles : previewUploadImage}
      />

      {multiple ? MultipleFilesDisplay : SingleImageDisplay}
    </div>
  );
};

export default React.memo(AddImage);