import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Grid,
  Chip,
  Modal,
  IconButton,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const DetailsTable = ({ mainData }) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: "", name: "" });
  const theme = useTheme();

  const details = mainData?.details || [];
  const orderDetails = mainData || {};

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(value || 0);
  };

  // Handle image click to open modal
  const handleImageClick = (imageUrl, itemName, event) => {
    event.stopPropagation();
    event.preventDefault();
    
    if (imageUrl) {
      setSelectedImage({ url: imageUrl, name: itemName });
      setShowImageModal(true);
    }
  };

  const handleCloseImageModal = (event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    
    setShowImageModal(false);
    setSelectedImage({ url: "", name: "" });
  };

  if (!details || details.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body1">No order details available</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box 
        sx={{ 
          p: 3, 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: 1
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: theme.palette.grey[800] }}>
                <TableCell sx={{ width: '80px', color: 'white', fontWeight: 'bold' }}>Image</TableCell>
                <TableCell sx={{ width: '100px', color: 'white', fontWeight: 'bold' }}>Item Code</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Item Name</TableCell>
                <TableCell sx={{ width: '80px', color: 'white', fontWeight: 'bold' }}>Color</TableCell>
                <TableCell sx={{ width: '80px', color: 'white', fontWeight: 'bold' }}>Size</TableCell>
                <TableCell sx={{ width: '60px', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Qty</TableCell>
                <TableCell sx={{ width: '100px', color: 'white', fontWeight: 'bold', textAlign: 'right' }}>Price</TableCell>
                <TableCell sx={{ width: '100px', color: 'white', fontWeight: 'bold', textAlign: 'right' }}>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {details.map((item, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                  <TableCell sx={{ textAlign: 'center', p: 2 }}>
                    {item.imageUrl ? (
                      <Box
                        sx={{
                          position: 'relative',
                          cursor: 'pointer',
                          display: 'inline-block'
                        }}
                        onClick={(event) => handleImageClick(item.imageUrl, item.itemName, event)}
                      >
                        <Box
                          component="img"
                          src={item.imageUrl}
                          alt={item.itemName}
                          sx={{
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: 1,
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0yMCAyMEg0MFY0MEgyMFYyMFoiIGZpbGw9IiNjY2MiLz4KPHRleHQgeD0iMzAiIHk9IjM1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5Ij5ObyBJbWFnZTwvdGV4dD4KPHN2Zz4K';
                          }}
                        />
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          width: '60px',
                          height: '60px',
                          backgroundColor: '#f0f0f0',
                          border: '1px solid #ddd',
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          color: '#999',
                          textAlign: 'center'
                        }}
                      >
                        No Image
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography 
                      component="code" 
                      sx={{ 
                        fontSize: '11px', 
                        fontFamily: 'monospace',
                        backgroundColor: '#f5f5f5',
                        padding: '2px 4px',
                        borderRadius: '3px'
                      }}
                    >
                      {item.itemCode}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold',
                        maxWidth: '200px',
                        fontSize: '12px'
                      }}
                    >
                      {item.itemName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.colorName}
                      size="small"
                      sx={{ fontSize: '10px' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={item.sizeName}
                      size="small"
                      sx={{ fontSize: '10px' }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right', fontSize: '12px' }}>
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell sx={{ textAlign: 'right' }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 'bold', 
                        color: '#28a745', 
                        fontSize: '12px' 
                      }}
                    >
                      {formatCurrency(item.price * item.quantity)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Footer rows */}
              <TableRow sx={{ backgroundColor: '#fff3cd' }}>
                <TableCell colSpan={6} sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Order Total:
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(orderDetails.totalValue)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              
              <TableRow sx={{ backgroundColor: '#d1ecf1' }}>
                <TableCell colSpan={6} sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Delivery Fees:
                </TableCell>
                <TableCell sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                  {formatCurrency(orderDetails.deliveryFees)}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
              
              <TableRow sx={{ backgroundColor: '#d4edda' }}>
                <TableCell colSpan={6} sx={{ textAlign: 'right', fontWeight: 'bold' }}>
                  Net Total:
                </TableCell>
                <TableCell sx={{ textAlign: 'right' }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontWeight: 'bold', 
                      color: '#155724', 
                      fontSize: '14px' 
                    }}
                  >
                    {formatCurrency(orderDetails.netTotalValue)}
                  </Typography>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        {/* Order Summary Information */}
        <Card sx={{ mt: 3, backgroundColor: '#f8f9fa' }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Customer:</strong> {orderDetails.custName || 'N/A'}<br />
                  <strong>Mobile:</strong> {orderDetails.custMobile}<br />
                  <strong>Payment:</strong> {orderDetails.typeText}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Total Items:</strong> {orderDetails.quantity}<br />
                  <strong>Governorate:</strong> {orderDetails.governorateName}<br />
                  <strong>Note:</strong> {orderDetails.note || 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>

      {/* Image Zoom Modal */}
      <Modal
        open={showImageModal}
        onClose={handleCloseImageModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Card sx={{ maxWidth: '90vw', maxHeight: '90vh', outline: 'none' }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            p: 2,
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Typography variant="h6" sx={{ fontSize: '16px' }}>
              {selectedImage.name}
            </Typography>
            <IconButton 
              onClick={handleCloseImageModal}
              size="small"
              sx={{ 
                border: 'none',
                background: 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          
          <Box sx={{ textAlign: 'center', p: 2 }}>
            {selectedImage.url && (
              <Box
                component="img"
                src={selectedImage.url}
                alt={selectedImage.name}
                sx={{
                  maxHeight: '70vh',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  border: '1px solid #ddd',
                  borderRadius: 1
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjZjBmMGYwIi8+CjxwYXRoIGQ9Ik0xNTAgMTUwSDI1MFYyNTBIMTUwVjE1MFoiIGZpbGw9IiNjY2MiLz4KPHR1eHQgeD0iMjAwIiB5PSIyMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiPkltYWdlIE5vdCBGb3VuZDwvdGV4dD4KPHN2Zz4K';
                }}
              />
            )}
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            p: 2,
            borderTop: '1px solid #e0e0e0'
          }}>
            <Box
              component="button"
              onClick={handleCloseImageModal}
              sx={{
                px: 3,
                py: 1,
                border: '1px solid #ccc',
                borderRadius: 1,
                backgroundColor: '#6c757d',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                '&:hover': {
                  backgroundColor: '#5a6268'
                }
              }}
            >
              Close
            </Box>
          </Box>
        </Card>
      </Modal>
    </>
  );
};

export default DetailsTable;