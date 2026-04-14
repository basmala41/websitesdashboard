import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Search, X, User } from "lucide-react";
import {
  TextField,
  CircularProgress,
  Box,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  Grid,
  Divider,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  InputAdornment,
} from "@mui/material";
import useAuthStore from "../../store/authStore";
import apiService from "../../services/apiService";
import { toast } from "react-toastify";
import { ENV_CONFIG } from "../../constants/config";

// Memoized form field component to prevent re-renders
const FormField = React.memo(
  ({
    label,
    value,
    onChange,
    type = "text",
    required = false,
    multiline = false,
    rows = 1,
    minRows,
    error = false,
    helperText = "",
    inputProps = {},
    select = false,
    children = null,
    disabled = false,
    InputProps = {},
  }) => (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      type={type}
      required={required}
      multiline={multiline}
      rows={rows}
      minRows={minRows}
      error={error}
      helperText={helperText}
      inputProps={inputProps}
      select={select}
      disabled={disabled}
      InputProps={InputProps}
      sx={{
        "& .MuiSelect-select": {
          display: "flex",
          alignItems: "center",
          minWidth: "200px",
        },
      }}
    >
      {children}
    </TextField>
  )
);

const UserSearchSection = React.memo(({ userSearch }) => {
  const {
    mobile,
    setMobile,
    userData,
    userError,
    searchUser,
    isSearching,
    customerFormData,
    updateCustomerFormData,
    clearCustomerForm,
    governorates,
    isLoadingGovernorates,
    voucherData,
    setVoucherData,
  } = userSearch;

  const { appOptions, user } = useAuthStore();

  const [showForm, setShowForm] = useState(false);
  const [usePoints, setUsePoints] = useState(false);
  const [useVoucher, setUseVoucher] = useState(false);
  const [isVerifyingVoucher, setIsVerifyingVoucher] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  // Update form visibility when userData or userError changes
  useEffect(() => {
    if (userData || (userError && mobile.trim())) {
      setShowForm(true);
    } else {
      setShowForm(false);
    }
  }, [userData, userError, mobile]);

  // Auto-fill form when user is found
  useEffect(() => {
    if (userData && userData.data) {
      const user = userData.data;
      updateCustomerFormData({
        name: user.name || "",
        anotherMobile: user.anotherMobile || "",
        governCode: user.governorateCode?.toString() || "",
        addressId: "", // Reset address selection
        // Reset other fields for new user selection
        streetName: "",
        address: "",
        anotherAddress: "",
        buldingNo: "",
        floorNo: "",
        flatNo: "",
        adressAdditionalInfo: "",
        points: "",
        vouchrId: "",
      });
      // Reset voucher data when user changes
      setVoucherData(null);
      setVoucherError("");
      setUseVoucher(false);
    } else if (userError && mobile.trim()) {
      // Clear form for new user but keep entered mobile
      clearCustomerForm();
      setVoucherData(null);
      setVoucherError("");
      setUseVoucher(false);
    }
  }, [userData, userError, mobile, updateCustomerFormData, clearCustomerForm]);

  // Verify voucher function
  const verifyVoucher = useCallback(async () => {
    if (!customerFormData.vouchrId.trim() || !userData?.data?.id) {
      toast.warning("Please enter a voucher code");
      return;
    }

    setIsVerifyingVoucher(true);
    setVoucherError("");
    
    try {
      const response = await fetch(
        `${ENV_CONFIG.BASE_URL}/admin/AdminOrder/checkVoucher?userId=${userData.data.id}&voucherCode=${customerFormData.vouchrId}`,
        {
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setVoucherData(result.data);
        setVoucherError("");
        toast.success("Voucher verified successfully!");
        
        // Update the vouchrId with the verified voucher ID
        updateCustomerFormData({ 
          vouchrId: result.data.id.toString() 
        });
      } else {
        setVoucherData(null);
        setVoucherError("Invalid voucher code");
        toast.error("Invalid voucher code");
      }
    } catch (error) {
      console.error("Error verifying voucher:", error);
      setVoucherData(null);
      setVoucherError("Error verifying voucher");
      toast.error("Error verifying voucher");
    } finally {
      setIsVerifyingVoucher(false);
    }
  }, [customerFormData.vouchrId, userData, user.token, updateCustomerFormData]);

  // Memoized form change handler factory
  const createFormHandler = useCallback(
    (field) => (e) => {
      updateCustomerFormData({ [field]: e.target.value });
      
      // Reset voucher verification when voucher code changes
      if (field === "vouchrId") {
        setVoucherData(null);
        setVoucherError("");
      }
    },
    [updateCustomerFormData]
  );

  // Create memoized handlers for each field
  const formHandlers = useMemo(
    () => ({
      name: createFormHandler("name"),
      anotherMobile: createFormHandler("anotherMobile"),
      points: createFormHandler("points"),
      address: createFormHandler("address"),
      anotherAddress: createFormHandler("anotherAddress"),
      streetName: createFormHandler("streetName"),
      vouchrId: createFormHandler("vouchrId"),
      buldingNo: createFormHandler("buldingNo"),
      floorNo: createFormHandler("floorNo"),
      flatNo: createFormHandler("flatNo"),
      adressAdditionalInfo: createFormHandler("adressAdditionalInfo"),
      governCode: createFormHandler("governCode"),
      addressId: createFormHandler("addressId"),
    }),
    [createFormHandler]
  );

  // Handle address selection
  const handleAddressChange = useCallback(
    (event) => {
      const addressId = event.target.value;
      const selectedAddress = userData?.data?.userAddresses?.find(
        (addr) => addr.id.toString() === addressId
      );

      if (selectedAddress) {
        updateCustomerFormData({
          addressId: addressId,
          streetName: selectedAddress.streetName || "",
          buldingNo: selectedAddress.buldingNo?.toString() || "",
          floorNo: selectedAddress.floorNo?.toString() || "",
          flatNo: selectedAddress.flatNo?.toString() || "",
          adressAdditionalInfo: selectedAddress.adressAdditionalInfo || "",
          governCode: selectedAddress.governorateCode?.toString() || "",
        });
      } else {
        updateCustomerFormData({ addressId: "" });
      }
    },
    [userData, updateCustomerFormData]
  );

  // Handle points checkbox
  const handlePointsCheck = useCallback(
    (event) => {
      setUsePoints(event.target.checked);
      if (!event.target.checked) {
        updateCustomerFormData({ points: "" });
      }
    },
    [updateCustomerFormData]
  );

  // Handle voucher checkbox
  const handleVoucherCheck = useCallback(
    (event) => {
      setUseVoucher(event.target.checked);
      if (!event.target.checked) {
        updateCustomerFormData({ vouchrId: "" });
        setVoucherData(null);
        setVoucherError("");
      }
    },
    [updateCustomerFormData]
  );

  // Calculate points value
  const pointsValue = useMemo(() => {
    if (!customerFormData.points || !appOptions?.pointRate) return 0;
    return (
      parseFloat(customerFormData.points) * parseFloat(appOptions.pointRate)
    );
  }, [customerFormData.points, appOptions?.pointRate]);

  // Get selected governorate details
  const selectedGovernorate = useMemo(() => {
    if (!customerFormData.governCode) return null;
    return governorates.find(
      (gov) => gov.code.toString() === customerFormData.governCode
    );
  }, [customerFormData.governCode, governorates]);

  // Handle search key press
  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && mobile.trim()) {
        searchUser();
      }
    },
    [mobile, searchUser]
  );

  // Handle search button click
  const handleSearchClick = useCallback(() => {
    if (mobile.trim() && !isSearching) {
      searchUser();
    }
  }, [mobile, isSearching, searchUser]);

  // Handle clear form
  const handleClearForm = useCallback(() => {
    clearCustomerForm();
    setShowForm(false);
    setMobile("");
    setUsePoints(false);
    setUseVoucher(false);
    setVoucherData(null);
    setVoucherError("");
  }, [clearCustomerForm, setMobile]);

  // Memoized values for performance
  const buttonContent = useMemo(() => {
    return isSearching ? (
      <CircularProgress size={24} color="inherit" />
    ) : (
      <Search size={20} />
    );
  }, [isSearching]);

  const statusDisplay = useMemo(() => {
    if (userData) {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography>
            <strong>User Found:</strong> {userData.data?.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You can edit the details below and save changes
          </Typography>
        </Alert>
      );
    }

    if (userError && mobile.trim()) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography>
            <strong>New Customer:</strong> User not found with this mobile
            number
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Fill in the details below to create a new customer
          </Typography>
        </Alert>
      );
    }

    return null;
  }, [userData, userError, mobile]);

  const isSearchDisabled = useMemo(() => {
    return !mobile.trim() || isSearching;
  }, [mobile, isSearching]);

  // Validation states
  const validationErrors = useMemo(
    () => ({
      name: !customerFormData.name.trim() && showForm,
    }),
    [customerFormData.name, showForm]
  );

  // Helper text for governorate field
  const governorateHelperText = useMemo(() => {
    if (isLoadingGovernorates) {
      return "Loading governorates...";
    }
    if (selectedGovernorate) {
      return `Selected: ${selectedGovernorate.name} - Delivery Fee: ${selectedGovernorate.internalSalesManFees} EGP`;
    }
    return "";
  }, [isLoadingGovernorates, selectedGovernorate]);

  // Voucher helper text
  const voucherHelperText = useMemo(() => {
    if (voucherError) return voucherError;
    if (voucherData) {
      const discountText = voucherData.docType === 1 
        ? `${voucherData.docValue}% discount`
        : `${voucherData.docValue} EGP discount`;
      return `Voucher verified: ${discountText}`;
    }
    return "";
  }, [voucherData, voucherError]);

  const userFound = userData && userData.data;
  const hasUserAddresses =
    userFound &&
    userData.data.userAddresses &&
    userData.data.userAddresses.length > 0;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Customer Search & Management
        </Typography>

        {/* Search Section */}
        <Box display="flex" gap={2} alignItems="flex-start">
          <TextField
            fullWidth
            type="tel"
            label="Mobile Number *"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            onKeyPress={handleKeyPress}
            InputProps={{
              dir: "ltr",
            }}
          />
          <Button
            variant="contained"
            onClick={handleSearchClick}
            disabled={isSearchDisabled}
            sx={{ minWidth: 100, height: 56 }}
          >
            {buttonContent}
          </Button>
        </Box>

        {/* Status Display */}
        {statusDisplay}

        {/* Customer Details Form */}
        {showForm && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 3 }} />
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography
                variant="h6"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <User size={20} />
                {userFound ? "Edit Customer Details" : "New Customer Details"}
              </Typography>
              <Button
                variant="outlined"
                startIcon={<X size={16} />}
                onClick={handleClearForm}
                color="error"
              >
                Clear
              </Button>
            </Box>

            {/* ---------------- First Row - Basic Info ---------------- */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Address Information
            </Typography>

            {hasUserAddresses ? (
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <FormControl
                    fullWidth
                    sx={{
                      "& .MuiSelect-select": {
                        display: "flex",
                        alignItems: "center",
                        minWidth: "200px",
                      },
                    }}
                  >
                    <InputLabel>Select Saved Address</InputLabel>
                    <Select
                      value={customerFormData.addressId || ""}
                      onChange={handleAddressChange}
                      label="Select Saved Address"
                    >
                      <MenuItem value="">
                        <em>Choose an address or enter new one below</em>
                      </MenuItem>
                      {userData.data.userAddresses.map((address) => (
                        <MenuItem
                          key={address.id}
                          value={address.id.toString()}
                        >
                          <Box>
                            <Typography variant="body2">
                              <strong>{address.adressAlias}</strong> -{" "}
                              {address.governorateName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {address.streetName}{" "}
                              {address.buldingNo
                                ? `Building: ${address.buldingNo}`
                                : ""}
                              {address.floorNo
                                ? ` Floor: ${address.floorNo}`
                                : ""}
                              {address.flatNo ? ` Flat: ${address.flatNo}` : ""}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            ) : (
              <>
                {/* ---- Row 1: Street, Building, Floor, Flat ---- */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={3}>
                    <FormField
                      label="Street Name"
                      value={customerFormData.streetName}
                      onChange={formHandlers.streetName}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormField
                      label="Building No"
                      value={customerFormData.buldingNo}
                      onChange={formHandlers.buldingNo}
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormField
                      label="Floor No"
                      value={customerFormData.floorNo}
                      onChange={formHandlers.floorNo}
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormField
                      label="Flat No"
                      value={customerFormData.flatNo}
                      onChange={formHandlers.flatNo}
                      type="number"
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
                {/* ---- Row 2: Address, Another Address, Additional Info ---- */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <FormField
                      label="Address"
                      value={customerFormData.address}
                      onChange={formHandlers.address}
                      multiline
                      rows={4}
                      minRows={4}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormField
                      label="Another Address"
                      value={customerFormData.anotherAddress}
                      onChange={formHandlers.anotherAddress}
                      multiline
                      rows={4}
                      minRows={4}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormField
                      label="Address Additional Info"
                      value={customerFormData.adressAdditionalInfo}
                      onChange={formHandlers.adressAdditionalInfo}
                      multiline
                      rows={4}
                      minRows={4}
                    />
                  </Grid>
                </Grid>
              </>
            )}
            <Divider sx={{ my: 2 }} />

            {/* ---------------- Second Row - Address Section ---------------- */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Basic Information
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <FormField
                  label="Name *"
                  value={customerFormData.name}
                  onChange={formHandlers.name}
                  required
                  error={validationErrors.name}
                  helperText={validationErrors.name ? "Required field" : ""}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormField
                  label="Another Mobile"
                  value={customerFormData.anotherMobile}
                  onChange={formHandlers.anotherMobile}
                  type="tel"
                  inputProps={{ dir: "ltr" }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormField
                  label="Governorate"
                  value={customerFormData.governCode}
                  onChange={formHandlers.governCode}
                  select
                  helperText={governorateHelperText}
                >
                  <MenuItem value="">
                    <em>Select Governorate</em>
                  </MenuItem>
                  {governorates.map((governorate) => (
                    <MenuItem key={governorate.code} value={governorate.code}>
                      {governorate.name} (Fees:{" "}
                      {governorate.internalSalesManFees} EGP)
                    </MenuItem>
                  ))}
                </FormField>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* ---------------- Third Row - Points & Voucher ---------------- */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Discounts
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={usePoints}
                        onChange={handlePointsCheck}
                        color="primary"
                      />
                    }
                    label="Use Points"
                  />
                  <FormField
                    label="Points"
                    value={customerFormData.points}
                    onChange={formHandlers.points}
                    type="number"
                    inputProps={{ min: 0 }}
                    disabled={!usePoints}
                    helperText={
                      usePoints && pointsValue > 0
                        ? `Value: ${pointsValue.toFixed(2)} EGP`
                        : ""
                    }
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useVoucher}
                        onChange={handleVoucherCheck}
                        color="primary"
                      />
                    }
                    label="Use Voucher"
                  />
                  <FormField
                    label="Voucher Code"
                    value={customerFormData.vouchrId}
                    onChange={formHandlers.vouchrId}
                    disabled={!useVoucher}
                    error={!!voucherError}
                    helperText={voucherHelperText}
                    InputProps={{
                      endAdornment: useVoucher && userFound && (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={verifyVoucher}
                            disabled={
                              !customerFormData.vouchrId.trim() ||
                              isVerifyingVoucher
                            }
                            edge="end"
                          >
                            {isVerifyingVoucher ? (
                              <CircularProgress size={20} />
                            ) : (
                              <Search size={20} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

export default UserSearchSection;