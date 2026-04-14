// utils/orderHelpers.js
export const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(value || 0);
};

export const getStatusColor = (orderStatus) => {
  switch (orderStatus) {
    case 1: return { color: "#fff", text: "Placed" };
    case 2: return { color: "#bcffb7", text: "Confirmed" };
    case 3: return { color: "#fffec1", text: "Prepared" };
    case 4: return { color: "#807dfc", text: "On Deliver" };
    case 5: return { color: "#008382", text: "Delivered" };
    case 6: return { color: "#fac2c0", text: "Cancelled" };
    case 7: return { color: "#c70000", text: "System Cancelled" };
    case 8: return { color: "#3b3741ff", text: "Refund" };
    default: return { color: "#7e7979ff", text: "Unknown" };
  }
};