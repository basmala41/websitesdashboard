import React from 'react';
import styles from '../../styles/order.module.css';

const OrderFilters = React.memo(({
  filters,
  orderStatusOptions,
  validateDateRange,
  handleFilterChange,
  handleClearFilters,
  isLoading,
  onRefresh
}) => {
  const isDateRangeValid = validateDateRange();

  return (
    <div className={styles.container}>
      <div className={styles.headerr}>
        <div className={styles.headerContent}>
          <h4 className={styles.title}>Orders Management</h4>
          <div className={styles.buttonGroupp}>
            <button
              className={styles.refreshButton}
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.filterGroup}>
          <label className={styles.label}>Date From</label>
          <input
            type="date"
            className={`${styles.input} ${!isDateRangeValid ? styles.invalid : ''}`}
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Date To</label>
          <input
            type="date"
            className={`${styles.input} ${!isDateRangeValid ? styles.invalid : ''}`}
            value={filters.dateTo}
            onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          />
          {!isDateRangeValid && (
            <span className={styles.errorMessage}>
              'Date To' must be after 'Date From'
            </span>
          )}
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.label}>Order Status</label>
          <select
            className={styles.select}
            value={filters.orderStatus}
            onChange={(e) => handleFilterChange("orderStatus", e.target.value)}
          >
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <button
            className={styles.clearButton}
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
});

export default OrderFilters;