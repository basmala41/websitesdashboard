const test={
  BASEONE:"https://apitest.geniussystemapi.com/api",
  BASETWO:"https://adminapi.geniussystemtest.com/api"
 
}

const beneshtyURL={
  BASEONE:"https://beneshtyapi.geniussystemapi.com/api",
  BASETWO:"https://adminapi.beneshty.com/api"
 }
 const sheinURL={
  BASEONE:"https://sheinstuffapi.geniussystemapi.com/api",
  BASETWO:"https://adminapi.sheinstuff.com/api"
 }
 const upup={
    BASEONE:"https://upupapi.geniussystemapi.com/api",
  BASETWO:"https://adminapi.upup-egy.com/api"
 }
 const pm={
   BASEONE:"https://mehraelapi.geniussystemapi.com/api",
  BASETWO:"https://adminapi.mehrailpm.com/api"
 }
 const baraka={
    BASEONE:"https://elbarakatradingapi.geniussystemapi.com/api",
  BASETWO:"https://www.adminapi.elbarakatrading.com/api"
 }
 const config = {
  development: {
     BASE_URL: sheinURL.BASEONE,
    API_TIMEOUT: 60000, 
  },
  production: {
    BASE_URL: sheinURL.BASEONE,
    API_TIMEOUT: 60000, 
  },
  test: {
    BASE_URL: sheinURL.BASEONE,
    API_TIMEOUT: 60000, 
  },
};



export const IMAGE_UPLOAD_CONFIG = {
  BASE_URL: sheinURL.BASETWO,
  TIMEOUT: 120000, // 2 minutes for image uploads
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],
};

const getEnvironment = () => {
  return "development";
};

export const ENV_CONFIG = config[getEnvironment()];

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/admin/AdminAuth/login",
    GET_USERNAME: "/admin/AdminAuth/getUsername",
    REFRESH_TOKEN: "/admin/AdminAuth/refresh", 
  },
  ADMIN_OPTIONS: {
    APP_OPTIONS: "/admin/AdminOptions/appOptions",
    APP_LANGUAES: "/admin/AdminOptions/getLanguage",
  },
  IMAGE_DETAILS: {
    GET_ITEMS: "/admin/ImageDetails/getItems",
    GET_ITEMSDETAILS:"/admin/ImageDetails/getItemById"
  },
  Category: {
    GET_CATEGORIES: "/admin/Category/getCategories",
    POST_CATEGORY: "/admin/Category/addCategoryLangDetails",
    POST_CATEGORYIMAGE: "/Category/addCategoryImage",
    GET_SUBCATEGORY: "/admin/Category/getSubCategories",
    POST_SUBCATEGORY: "/admin/Category/addSubCategoryLangDetails",
    POST_SUBCATEGORYIMAGE:"/Category/addSubCategoryImage"
  },
  Colors:{
    GET_COLORS:"/admin/Color/getColors",
    POST_COLOR:"/admin/Color/addColorLangDetails",
    POST_COLORHEX:"/admin/Color/addColor"
  },
  Banner:{
    GET_BANNERS:"/admin/Banner/getBanners",
    DELETE_BANNER:"/admin/Banner/deleteBannerPic",
    POST_BANNER:"/Banner/addBannerPic"
  },
  Branches:{
    GET_BRANCHES:"/admin/BranchLang/getAllBranchs",
    POST_BRANCH:"/admin/BranchLang/manageBranchData",
    POST_BRANCHLOCATION:"/admin/BranchLang/manageBranchLocation"
  },
  Orders:{
    GET_ORDERS:"/admin/AdminOrder",
    POST_ORDERSTATUS:"/admin/AdminOrder",
    GET_SHIPPING:"/admin/AdminOrderShipping",
    POST_SHIPPING:"/admin/AdminOrderShipping",
    POST_ORDERSFORCLIENT: "/admin/AdminOrder/saveOrder",
  },
  NOTIFICATION: {
    GET_CODES: "/admin/BasicData/getNotificationCodes",
    GET_ITEM_DROPDOWN: "/admin/BasicData/getItemDropdown",
    ADD_NOTIFICATION: "/Notification/addNotification",
    SEND_TO_ALL: "/admin/Notification/sendNotificationToAllTopic",
    SEND_TO_USER: "/admin/Notification/sendNotificationToUser"
  },
  OurPolicy:{
    GET_POLICIES:"/admin/OurPolicy/getPolicies",
    POST_POLICIES:"/admin/OurPolicy/managePolicyByLang"
  },
  USER: {
    PROFILE: "/admin/User/profile",
    UPDATE_PROFILE: "/admin/User/updateProfile",
    GET_USERS:"/ManageUsers/getAll",
    RESET_PASSWORD:"/ManageUsers/resetUserPassword"
  },
  VIDEO: {
    GET_HOME_VIDEO: "/admin/Banner/getVideoUrl",
    UPLOAD_HOME_VIDEO: "/Banner/addWebVideo",
    DELETE_HOME_VIDEO: "/admin/Banner/deleteBannerVideo"
  },
  HomeBanners:{
    GET_BESTSELLERIMAGE:"/admin/AdminBestSellerImage",
    POST_BESTSELLERIMAGE:"/BestSeller/addBestSellerPic",
       GET_NEWARRIVALIMAGE:"/admin/AdminNewArrivalImage",
    POST_NEWARRIVALIMAGE:"/NewArrival/addNewArrivalPic"
  },
  RefreshCache:{
    RefreshCacheSizeData:"/AdminCache/refreshCacheSizeData",
    RefreshCacheColorsData:"/AdminCache/refreshCacheColorsData",
    RefreshCacheCategorisData:"/AdminCache/refreshCacheCategorisData",
    RefreshCacheSubCategoriesData:"/AdminCache/refreshCacheSubCategoriesData",
    RefreshCacheBannerData:"/AdminCache/refreshCacheBannerData",
    RefreshCacheBestSeller:"/AdminCache/refreshCacheBestSeller"
  },
  ContactUs: {
    GET_CONTACT:  "/admin/AdminContactUs/getAll",
    POST_CONTACT: "/admin/AdminContactUs/manage",
  },
};

export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
};

export const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
};


export const IMAGE_UPLOAD_HEADERS = {
  Accept: "multipart/form-data",
};


export const getAuthHeaders = (token) => ({
  ...DEFAULT_HEADERS,
  Authorization: `Bearer ${token}`,
});

export const getImageUploadHeaders = (token) => ({
  ...IMAGE_UPLOAD_HEADERS,
  ...(token && { Authorization: `Bearer ${token}` }),
});


export const buildUrl = (endpoint, params = {}) => {
  const url = new URL(`${ENV_CONFIG.BASE_URL}${endpoint}`);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};

export const buildImageUrl = (endpoint, params = {}) => {
  const url = new URL(`${IMAGE_UPLOAD_CONFIG.BASE_URL}${endpoint}`);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });
  return url.toString();
};


export const validateImageFile = (file) => {
  if (!file) return { valid: false, error: "No file provided" };

  if (file.size > IMAGE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size must be less than ${
        IMAGE_UPLOAD_CONFIG.MAX_FILE_SIZE / (1024 * 1024)
      }MB`,
    };
  }
  if (!IMAGE_UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type must be one of: ${IMAGE_UPLOAD_CONFIG.ALLOWED_TYPES.join(
        ", "
      )}`,
    };
  }
  return { valid: true, error: null };
};


export const API_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const REQUEST_CONFIG = {
  timeout: ENV_CONFIG.API_TIMEOUT,
  imageTimeout: IMAGE_UPLOAD_CONFIG.TIMEOUT,
  retries: 3,
  retryDelay: 1000, 
};
