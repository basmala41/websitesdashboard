import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
import { X, MapPin } from "lucide-react";
import useAuthStore from "../../store/authStore";
import { ENV_CONFIG } from "../../constants/config";

const BranchAvailabilityModal = ({
  open,
  onClose,
  itemCode,
  colorId,
  sizeId,
  itemName,
  colorName,
  sizeName,
}) => {
  const [branchData, setBranchData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuthStore();

  const fetchBranchAvailability = useCallback(async () => {
    if (!itemCode || !colorId || !sizeId || !user.token) return;

    setLoading(true);
    setError("");
    setBranchData([]);

    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_URL}/admin/AdminProduct/getProductBranchQty?itemCode=${itemCode}&color=${colorId}&size=${sizeId}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        setBranchData(data.data);
      } else {
        setError("Failed to fetch branch availability");
      }
    } catch (error) {
      console.error("Error fetching branch availability:", error);
      setError("Error fetching branch availability");
    } finally {
      setLoading(false);
    }
  }, [itemCode, colorId, sizeId, user.token]);

  // Fetch data when modal opens
  React.useEffect(() => {
    if (open) {
      fetchBranchAvailability();
    }
  }, [open, fetchBranchAvailability]);

  const totalQuantity = branchData.reduce(
    (sum, branch) => sum + branch.totalQuantity,
    0
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: 400 },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1}>
            <MapPin size={20} />
            <Typography variant="h6">Branch Availability</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <X size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {/* Product Details */}
        <Box mb={3} p={2} bgcolor="grey.50" borderRadius={1}>
          <Typography variant="body1" fontWeight="medium">
            {itemName} ({itemCode})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Color: {colorName} | Size: {sizeName}
          </Typography>
        </Box>

        {/* Loading State */}
        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
          >
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Data Table */}
        {!loading && !error && branchData.length > 0 && (
          <>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Typography variant="subtitle2">Branch Name</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="subtitle2">
                        Available Quantity
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {branchData.map((branch, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {branch.branchName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="medium"
                          color={
                            branch.totalQuantity > 0
                              ? "success.main"
                              : "error.main"
                          }
                        >
                          {branch.totalQuantity}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Total Summary */}
            <Box mt={2} p={2} bgcolor="primary.50" borderRadius={1}>
              <Typography variant="body1" fontWeight="bold" textAlign="center">
                Total Available: {totalQuantity} units across{" "}
                {branchData.length} branches
              </Typography>
            </Box>
          </>
        )}

        {/* No Data State */}
        {!loading && !error && branchData.length === 0 && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight={200}
          >
            <Typography variant="body1" color="text.secondary">
              No branch availability data found
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BranchAvailabilityModal;
