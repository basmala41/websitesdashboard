import React, { useState, useEffect } from 'react';
import AddImage from '../../global/AddImage'; // Assuming this is the path to your AddImage component
import styles from '../../styles/video.module.css'; // You'll need to create this CSS file
import useAuthStore from '../../store/authStore';
import apiService from '../../services/apiService';

const HomeVideo = () => {
  const [videoData, setVideoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
const {user} = useAuthStore()
  // Fetch video data on component mount
  useEffect(() => {
    fetchVideo();
  }, []);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getHomeVideo(user.token);
      
      if (response.success && response.data) {
        setVideoData(response.data);
      } else {
        setVideoData(null);
      }
      
      if (!response.success && response.message) {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error fetching video:', err);
      setError('Failed to load video. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUpload = async (file) => {
    try {
      setUploading(true);
      setError(null);

      const response = await apiService.uploadHomeVideo(file, user.token);

      if (response.success) {
        // Refresh video data after successful upload
        await fetchVideo();
        setError(null);
      } else {
        setError(response.message || 'Failed to upload video. Please try again.');
      }
    } catch (err) {
      console.error('Error uploading video:', err);
      setError('Failed to upload video. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleVideoDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      const response = await apiService.deleteHomeVideo(user.token);

      if (response.success) {
        setVideoData(null);
        setError(null);
      } else {
        setError(response.message || 'Failed to delete video. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      setError('Failed to delete video. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading video...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Home Video Management</h2>
        <p>Manage the main video displayed on your home page</p>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
          <button 
            className={styles.errorClose} 
            onClick={() => setError(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.content}>
        <div>
        <div className={styles.uploadSection}>
          <h3>{videoData ? 'Replace Video' : 'Upload Video'}</h3>
          
          <AddImage
            onImageChange={handleVideoUpload}
            acceptVideo={true}
            multiple={false}
            showPreview={false}
            uploadText={uploading ? "Uploading..." : "Click to upload video"}
          />
          
          {uploading && (
            <div className={styles.uploadProgress}>
              <div className={styles.progressBar}>
                <div className={styles.progressFill}></div>
              </div>
              <p>Uploading video, please wait...</p>
            </div>
          )}
        </div>

        <div className={styles.guidelines}>
          <h4>📋 Video Guidelines</h4>
          <ul>
            <li>Recommended formats: MP4, WebM, MOV</li>
            <li>Maximum file size: 50MB</li>
            <li>Recommended resolution: 1920x1080 (Full HD)</li>
            <li>Keep video duration under 2 minutes for better performance</li>
            <li>Ensure video content is appropriate for your audience</li>
          </ul>
        </div>
        </div>
        {videoData ? (
          <div className={styles.videoSection}>
            <div className={styles.videoContainer}>
              <video
                src={videoData}
                controls
                className={styles.video}
                poster="" // You can add a poster image if needed
              >
                Your browser does not support the video tag.
              </video>
            </div>
            
            <div className={styles.videoActions}>
              <button
                onClick={handleVideoDelete}
                disabled={deleting}
                className={`${styles.deleteBtn} ${deleting ? styles.loading : ''}`}
              >
                {deleting ? (
                  <>
                    <span className={styles.spinner}></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <span className={styles.deleteIcon}>🗑️</span>
                    Delete Video
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.noVideo}>
            <div className={styles.noVideoIcon}>🎥</div>
            <h3>No video uploaded</h3>
            <p>Upload a video to display on your home page</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default HomeVideo;