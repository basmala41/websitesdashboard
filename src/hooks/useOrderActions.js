import { useState, useCallback, useMemo } from 'react';
import { CircleCheck, Printer, CircleX, ToolCase, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';
import apiService from '../services/apiService';

export const useOrderActions = (token, mutate) => {
  const [loadingActions, setLoadingActions] = useState({});

  // Memoize action configurations to prevent recreation
  const actionConfigs = useMemo(() => ({
    confirm: {
      state: 2,
      icon: CircleCheck,
      color: "#28a745",
      tooltip: "Confirm Order",
    },
    prepare: {
      state: 3,
      icon: ToolCase,
      color: "#ffc107",
      tooltip: "Mark as Prepared",
    },
    cancel: { 
      state: 7, 
      icon: CircleX, 
      color: "#dc3545", 
      tooltip: "Cancel Order" 
    },
    shipping: { 
      state: 4,
      icon: Truck, 
      color: "#f03f20ff", 
      tooltip: "Shipping" 
    },
    print: { 
      icon: Printer, 
      color: "#6f42c1", 
      tooltip: "Print Receipt" 
    },
  }), []);

  // Memoized print receipt handler

const handlePrintReceipt = useCallback(async (orderData) => {
  try {
    const { brandInfo, details } = orderData;
    const logoSrc = brandInfo?.branchLogo
      ? `data:image/jpeg;base64,${brandInfo.branchLogo}`
      : "";
    const footerScr = brandInfo?.branchFooterImage
      ? `data:image/jpeg;base64,${brandInfo.branchFooterImage}`
      : "";
    const qrCodeDataUrl = orderData.barcode 
      ? await QRCode.toDataURL(orderData.barcode, { width: 200, margin: 1 })
      : "";

    const printContent = `
   <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Receipt - Order #${orderData.docNo}</title>
        <style>
          body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
            background: white; 
            font-size: 12px; 
            line-height: 1.4; 
          }
          .receipt { width: 250px; margin: 0 auto; min-height:80px }
          .header { text-align: center; margin-bottom: 20px; }
          .logo { max-width: 100px; height: auto; margin-bottom: 10px; }
          .store-name { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
          .divider { border-top: 1px dashed #000; margin: 10px 0; }
          .info-row { display: flex; justify-content: space-between; margin: 5px 0; }
          .items-header { 
            display: flex; 
            justify-content: space-between; 
            font-weight: bold; 
            border-bottom: 1px solid #000; 
            padding: 5px 0; 
          }
          .item { margin: 5px 0; padding: 5px 0; }
          .item-name { 
            font-weight: bold; 
            font-size: 11px; 
            word-wrap: break-word; 
            white-space: normal; 
            line-height: 1.3; 
          }
          .item-details { 
            font-size: 11px; 
            color: #666; 
            display: flex; 
            justify-content: space-between; 
          }
          .totals { 
            margin-top: 15px; 
            border-top: 1px solid #000; 
            padding-top: 10px; 
          }
          .total-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .final-total { 
            font-weight: bold; 
            font-size: 14px; 
            border-top: 1px dashed #000; 
            padding-top: 5px; 
          }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          .headerbody { 
            display: flex; 
            flex-direction: row-reverse; 
            justify-content: space-between; 
            align-items: center; 
            gap: 10px; 
            margin-top: 10px; 
          }
          .header-info { display: flex; flex-direction: column; gap: 4px; }
          .qr-code { max-width: 50px; }
          @media print { 
            body { margin: 0; padding: 10px; } 
            .receipt { max-width: none; } 
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            ${logoSrc ? `<img src="${logoSrc}" alt="Logo" class="logo" />` : ""}
            <div>
              Printed On: ${new Date().toLocaleDateString("en-GB")} 
              ${new Date().toLocaleTimeString("en-GB", { hour12: false })}
            </div>
            <div class="headerbody">
              <div class="header-info">
                <div>المستخدم : ${orderData.userName || 'N/A'}</div>
                <div>Online Order</div>
                <div>${orderData.docCode || ''}</div>
              </div>
              ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR Code" class="qr-code" />` : ""}
            </div>
          </div>
          <div class="divider"></div>

          <div class="info-row">
            <span>Client:</span>
            <span>${orderData.custName || "N/A"}</span>
          </div>
          <div class="info-row">
            <span>Mobile:</span>
            <span>${orderData.custMobile || "N/A"}</span>
          </div>
          <div class="info-row">
            <span>Address:</span>
            <span>${orderData.custAdd || "N/A"}</span>
          </div>
          <div class="info-row">
            <span>No:</span>
            <span>${orderData.docNo || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span>Date:</span>
            <span>${orderData.docDate ? new Date(orderData.docDate).toLocaleDateString("en-GB") : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span>Paid By:</span>
            <span>${orderData.typeText || 'N/A'}</span>
          </div>

          <div class="divider"></div>

          <div class="items-header">
            <span>Item Code</span>
            <span>Color</span>
            <span>Size</span>
            <span>Qty</span>
            <span>Total</span>
          </div>

          ${details && Array.isArray(details) ? details.map(item => `
            <div class="item">
              <div class="item-name">${item.itemName || 'N/A'}</div>
              <div class="item-details">
                <span>${item.itemCode || 'N/A'}</span>
                <span>${item.colorName || 'N/A'}</span>
                <span>${item.sizeName || 'N/A'}</span>
                <span>${item.quantity || 0}</span>
                <span>${item.price || 0}</span>
              </div>
            </div>`).join("") : ""}

          <div class="divider"></div>

          <div class="totals">
            <div class="total-row">
              <span>TOTAL</span>
              <span>${orderData.quantity || 0}</span>
            </div>
            <div class="total-row">
              <span>Order Value</span>
              <span>${orderData.totalValue || 0}</span>
            </div>
            <div class="total-row">
              <span>Delivery Fees</span>
              <span>${orderData.deliveryFees || 0}</span>
            </div>
            <div class="total-row final-total">
              <span>Net</span>
              <span>${orderData.netTotalValue || 0}</span>
            </div>
          </div>

          <div class="footer">
            <div class="divider"></div>
            <div>${brandInfo?.branchName || ""}</div>
            <div>${brandInfo?.add || ""}</div>
            <div>${brandInfo?.tel || ""}</div>
            <div style="white-space: pre-line; direction: rtl; text-align: center;">
              ${brandInfo?.casherText || ""}
            </div>
            ${footerScr ? `<img src="${footerScr}" alt="Footer" class="logo" />` : ""}
          </div>
        </div>
      </body>
      </html>`;

    // نعمل iframe مخفي للطباعة
    const printIframe = document.createElement("iframe");
    printIframe.style.position = "fixed";
    printIframe.style.right = "0";
    printIframe.style.bottom = "0";
    printIframe.style.width = "0";
    printIframe.style.height = "0";
    printIframe.style.border = "0";
    document.body.appendChild(printIframe);

    const doc = printIframe.contentWindow.document;
    doc.open();
    doc.write(printContent);
    doc.close();

    printIframe.onload = () => {
      printIframe.contentWindow.focus();
      printIframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(printIframe);
      }, 500);
    };
  } catch (error) {
    console.error("Print error:", error);
    toast.error("Failed to print receipt");
  }
}, []); 
  // Optimized order action handler
  const handleOrderAction = useCallback(async (orderId, actionType, orderData = null) => {
    // Handle print action separately
    if (actionType === "print") {
      await handlePrintReceipt(orderData);
      return;
    }

    const actionKey = `${orderId}-${actionType}`;
    const config = actionConfigs[actionType];

    if (!config) {
      toast.error("Invalid action type");
      return;
    }

    try {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

      // For shipping action, the API call is already handled in ShippingPopup
      if (actionType === "shipping") {
        const optimisticUpdate = (data) => {
          if (!data?.data?.orders) return data;
          
          return {
            ...data,
            data: {
              ...data.data,
              orders: data.data.orders.map(order => 
                order.osid === orderId 
                  ? { ...order, orderStatus: config.state }
                  : order
              )
            }
          };
        };

        mutate(optimisticUpdate, { revalidate: false });
        toast.success("Order shipped successfully");
        return;
      }

      // Create optimistic update function
      const optimisticUpdate = (data) => {
        if (!data?.data?.orders) return data;
        
        return {
          ...data,
          data: {
            ...data.data,
            orders: data.data.orders.map(order => 
              order.osid === orderId 
                ? { ...order, orderStatus: config.state }
                : order
            )
          }
        };
      };

      const req = {
        id: orderId,
        state: config.state
      };

      // Make the API call
      const response = await apiService.postOrderStatus(req, token);

      if (response.success) {
        mutate(optimisticUpdate, { revalidate: false });
        toast.success(`Order ${actionType}d successfully`);
      } else {
        throw new Error(response.errorMessage || `Failed to ${actionType} order`);
      }
    } catch (error) {
      console.error(`Error ${actionType}ing order:`, error);
      // Rollback optimistic update by refetching
      mutate();
      toast.error(error.message || `Failed to ${actionType} order. Please try again.`);
    } finally {
      setLoadingActions((prev) => {
        const newState = { ...prev };
        delete newState[actionKey];
        return newState;
      });
    }
  }, [token, mutate, actionConfigs, handlePrintReceipt]);

  // Memoized action enablement checker
  const isActionEnabled = useCallback((orderStatus, actionType) => {
    if (actionType === "print") return true;
    
    switch (actionType) {
      case "confirm": return orderStatus === 1;
      case "prepare": return orderStatus === 2;
      case "shipping": return orderStatus === 3;
      case "cancel": return [1, 2, 3].includes(orderStatus);
      default: return false;
    }
  }, []);

  return {
    loadingActions,
    actionConfigs,
    handleOrderAction,
    isActionEnabled,
  };
};