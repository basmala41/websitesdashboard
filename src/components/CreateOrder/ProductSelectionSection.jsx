import React, { useMemo, useCallback, useState } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Link,
  Box,
} from "@mui/material";
import { Plus, MapPin } from "lucide-react";
import ColorSizeSelector from "./ColorSizeSelector";
import BranchAvailabilityModal from "./BranchAvailabilityModal";

// Memoized ItemSelector
const ItemSelector = React.memo(
  ({ items, selectedItem, onChange, loading, error, required = false }) => {
    const options = useMemo(() => items || [], [items]);

    const getOptionLabel = useCallback((option) => {
      if (!option) return "";
      return `${option.itemCode} - ${option.itemName}`;
    }, []);

    const isOptionEqualToValue = useCallback((option, value) => {
      if (!option || !value) return false;
      return option.itemCode === value.itemCode;
    }, []);

    return (
      <Autocomplete
        options={options}
        getOptionLabel={getOptionLabel}
        value={selectedItem || null}
        onChange={(_, newValue) => onChange(newValue)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={`Select Product${required ? " *" : ""}`}
            placeholder="Search for a product..."
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
        isOptionEqualToValue={isOptionEqualToValue}
        noOptionsText={loading ? "Loading..." : "No products found"}
        clearOnEscape
        sx={{ mb: 2 }}
      />
    );
  }
);

const ProductSelectionSection = React.memo(
  ({
    items,
    selectedItem,
    setSelectedItem,
    product,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    onAddToTable,
    isProductLoading,
    productError,
    itemsLoading,
  }) => {
    const [branchModalOpen, setBranchModalOpen] = useState(false);

    const handleAddClick = useCallback(() => {
      if (selectedItem && selectedColor && selectedSize) {
        const orderItem = {
          itemCode: selectedItem.itemCode,
          itemName: selectedItem.itemName,
          color: selectedColor,
          size: selectedSize,
          price: product.price,
          dealPrice: product.dealPrice || 0,
          id: `${selectedItem.itemCode}-${selectedColor.colorId}-${
            selectedSize.sizeId
          }-${Date.now()}`,
        };
        onAddToTable(orderItem);
      }
    }, [selectedItem, selectedColor, selectedSize, product, onAddToTable]);

    const handleBranchModalOpen = useCallback(() => {
      setBranchModalOpen(true);
    }, []);

    const handleBranchModalClose = useCallback(() => {
      setBranchModalOpen(false);
    }, []);

    const isAddDisabled = useMemo(() => {
      return (
        !selectedItem || !selectedColor || !selectedSize || isProductLoading
      );
    }, [selectedItem, selectedColor, selectedSize, isProductLoading]);

    // Show branch availability link when all selections are made
    const showBranchLink = useMemo(() => {
      return selectedItem && selectedColor && selectedSize && !isProductLoading;
    }, [selectedItem, selectedColor, selectedSize, isProductLoading]);

    // Memoized product info
    const productInfo = useMemo(() => {
      if (!product || isProductLoading) return null;

      return (
        <Paper sx={{ p: 2, bgcolor: "grey.50", mb: 2 }}>
          <Typography variant="body2">
            <strong>Price:</strong> {product.price} EGP
            {product.dealPrice > 0 && (
              <span style={{ color: "#d32f2f", marginLeft: 8 }}>
                | Deal Price: {product.dealPrice} EGP
              </span>
            )}
          </Typography>
          <Typography variant="body2">
            <strong>Total Available Quantity:</strong> {product.qty}
          </Typography>

          {/* Branch Availability Link */}
          {showBranchLink && (
            <Box mt={1}>
              <Link
                component="button"
                variant="body2"
                onClick={handleBranchModalOpen}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                <MapPin size={16} />
                Show Branch Available
              </Link>
            </Box>
          )}
        </Paper>
      );
    }, [product, isProductLoading, showBranchLink, handleBranchModalOpen]);

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Product Selection
          </Typography>

          <ItemSelector
            items={items}
            selectedItem={selectedItem}
            onChange={setSelectedItem}
            loading={itemsLoading}
            error={productError}
            required
          />

          {selectedItem && (
            <ColorSizeSelector
              product={product}
              selectedColor={selectedColor}
              setSelectedColor={setSelectedColor}
              selectedSize={selectedSize}
              setSelectedSize={setSelectedSize}
              isProductLoading={isProductLoading}
            />
          )}

          {productInfo}

          <Button
            variant="contained"
            color="success"
            startIcon={<Plus size={16} />}
            onClick={handleAddClick}
            disabled={isAddDisabled}
            fullWidth
          >
            Add to Order
          </Button>

          {/* Branch Availability Modal */}
          <BranchAvailabilityModal
            open={branchModalOpen}
            onClose={handleBranchModalClose}
            itemCode={selectedItem?.itemCode}
            colorId={selectedColor?.colorId}
            sizeId={selectedSize?.sizeId}
            itemName={selectedItem?.itemName}
            colorName={selectedColor?.colorName}
            sizeName={selectedSize?.sizeName}
          />
        </CardContent>
      </Card>
    );
  }
);

export default ProductSelectionSection;