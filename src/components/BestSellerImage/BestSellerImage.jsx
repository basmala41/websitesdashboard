import React from 'react';
import ImageUploadManager from '../../global/ImageUploadManager';

const BestSellerImage = () => {
  return (
    <ImageUploadManager
      title="Best Seller"
      fetchMethod="getBestSellerImge"
      uploadMethod="postSellerImage"
      swrKey="bannersSeller"
      imageFieldName="BestSellerImage"
      altText="Best Seller Image"
      noImageMessage="No best seller banners available. Upload your first banner above."
    />
  );
};

export default BestSellerImage;