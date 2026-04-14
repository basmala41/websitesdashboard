import React, { useMemo, useCallback } from "react";
import {
  CircularProgress,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";

const ColorSizeSelector = React.memo(
  ({
    product,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    isProductLoading,
  }) => {
    const availableColors = useMemo(() => {
      if (!product) return [];
      return product.productColors.filter((color) => color.qty > 0);
    }, [product]);

    const availableSizes = useMemo(() => {
      if (!selectedColor) return [];
      return selectedColor.colorSizes.filter((size) => size.qty > 0);
    }, [selectedColor]);

    const handleColorChange = useCallback(
      (event) => {
        const colorId = parseInt(event.target.value);
        const color = availableColors.find((c) => c.colorId === colorId);
        setSelectedColor(color || null);
        setSelectedSize(null);
      },
      [availableColors, setSelectedColor, setSelectedSize]
    );

    const handleSizeChange = useCallback(
      (event) => {
        const sizeId = parseInt(event.target.value);
        const size = availableSizes.find((s) => s.sizeId === sizeId);
        setSelectedSize(size || null);
      },
      [availableSizes, setSelectedSize]
    );

    if (isProductLoading) {
      return (
        <Box display="flex" justifyContent="center" my={2}>
          <CircularProgress />
        </Box>
      );
    }

    if (!product) return null;

    return (
      <Box display="flex" gap={2} sx={{ mb: 2, flexWrap: "wrap" }}>
        <FormControl sx={{ minWidth: 200, flex: 1 }}>
          <InputLabel>Color</InputLabel>
          <Select
            value={selectedColor?.colorId || ""}
            onChange={handleColorChange}
            label="Color"
          >
            <MenuItem value="">
              <em>Choose Color</em>
            </MenuItem>
            {availableColors.map((color) => (
              <MenuItem key={color.colorId} value={color.colorId}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: color.colorHex.startsWith("#")
                        ? color.colorHex
                        : `#${color.colorHex}`,
                      border: "1px solid #ccc",
                    }}
                  />
                  {color.colorName} (Available: {color.qty})
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedColor && (
          <FormControl sx={{ minWidth: 150, flex: 1 }}>
            <InputLabel>Size</InputLabel>
            <Select
              value={selectedSize?.sizeId || ""}
              onChange={handleSizeChange}
              label="Size"
            >
              <MenuItem value="">
                <em>Choose Size</em>
              </MenuItem>
              {availableSizes.map((size) => (
                <MenuItem key={size.sizeId} value={size.sizeId}>
                  {size.sizeName} (Available: {size.qty})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>
    );
  }
);

export default ColorSizeSelector;