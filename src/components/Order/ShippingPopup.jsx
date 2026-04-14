import React, { useState, useEffect, useCallback, useMemo } from "react";
import { X, Truck, Package } from "lucide-react";
import styles from "../../styles/order.module.css";
import apiService from "../../services/apiService";

const ShippingPopup = ({ order, isOpen, onClose, onSubmit, token }) => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [waybillNumber, setWaybillNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Prevent body scroll when popup is open
 /*  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('popupopen');
      document.body.style.overflow = 'visible';
      document.body.style.backgroundColor='red'
    } else {
      document.body.classList.remove('popupopen');
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('popupopen');
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]); */

  // Memoized sorted companies to prevent unnecessary re-renders
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      const fa = Number(a.shippingFees ?? 0);
      const fb = Number(b.shippingFees ?? 0);
      return fa - fb;
    });
  }, [companies]);

  // Fetch shipping companies when popup opens
  const fetchCompanies = useCallback(async () => {
    if (!isOpen || !order?.osid) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await apiService.getOrderShipping(order.osid, token);
      if (response.success) {
        setCompanies(response.data);
      } else {
        throw new Error(response.errorMessage || "Failed to load companies");
      }
    } catch (err) {
      console.error("Error fetching shipping companies:", err);
      setError("Failed to load shipping companies");
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, order?.osid, token]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Reset form when popup closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedCompanyId("");
      setWaybillNumber("");
      setError("");
    }
  }, [isOpen]);

  // Memoized selected company to prevent unnecessary calculations
  const selectedCompany = useMemo(() => {
    return sortedCompanies.find(c => c.companyId === parseInt(selectedCompanyId));
  }, [sortedCompanies, selectedCompanyId]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    // Validation
    if (!selectedCompanyId) {
      setError("Please select a shipping company");
      return;
    }

    if (!waybillNumber.trim()) {
      setError("Please enter a waybill number");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const req = {
        osid: order.osid,
        companyId: parseInt(selectedCompanyId),
        waybillNumber: waybillNumber.trim(),
      };

      const result = await apiService.postOrderShipping(req, token);

      if (result.success) {
        onSubmit(order.osid, "shipping", order);
        onClose();
      } else {
        throw new Error(result.errorMessage || "Failed to submit shipping information");
      }
    } catch (err) {
      console.error("Error submitting shipping:", err);
      setError(err.message || "Failed to submit shipping information");
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCompanyId, waybillNumber, order, token, onSubmit, onClose]);

  // Handle close with ESC key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isSubmitting, onClose]);

  // Handle overlay click
  const handleOverlayClick = useCallback((e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  // Early return if not open
  if (!isOpen) return null;

  const isFormValid = selectedCompanyId && waybillNumber.trim();
console.log("Popup isOpen:", isOpen);
console.log("Companies:", companies);
console.log("Selected company:", selectedCompanyId);
  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.popup}  style={{
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '8px',
    maxWidth: '28rem',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    zIndex: 9999999,
    display: 'flex',
    flexDirection: 'column'
  }} 
  role="dialog" aria-modal="true" aria-labelledby="popup-title">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.iconWrapper}>
              <Truck className={styles.truckIcon} />
            </div>
            <div className={styles.headerText}>
              <h2 id="popup-title">Shipping Information</h2>
              <p>Order #{order?.docNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={styles.closeButton}
            disabled={isSubmitting}
            aria-label="Close popup"
          >
            <X className={styles.closeIcon} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {error && (
            <div className={styles.errorMessage} role="alert">
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {/* Shipping Company Dropdown */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="company-select">
              Shipping Company *
            </label>
            {isLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.spinner} aria-hidden="true"></div>
                <span className={styles.loadingText}>Loading companies...</span>
              </div>
            ) : (
              <select
                id="company-select"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className={styles.select}
                disabled={isSubmitting}
                aria-required="true"
              >
                <option value="">Select shipping company...</option>
                {sortedCompanies.map((company) => (
                  <option key={company.companyId} value={company.companyId}>
                    {company.name} - shipping fees is : {company.shippingFees}
                  </option>
                ))}
              </select>
            )}
            {selectedCompany && (
              <div className={styles.companyInfo}>
                <div className={styles.companyDetails}>
                  <Package className={styles.packageIcon} aria-hidden="true" />
                  <span>shipping</span>
                  <span className={styles.govCode}>
                    Gov. Code: {selectedCompany.governorateCode}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Waybill Number */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="waybill-input">
              Waybill Number *
            </label>
            <input
              id="waybill-input"
              type="text"
              value={waybillNumber}
              onChange={(e) => setWaybillNumber(e.target.value)}
              placeholder="Enter waybill number..."
              className={styles.input}
              disabled={isSubmitting}
              aria-required="true"
            />
          </div>

          {/* Action Buttons */}
          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !isFormValid}
              className={styles.submitButton}
            >
              {isSubmitting ? (
                <>
                  <div className={styles.submitSpinner} aria-hidden="true"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Truck className={styles.submitIcon} aria-hidden="true" />
                  Submit Shipping
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ShippingPopup);