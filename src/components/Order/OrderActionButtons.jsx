import React, { useCallback, useMemo } from 'react';
import styles from '../../styles/order.module.css';

// Custom loading spinner component
const LoadingSpinner = () => (
  <div className={styles.customSpinner} aria-hidden="true"></div>
);

// Try to use MUI components, fallback to custom if not available
let CircularProgress, Tooltip;

try {
  CircularProgress = require('@mui/material/CircularProgress').default;
  Tooltip = require('@mui/material/Tooltip').default;
} catch (error) {
  // Fallback if MUI is not available
  CircularProgress = LoadingSpinner;
  Tooltip = ({ title, children }) => (
    <span title={title}>{children}</span>
  );
}

const OrderActionButtons = React.memo(({
  order,
  actionConfigs,
  loadingActions,
  isActionEnabled,
  onAction
}) => {
  const { osid, orderStatus } = order;

  // Memoize enabled actions to prevent recalculation
  const enabledActions = useMemo(() => {
    return Object.entries(actionConfigs).filter(([actionType]) => 
      isActionEnabled(orderStatus, actionType)
    );
  }, [actionConfigs, orderStatus, isActionEnabled]);

  // Handle action clicks with event propagation control
  const handleActionClick = useCallback((actionType, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Pass the action to parent component (OrderTable)
    onAction(osid, actionType, order);
  }, [osid, onAction, order]);

  // Early return if no enabled actions
  if (enabledActions.length === 0) {
    return null;
  }

  return (
    <div 
      className={styles.buttonContainer}
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="Order actions"
    >
      {enabledActions.map(([actionType, config]) => {
        const actionKey = `${osid}-${actionType}`;
        const isLoading = loadingActions[actionKey];

        return (
          <Tooltip key={actionKey} title={config.tooltip}>
            <button
              className={styles.actionButton}
              disabled={isLoading}
              onClick={(e) => handleActionClick(actionType, e)}
              style={{
                backgroundColor: config.color,
                borderColor: config.color,
                color: "white",
              }}
              aria-label={config.tooltip}
              type="button"
            >
              {isLoading ? (
                CircularProgress === LoadingSpinner ? (
                  <LoadingSpinner />
                ) : (
                  <CircularProgress
                    size={16}
                    className={styles.loadingSpinner}
                  />
                )
              ) : (
                <config.icon size={18} aria-hidden="true" />
              )}
            </button>
          </Tooltip>
        );
      })}
    </div>
  );
});

OrderActionButtons.displayName = 'OrderActionButtons';

export default OrderActionButtons;