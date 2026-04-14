import React from 'react';
import ImageUploadManager from '../../global/ImageUploadManager';

const NewArrivalImage = () => {
  return (
    <ImageUploadManager
      title="New Arrival"
      fetchMethod="getNewArrivalImge"
      uploadMethod="postArrivalImage"
      swrKey="bannersArrival"
      imageFieldName="NewArrivalImage"
      altText="New Arrival Image"
      noImageMessage="No new arrival banners available. Upload your first banner above."
    />
  );
};

export default NewArrivalImage;