import React, { useMemo, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  IconButton,
} from "@mui/material";

// Memoized table row component
const OrderTableRow = React.memo(
  ({ item, index, onIncrement, onDecrement, onRemove }) => {
    const unitPrice = useMemo(() => {
      return item.dealPrice > 0 ? item.dealPrice : item.price;
    }, [item.dealPrice, item.price]);

    const totalPrice = useMemo(() => {
      return unitPrice * item.quantity;
    }, [unitPrice, item.quantity]);

    const colorStyle = useMemo(
      () => ({
        width: 20,
        height: 20,
        borderRadius: "50%",
        backgroundColor: item.color.colorHex.startsWith("#")
          ? item.color.colorHex
          : `#${item.color.colorHex}`,
        border: "1px solid #ccc",
      }),
      [item.color.colorHex]
    );

    return (
      <TableRow key={item.id || index} hover>
        <TableCell>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {item.itemCode}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.itemName}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Box display="flex" alignItems="center" gap={1}>
            <Box sx={colorStyle} />
            <Typography variant="body2">{item.color.colorName}</Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Box>
            <Typography variant="body2">{item.size.sizeName}</Typography>
            <Typography variant="caption" color="text.secondary">
              Available: {item.size.qty}
            </Typography>
          </Box>
        </TableCell>
        <TableCell align="center">
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
          >
            <IconButton
              size="small"
              onClick={() => onDecrement(index, item.quantity)}
              disabled={item.quantity <= 1}
            >
              <Box
                sx={{
                  width: 16,
                  height: 2,
                  backgroundColor: item.quantity <= 1 ? "#ccc" : "#1976d2",
                }}
              />
            </IconButton>
            <Typography
              variant="body2"
              sx={{
                minWidth: 24,
                textAlign: "center",
                fontWeight: "medium",
              }}
            >
              {item.quantity}
            </Typography>
            <IconButton
              size="small"
              onClick={() => onIncrement(index, item.quantity, item.size.qty)}
              disabled={item.quantity >= item.size.qty}
            >
              <Plus size={16} />
            </IconButton>
          </Box>
        </TableCell>
        <TableCell align="right">
          {item.dealPrice > 0 ? (
            <Box>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: "line-through",
                  color: "text.secondary",
                }}
              >
                {item.price}
              </Typography>
              <Typography variant="body2" color="error" fontWeight="medium">
                {item.dealPrice} EGP
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2">{item.price} EGP</Typography>
          )}
        </TableCell>
        <TableCell align="right">
          <Typography variant="body2" fontWeight="medium">
            {totalPrice.toLocaleString()} EGP
          </Typography>
        </TableCell>
        <TableCell align="center">
          <IconButton
            onClick={() => onRemove(index)}
            color="error"
            size="small"
          >
            <Trash2 size={16} />
          </IconButton>
        </TableCell>
      </TableRow>
    );
  }
);

const OrderTableSection = React.memo(
  ({ orderItems, onRemoveItem, handleQuantityChange }) => {
    // Memoized total calculation
    const total = useMemo(() => {
      return orderItems.reduce((total, item) => {
        const price = item.dealPrice > 0 ? item.dealPrice : item.price;
        return total + price * item.quantity;
      }, 0);
    }, [orderItems]);

    // Memoized handlers
    const incrementQuantity = useCallback(
      (index, currentQuantity, maxQuantity) => {
        const newQuantity = currentQuantity + 1;
        if (newQuantity > maxQuantity) {
          alert(`Maximum available quantity is ${maxQuantity}`);
          return;
        }
        handleQuantityChange(index, newQuantity);
      },
      [handleQuantityChange]
    );

    const decrementQuantity = useCallback(
      (index, currentQuantity) => {
        if (currentQuantity <= 1) {
          onRemoveItem(index);
          return;
        }
        handleQuantityChange(index, currentQuantity - 1);
      },
      [handleQuantityChange, onRemoveItem]
    );

    if (orderItems.length === 0) {
      return (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Order Details
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              py={4}
            >
              No products added yet
            </Typography>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Details
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Color</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Unit Price</TableCell>
                  <TableCell align="right">Total Price</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderItems.map((item, index) => (
                  <OrderTableRow
                    key={item.id || index}
                    item={item}
                    index={index}
                    onIncrement={incrementQuantity}
                    onDecrement={decrementQuantity}
                    onRemove={onRemoveItem}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="flex-end" mt={2}>
            <Typography variant="h6" fontWeight="bold">
              Total: {total.toLocaleString()} EGP
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }
);

export default OrderTableSection;