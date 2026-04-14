
import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Card,
  CardContent,
  CardMedia,
  Paper,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  FormHelperText,
  Snackbar,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import apiService from "../../services/apiService";
import useAuthStore from "../../store/authStore";
import AddImage from "../../global/AddImage";
import useSWR from "swr";
import { toast, ToastContainer } from "react-toastify";

// Constants for better maintainability
const NOTIFICATION_CONFIG = {
  SWR_KEY: 'notifications',
  DEDUPING_INTERVAL: 300000, // 5 minutes
  FORM_FIELDS: {
    MOBILE: 'mobile',
    TITLE: 'title',
    BODY: 'body'
  },
  API_FIELDS: {
    MSG_TYPE: 'MsgType',
    MSG_TITLE: 'MsgTitle',
    MSG_BODY: 'MsgBody',
    ITEM_CODE: 'ItemCode',
    NOTIFICATION_IMAGE: 'NotificationImage'
  },
  VALIDATION_MESSAGES: {
    REQUIRED_FIELDS: "Please fill in all required fields",
    SELECT_ITEM: "Please select an item",
    RESET_SUCCESS: "Form reset successfully",
    SEND_SUCCESS_ALL: "Notification sent successfully to all users!",
    SEND_SUCCESS_USER: "Notification sent successfully to {mobile}!",
    SEND_ERROR: "Failed to send notification. Please try again."
  }
};

// Utility functions for better code organization
const NotificationUtils = {
  // Validation utilities
  validateFormData: (formData, selectedNotificationType, selectedItem, shouldShowItemSelect) => {
    const hasRequiredFields = formData.title.trim() && formData.body.trim() && selectedNotificationType;
    const hasRequiredItem = !shouldShowItemSelect || selectedItem;
    return hasRequiredFields && hasRequiredItem;
  },

  // Data transformation utilities
  prepareNotificationFormData: (selectedNotificationType, formData, selectedItem, imageFile) => {
    const notificationData = new FormData();
    notificationData.append(NOTIFICATION_CONFIG.API_FIELDS.MSG_TYPE, selectedNotificationType);
    notificationData.append(NOTIFICATION_CONFIG.API_FIELDS.MSG_TITLE, formData.title);
    notificationData.append(NOTIFICATION_CONFIG.API_FIELDS.MSG_BODY, formData.body);
    
    if (selectedItem) {
      const itemCode = selectedItem.itemCode || selectedItem.id || selectedItem.value;
      notificationData.append(NOTIFICATION_CONFIG.API_FIELDS.ITEM_CODE, itemCode);
    }
    
    if (imageFile) {
      notificationData.append(NOTIFICATION_CONFIG.API_FIELDS.NOTIFICATION_IMAGE, imageFile);
    }

    return notificationData;
  },

  // Error handling utilities
  getErrorMessage: (error) => {
    const errorMap = {
      'timeout': "Request timed out. Please check your connection and try again.",
      '401': "Authentication failed. Please log in again.",
      '403': "You don't have permission to send notifications.",
      'network': "Network error. Please check your connection."
    };

    const errorString = error.message.toLowerCase();
    for (const [key, message] of Object.entries(errorMap)) {
      if (errorString.includes(key)) return message;
    }
    
    return error.message || NOTIFICATION_CONFIG.VALIDATION_MESSAGES.SEND_ERROR;
  },

  // Success message utilities
  getSuccessMessage: (hasMobile, mobile) => {
    return hasMobile 
      ? NOTIFICATION_CONFIG.VALIDATION_MESSAGES.SEND_SUCCESS_USER.replace('{mobile}', mobile)
      : NOTIFICATION_CONFIG.VALIDATION_MESSAGES.SEND_SUCCESS_ALL;
  }
};

// Custom hook for notification operations
const useNotificationOperations = (user) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createNotification = useCallback(async (notificationData) => {
    const response = await apiService.addNotification(notificationData, user.token);
    if (!response?.success) {
      throw new Error(response?.message || "Failed to create notification");
    }
const parsed = JSON.parse(response.data?.data);
    const docNo = parsed.data || response.DocNo;
    if (!docNo) {
      throw new Error("No DocNo received from notification creation");
    }

    return docNo;
  }, [user.token]);

  const sendNotification = useCallback(async (docNo, mobile) => {
    const hasMobile = mobile?.trim();
    
    const response = hasMobile 
      ? await apiService.sendNotificationToUser(mobile, docNo, user.token)
      : await apiService.sendNotificationToAll(docNo, user.token);

    if (!response?.success) {
      throw new Error(response?.message || "Failed to send notification");
    }

    return { success: true, hasMobile, mobile };
  }, [user.token]);

  const processNotification = useCallback(async (notificationData, mobile, onSuccess, onError) => {
    setIsSubmitting(true);

    try {
      const docNo = await createNotification(notificationData);

      const result = await sendNotification(docNo, mobile);
      
      const successMessage = NotificationUtils.getSuccessMessage(result.hasMobile, result.mobile);
      onSuccess(successMessage);

    } catch (error) {
      const errorMessage = NotificationUtils.getErrorMessage(error);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [createNotification, sendNotification]);

  return { processNotification, isSubmitting };
};

// Fetcher function with error handling
const createFetcher = (token) => async () => {
  try {
    const response = await apiService.getNotificationCodes(token);
    return response;
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: "fit-content",
}));

const NotificationPreview = styled(Card)(({ theme }) => ({
  maxWidth: 320,
  margin: theme.spacing(2, 0),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[4],
  border: `1px solid ${theme.palette.divider}`,
}));

const StickyContainer = styled(Box)(({ theme }) => ({
  position: "sticky",
  top: theme.spacing(2),
}));

// Memoized components
const NotificationTypeSelect = React.memo(({ 
  value, 
  onChange, 
  options, 
  disabled 
}) => (
  <FormControl fullWidth margin="normal">
    <InputLabel>Message Type *</InputLabel>
    <Select
      value={value}
      label="Message Type *"
      onChange={onChange}
      disabled={disabled}
    >
      <MenuItem value="">
        <em>Choose Type</em>
      </MenuItem>
      {options.map((noti) => (
        <MenuItem key={noti.code} value={noti.code}>
          {noti.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
));

const ItemSelector = React.memo(({ 
  items, 
  selectedItem, 
  onChange, 
  loading, 
  error,
  required = false 
}) => (
  <Autocomplete
    options={items || []}
    getOptionLabel={(option) => {
      if (!option) return "";
      return option.label || option.name || option.itemCode || option.title || "";
    }}
    value={selectedItem || null}
    onChange={(_, newValue) => onChange(newValue)}
    renderInput={(params) => (
      <TextField
        {...params}
        label={`Select Item${required ? " *" : ""}`}
        placeholder="Choose an item"
        margin="normal"
        fullWidth
        error={!!error}
        helperText={error}
        InputProps={{
          ...params.InputProps,
          endAdornment: (
            <>
              {loading && <CircularProgress color="inherit" size={20} />}
              {params.InputProps.endAdornment}
            </>
          ),
        }}
      />
    )}
    loading={loading}
    isOptionEqualToValue={(option, value) => {
      if (!option || !value) return false;
      return (
        option.value === value.value || 
        option.itemCode === value.itemCode ||
        option.id === value.id
      );
    }}
    noOptionsText={loading ? "Loading..." : "No items found"}
    clearOnEscape
  />
));

const PreviewCard = React.memo(({ title, body, imageUrl, itemImageUrl }) => {
  const displayImage = itemImageUrl || imageUrl;

  return (
    <NotificationPreview>
      {displayImage && (
        <CardMedia
          component="img"
          height="160"
          image={displayImage}
          alt="Notification"
          sx={{ objectFit: "cover" }}
        />
      )}

      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <NotificationsIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
          <Typography
            variant="subtitle1"
            component="div"
            fontWeight="bold"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {title || "Notification Title"}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {body || "Notification message will appear here..."}
        </Typography>
      </CardContent>
    </NotificationPreview>
  );
});

// Custom hook for form management
const useNotificationForm = () => {
  const [formData, setFormData] = useState({
    [NOTIFICATION_CONFIG.FORM_FIELDS.MOBILE]: "",
    [NOTIFICATION_CONFIG.FORM_FIELDS.TITLE]: "",
    [NOTIFICATION_CONFIG.FORM_FIELDS.BODY]: "",
  });

  const handleFieldChange = useCallback((field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      [NOTIFICATION_CONFIG.FORM_FIELDS.MOBILE]: "",
      [NOTIFICATION_CONFIG.FORM_FIELDS.TITLE]: "",
      [NOTIFICATION_CONFIG.FORM_FIELDS.BODY]: "",
    });
  }, []);

  return { formData, handleFieldChange, resetForm };
};

// Custom hook for items management
const useItemsManagement = (shouldShowItemSelect, user) => {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");

  const fetchItems = useCallback(async () => {
    if (!shouldShowItemSelect || !user?.token) {
      setItems([]);
      return;
    }

    setItemsLoading(true);
    setItemsError("");

    try {
      const result = await apiService.getItemDropdown(user.token);
      setItems(result?.data || []);
    } catch (error) {
      setItemsError("Failed to load items");
      setItems([]);
      toast.error("Failed to load items");
    } finally {
      setItemsLoading(false);
    }
  }, [shouldShowItemSelect, user?.token]);

  useEffect(() => {
    fetchItems();
    setSelectedItem(null);
  }, [fetchItems]);

  const handleSelectedItemChange = useCallback((newValue) => {
    setSelectedItem(newValue);
    setItemsError("");
  }, []);

  return {
    items,
    selectedItem,
    itemsLoading,
    itemsError,
    handleSelectedItemChange
  };
};

// Main component
const Notification = () => {
  const { user } = useAuthStore();
  const shouldFetch = Boolean(user?.token);

  // Custom hooks
  const { formData, handleFieldChange, resetForm } = useNotificationForm();
  const { processNotification, isSubmitting } = useNotificationOperations(user);

  // State management
  const [selectedNotificationType, setSelectedNotificationType] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // SWR for notification codes
  const { data, isLoading: notificationLoading } = useSWR(
    shouldFetch ? `${NOTIFICATION_CONFIG.SWR_KEY}-${user.token}` : null,
    createFetcher(user.token),
    {
      revalidateOnFocus: false,
      dedupingInterval: NOTIFICATION_CONFIG.DEDUPING_INTERVAL,
      onError: (error) => {
        console.error("SWR Error:", error);
      },
    }
  );

  // Memoized values
  const notificationCodes = useMemo(() => data?.data || [], [data?.data]);

  const selectedNotificationOptions = useMemo(() => {
    if (!selectedNotificationType || !notificationCodes.length) return null;
    return notificationCodes.find(
      (notification) => notification.code === selectedNotificationType
    );
  }, [selectedNotificationType, notificationCodes]);

  const shouldShowItemSelect = useMemo(() => {
    return selectedNotificationOptions?.itemFlage === 1;
  }, [selectedNotificationOptions]);

  const shouldShowImageUpload = useMemo(() => {
    return selectedNotificationOptions?.imageFlage === 1;
  }, [selectedNotificationOptions]);

  // Items management
  const {
    items,
    selectedItem,
    itemsLoading,
    itemsError,
    handleSelectedItemChange
  } = useItemsManagement(shouldShowItemSelect, user);

  // Form validation
  const isFormValid = useMemo(() => {
    return NotificationUtils.validateFormData(
      formData, 
      selectedNotificationType, 
      selectedItem, 
      shouldShowItemSelect
    );
  }, [formData, selectedNotificationType, selectedItem, shouldShowItemSelect]);

  const itemSelectError = useMemo(() => {
    if (shouldShowItemSelect && selectedNotificationType && !selectedItem) {
      return NOTIFICATION_CONFIG.VALIDATION_MESSAGES.SELECT_ITEM;
    }
    return itemsError;
  }, [shouldShowItemSelect, selectedNotificationType, selectedItem, itemsError]);

  // Handlers
  const handleNotificationTypeChange = useCallback((e) => {
    const value = e.target.value;
    setSelectedNotificationType(value);
    // Reset dependent states
    setImageFile(null);
    setPreviewUrl(null);
  }, []);

  const handleImageChange = useCallback((file, preview) => {
    setImageFile(file);
    setPreviewUrl(preview);
  }, []);

  const handleReset = useCallback(() => {
    resetForm();
    setImageFile(null);
    setPreviewUrl(null);
    setSelectedNotificationType("");
    toast.success(NOTIFICATION_CONFIG.VALIDATION_MESSAGES.RESET_SUCCESS);
  }, [resetForm]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) {
      toast.error(NOTIFICATION_CONFIG.VALIDATION_MESSAGES.REQUIRED_FIELDS);
      return;
    }

    const notificationData = NotificationUtils.prepareNotificationFormData(
      selectedNotificationType,
      formData,
      selectedItem,
      imageFile
    );

    await processNotification(
      notificationData,
      formData.mobile,
      (successMessage) => {
        toast.success(successMessage);
        handleReset();
      },
      (errorMessage) => {
        toast.error(errorMessage);
      }
    );
  }, [isFormValid, selectedNotificationType, formData, selectedItem, imageFile, processNotification, handleReset]);

  // Get item image URL for preview
  const itemImageUrl = useMemo(() => {
    return selectedItem?.image || selectedItem?.imageUrl || null;
  }, [selectedItem]);

  return (
    <Grid container spacing={3}>
      {/* Form Section */}
      <Grid item xs={12} md={8}>
        <StyledPaper>
          {/* Notification Type Selection */}
          <NotificationTypeSelect
            value={selectedNotificationType}
            onChange={handleNotificationTypeChange}
            options={notificationCodes}
            disabled={notificationLoading}
          />

          {/* Image Upload - conditionally rendered */}
          {shouldShowImageUpload && (
            <AddImage 
              onImageChange={handleImageChange} 
              initialImage={null} 
            />
          )}

          {/* Item Selector - conditionally rendered */}
          {shouldShowItemSelect && (
            <ItemSelector
              items={items}
              selectedItem={selectedItem}
              onChange={handleSelectedItemChange}
              loading={itemsLoading}
              error={itemSelectError}
              required
            />
          )}

          {/* Mobile Number Input */}
          <TextField
            fullWidth
            margin="normal"
            label="User's mobile (optional)"
            placeholder="Send to specific user"
            value={formData.mobile}
            onChange={handleFieldChange(NOTIFICATION_CONFIG.FORM_FIELDS.MOBILE)}
            helperText="Leave empty to send to all users"
            disabled={isSubmitting}
          />

          {/* Message Title */}
          <TextField
            fullWidth
            margin="normal"
            label="Message title *"
            placeholder="Enter notification title"
            value={formData.title}
            onChange={handleFieldChange(NOTIFICATION_CONFIG.FORM_FIELDS.TITLE)}
            required
            disabled={isSubmitting}
            error={!formData.title.trim() && formData.title.length > 0}
          />

          {/* Message Body */}
          <TextField
            fullWidth
            margin="normal"
            label="Message body *"
            placeholder="Enter notification message"
            multiline
            minRows={3}
            maxRows={6}
            value={formData.body}
            onChange={handleFieldChange(NOTIFICATION_CONFIG.FORM_FIELDS.BODY)}
            required
            disabled={isSubmitting}
            error={!formData.body.trim() && formData.body.length > 0}
          />

          {/* Action Buttons */}
          <Box mt={3} display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={
                isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />
              }
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting}
              size="large"
            >
              {isSubmitting ? "Sending..." : "Send Notification"}
            </Button>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              disabled={isSubmitting}
              size="large"
            >
              Reset Form
            </Button>
          </Box>

          {/* Form Status */}
          {!isFormValid && (
            <Box mt={2}>
              <Alert severity="info" size="small">
                {NOTIFICATION_CONFIG.VALIDATION_MESSAGES.REQUIRED_FIELDS}
              </Alert>
            </Box>
          )}
        </StyledPaper>
      </Grid>

      {/* Preview Section */}
      <Grid item xs={12} md={4}>
        <StickyContainer>
          <Typography variant="h6" gutterBottom>
            Live Preview
          </Typography>
          <PreviewCard
            title={formData.title}
            body={formData.body}
            imageUrl={previewUrl}
            itemImageUrl={itemImageUrl}
          />
        </StickyContainer>
      </Grid>
      <ToastContainer/>
    </Grid>
  );
};

export default Notification;