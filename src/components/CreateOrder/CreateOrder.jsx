import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Alert,
  ThemeProvider,
  createTheme,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import useUserSearch from "../../hooks/useUserSearch";
import useAuthStore from "../../store/authStore";
import useProduct from "../../hooks/useProduct";
import useItems from "../../hooks/useItems";
import UserSearchSection from "./UserSearchSection";
import ProductSelectionSection from "./ProductSelectionSection";
import OrderTableSection from "./OrderTableSection";
import { toast, ToastContainer } from "react-toastify";
import apiService from "../../services/apiService";

// Move theme outside component to prevent recreation
const theme = createTheme({
  typography: {
    fontFamily: "'Alexandria', sans-serif",
  },
});

const CreateOrder = () => {
  const { user, appOptions } = useAuthStore();

  // State management
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  // Refs to prevent unnecessary re-renders
  const userSearchRef = useRef();
  const orderCompletedRef = useRef(false);

  // Custom hooks
  const userSearch = useUserSearch();
  const {
    items,
    isLoading: itemsLoading,
    error: itemsError,
  } = useItems(user.token);

  const {
    product,
    isLoading: productLoading,
    error: productError,
  } = useProduct(selectedItem?.itemCode, user.token);

  // Optimized handlers with useCallback and dependency optimization
  const handleAddToTable = useCallback((item) => {
    setOrderItems((prev) => {
      const existingItemIndex = prev.findIndex(
        (existingItem) =>
          existingItem.itemCode === item.itemCode &&
          existingItem.color.colorId === item.color.colorId &&
          existingItem.size.sizeId === item.size.sizeId
      );

      if (existingItemIndex !== -1) {
        const existingItem = prev[existingItemIndex];
        if (existingItem.quantity < item.size.qty) {
          const newItems = [...prev];
          newItems[existingItemIndex] = { 
            ...existingItem, 
            quantity: existingItem.quantity + 1 
          };
          return newItems;
        } else {
          toast.warning("Cannot add more. Maximum available quantity reached.");
          return prev;
        }
      }

      return [...prev, { ...item, quantity: 1 }];
    });

    // Reset selections - batched state updates
    setSelectedItem(null);
    setSelectedColor(null);
    setSelectedSize(null);
  }, []);

  const handleRemoveItem = useCallback((index) => {
    setOrderItems((prev) => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  }, []);

  const handleUpdateQuantity = useCallback((index, newQuantity) => {
    if (newQuantity < 1) return;
    
    setOrderItems((prev) => {
      const newItems = [...prev];
      newItems[index] = { ...newItems[index], quantity: newQuantity };
      return newItems;
    });
  }, []);

  // Calculate order totals with discounts
  const orderCalculations = useMemo(() => {
    // Base order total
    const subtotal = orderItems.reduce((total, item) => {
      const price = item.dealPrice > 0 ? item.dealPrice : item.price;
      return total + price * item.quantity;
    }, 0);

    // Points discount
    const pointsDiscount = userSearch.customerFormData.points && appOptions?.pointRate
      ? parseFloat(userSearch.customerFormData.points) * parseFloat(appOptions.pointRate)
      : 0;

    // Voucher discount
    let voucherDiscount = 0;
    const voucherData = userSearch.voucherData;
    if (voucherData) {
      if (voucherData.docType === 1) {
        // Percentage discount
        voucherDiscount = (subtotal * voucherData.docValue) / 100;
      } else if (voucherData.docType === 2) {
        // Fixed amount discount
        voucherDiscount = voucherData.docValue;
      }
    }

    // Calculate final total
    const totalAfterDiscounts = Math.max(0, subtotal - voucherDiscount - pointsDiscount);

    return {
      subtotal,
      voucherDiscount,
      pointsDiscount,
      total: totalAfterDiscounts
    };
  }, [orderItems, userSearch.customerFormData.points, userSearch.voucherData, appOptions?.pointRate]);

  // Memoized validation checks
  const validationChecks = useMemo(() => {
    const hasOrderItems = orderItems.length > 0;
    
    return { hasOrderItems };
  }, [orderItems.length]);

  const handleCompleteOrder = useCallback(async () => {
    if (orderCompletedRef.current) return; // Prevent double submission
    
    const { hasOrderItems } = validationChecks;
    
    if (!hasOrderItems) {
      toast.warning("Please add products to the order");
      return;
    }

    orderCompletedRef.current = true;

    const orderData = {
      userMobile: userSearch.mobile,
      firstName: userSearch.customerFormData.name,
      anotherMobile: userSearch.customerFormData.anotherMobile,
      address: userSearch.customerFormData.address,
      anotherAddress: userSearch.customerFormData.anotherAddress,
      streetName: userSearch.customerFormData.streetName,
      buldingNo: parseInt(userSearch.customerFormData.buldingNo) || null,
      floorNo: parseInt(userSearch.customerFormData.floorNo) || null,
      flatNo: parseInt(userSearch.customerFormData.flatNo) || null,
      adressAdditionalInfo: userSearch.customerFormData.adressAdditionalInfo,
      vouchrId: parseInt(userSearch.customerFormData.vouchrId) || null,
      points: parseInt(userSearch.customerFormData.points) || null,
      governorateCode: userSearch.customerFormData.governCode || "",
      addressId:parseInt(userSearch.customerFormData.addressId)||null,
      details: orderItems.map((item) => ({
        itemCode: item.itemCode,
        itemColor: item.color.colorId,
        itemSize: item.size.sizeId,
        quantity: item.quantity,
      })),
    };

    console.log(orderData);
    try {
      const result = await apiService.postOrderForClient(orderData, user.token);
      
      if (!result.success) {
        toast.error(result.errorMessage || "Failed to create order");
        return;
      }

      toast.success("Order created successfully!");

      // Reset form - batched updates
      setOrderItems([]);
      setSelectedItem(null);
      setSelectedColor(null);
      setSelectedSize(null);
      userSearch.setMobile("");
      userSearch.setUserData(null);
      userSearch.clearCustomerForm();
      
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("An error occurred while creating the order");
    } finally {
      orderCompletedRef.current = false;
    }
  }, [validationChecks, userSearch, orderItems, user.token]);

  const handleCancelOrder = useCallback(() => {
    setOrderItems([]);
    setSelectedItem(null);
    setSelectedColor(null);
    setSelectedSize(null);
  }, []);

  // Reset color and size when item changes - optimized effect
  React.useEffect(() => {
    setSelectedColor(null);
    setSelectedSize(null);
  }, [selectedItem?.itemCode]);

  // Memoized props objects to prevent child re-renders
  const productSelectionProps = useMemo(
    () => ({
      items,
      selectedItem,
      setSelectedItem,
      product,
      selectedColor,
      setSelectedColor,
      selectedSize,
      setSelectedSize,
      onAddToTable: handleAddToTable,
      isProductLoading: productLoading,
      productError,
      itemsLoading,
    }),
    [
      items,
      selectedItem,
      product,
      selectedColor,
      selectedSize,
      handleAddToTable,
      productLoading,
      productError,
      itemsLoading,
    ]
  );

  const orderTableProps = useMemo(
    () => ({
      orderItems,
      onRemoveItem: handleRemoveItem,
      handleQuantityChange: handleUpdateQuantity,
    }),
    [orderItems, handleRemoveItem, handleUpdateQuantity]
  );

  // Error state
  if (itemsError) {
    return (
      <Box p={4}>
        <Alert severity="error">Error loading data: {itemsError}</Alert>
      </Box>
    );
  }

  const { hasOrderItems } = validationChecks;

  return (
    <ThemeProvider theme={theme}>
      <Box p={3}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Create New Order
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Search for customer and select products to create a new order
          </Typography>
        </Box>

        <UserSearchSection userSearch={userSearch} />

        <ProductSelectionSection {...productSelectionProps} />

        <OrderTableSection {...orderTableProps} />

        {/* Order Summary */}
        {hasOrderItems && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {orderCalculations.subtotal.toLocaleString()} EGP
                </Typography>
              </Box>

              {orderCalculations.voucherDiscount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="success.main">
                    Voucher Discount:
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -{orderCalculations.voucherDiscount.toLocaleString()} EGP
                  </Typography>
                </Box>
              )}

              {orderCalculations.pointsDiscount > 0 && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="success.main">
                    Points Discount ({userSearch.customerFormData.points} points):
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    -{orderCalculations.pointsDiscount.toLocaleString()} EGP
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 1 }} />
              
              <Box display="flex" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {orderCalculations.total.toLocaleString()} EGP
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {hasOrderItems && (
          <Box display="flex" justifyContent="center" gap={2} mt={3}>
            <Button
              variant="contained"
              size="large"
              onClick={handleCompleteOrder}
              sx={{ minWidth: 150 }}
              disabled={orderCompletedRef.current}
            >
              {orderCompletedRef.current ? "Processing..." : "Complete Order"}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleCancelOrder}
              sx={{ minWidth: 150 }}
              disabled={orderCompletedRef.current}
            >
              Cancel Order
            </Button>
          </Box>
        )}

        {hasOrderItems && (
          <Alert severity="info" sx={{ mt: 2, textAlign: "center" }}>
            Order ready to be created for:{" "}
            {userSearch.customerFormData.name}{" "}
            | Total: {orderCalculations.total.toLocaleString()} EGP
          </Alert>
        )}
        <ToastContainer />
      </Box>
    </ThemeProvider>
  );
};

export default React.memo(CreateOrder);