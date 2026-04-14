import {
  ENV_CONFIG,
  API_ENDPOINTS,
  HTTP_METHODS,
  DEFAULT_HEADERS,
  IMAGE_UPLOAD_CONFIG,
  getAuthHeaders,
  getImageUploadHeaders,
  buildUrl,
  buildImageUrl,
  REQUEST_CONFIG,
} from "../constants/config";

class ApiService {
  constructor() {
    this.baseURL = ENV_CONFIG.BASE_URL;
    this.imageBaseURL = IMAGE_UPLOAD_CONFIG.BASE_URL;
    this.retries = REQUEST_CONFIG.retries;
    this.retryDelay = REQUEST_CONFIG.retryDelay;
  }

  async request(url, options = {}, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options.timeout || REQUEST_CONFIG.timeout
    );
    const startTime = Date.now();
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      if (!response.ok) {
        // Handle specific HTTP errors
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        if (response.status === 500) {
          throw new Error("Server error");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Retry logic for timeouts and network errors
      if (
        retryCount < this.retries &&
        (error.name === "AbortError" || error.message.includes("network"))
      ) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.request(url, options, retryCount + 1);
      }

      if (error.name === "AbortError") {
        throw new Error(`Request timeout after ${REQUEST_CONFIG.timeout}ms`);
      }

      throw error;
    }
  }

  async get(endpoint, params = {}, token = null, timeout = null) {
    const url = buildUrl(endpoint, params);
    const headers = token ? getAuthHeaders(token) : DEFAULT_HEADERS;

    return this.request(url, {
      method: HTTP_METHODS.GET,
      headers,
      timeout: timeout || REQUEST_CONFIG.timeout,
    });
  }

  async post(endpoint, data = {}, token = null, params = {}) {
    const url = buildUrl(endpoint, params);
    const headers = token ? getAuthHeaders(token) : DEFAULT_HEADERS;

    return this.request(url, {
      method: HTTP_METHODS.POST,
      headers,
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data = {}, token = null) {
    const url = buildUrl(endpoint);
    const headers = token ? getAuthHeaders(token) : DEFAULT_HEADERS;

    return this.request(url, {
      method: HTTP_METHODS.PUT,
      headers,
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, token = null) {
    const url = buildUrl(endpoint);
    const headers = token ? getAuthHeaders(token) : DEFAULT_HEADERS;

    return this.request(url, {
      method: HTTP_METHODS.DELETE,
      headers,
    });
  }

  async uploadImage(endpoint, formData, token = null, timeout = null) {
    const url = buildImageUrl(endpoint);
    const headers = getImageUploadHeaders(token);

    return this.request(url, {
      method: HTTP_METHODS.POST,
      headers,
      body: formData,
      timeout: timeout || REQUEST_CONFIG.imageTimeout,
    });
  }

  async login(userCode, password) {
    return this.post(API_ENDPOINTS.AUTH.LOGIN, {}, null, {
      userCode,
      password,
    });
  }

  async fetchUsername(userCode) {
    return this.get(API_ENDPOINTS.AUTH.GET_USERNAME, { userCode });
  }

  async getAppOptions(token) {
    return this.get(API_ENDPOINTS.ADMIN_OPTIONS.APP_OPTIONS, {}, token);
  }

  async getAppLanguage(token) {
    return this.get(API_ENDPOINTS.ADMIN_OPTIONS.APP_LANGUAES, {}, token);
  }

/*   async getItems(pageNo = 1, pageSize = 20, token = null) {
    return this.get(
      API_ENDPOINTS.IMAGE_DETAILS.GET_ITEMS,
      { pageNo, pageSize },
      token
    );
  } */
 async getItems(pageNo = 1, pageSize = 20, token = null, searchText = "", signal = null) {
  const params = { pageNo, pageSize };
  
  // Only add searchText if it's not empty
  if (searchText && searchText.trim()) {
    params.searchText = searchText.trim();
  }
  
  return this.request(
    buildUrl(API_ENDPOINTS.IMAGE_DETAILS.GET_ITEMS, params),
    {
      method: HTTP_METHODS.GET,
      headers: token ? getAuthHeaders(token) : DEFAULT_HEADERS,
      signal, // Pass the abort signal
    }
  );
}

  async getCategory(token = null) {
    const response = await this.get(
      API_ENDPOINTS.Category.GET_CATEGORIES,
      {},
      token
    );
    return response;
  }

  async EditCategory(data, token = null) {
    return this.postCategoryWithImage(data, token);
  }

  async postCategoryWithImage(data, token = null) {
    try {
      const categoryResult = await this.post(
        API_ENDPOINTS.Category.POST_CATEGORY,
        {
          languageCode: data.languageCode,
          mainCategoryCode: data.mainCategoryCode,
          mainCategoryName: data.mainCategoryName,
        },
        token
      );
      if (data.image && categoryResult.success) {
        const formData = new FormData();
        formData.append("token", token);
        formData.append("Code", data.mainCategoryCode);

        formData.append("CategoryImage", data.image);

        const imageResult = await this.uploadImage(
          API_ENDPOINTS.Category.POST_CATEGORYIMAGE,
          formData,
          token
        );

        return {
          success: categoryResult.success && imageResult.success,
          categoryResult,
          imageResult,
        };
      }

      return {
        success: categoryResult.success,
        categoryResult,
        imageResult: null,
      };
    } catch (error) {
      console.error("Error in postCategoryWithImage:", error);
      throw error;
    }
  }

  async getSubCategory(categoryID, token = null) {
    const response = await this.get(
      API_ENDPOINTS.Category.GET_SUBCATEGORY,
      {},
      token
    );
    const subCategory = response.data.filter((item) => item.mainCategoryCode == categoryID);
    return subCategory;
  }

  async EditSubCategory(data, token = null) {
    return this.postSubCategoryWithImage(data, token);
  }

  async postSubCategoryWithImage(data, token = null) {
    try {
      const SubCategoryResult = await this.post(
        API_ENDPOINTS.Category.POST_SUBCATEGORY,
        {
          languageCode: data.languageCode,
          subCategoryCode: data.subCategoryCode,
          subCategoryName: data.subCategoryName,
        },
        token
      );
      if (data.image && SubCategoryResult.success) {
        const formData = new FormData();
        formData.append("token", token);
        formData.append("Code", data.subCategoryCode);
        formData.append("MainCategoryCode", data.mainCategoryCode);

        formData.append("SubCategoryImage", data.image);

        const imageResult = await this.uploadImage(
          API_ENDPOINTS.Category.POST_SUBCATEGORYIMAGE,
          formData,
          token
        );

        return {
          success: SubCategoryResult.success && imageResult.success,
          SubCategoryResult,
          imageResult,
        };
      }

      return {
        success: SubCategoryResult.success,
        SubCategoryResult,
        imageResult: null,
      };
    } catch (error) {
      console.error("Error in postSubCategoryWithImage:", error);
      throw error;
    }
  }

  async getColors(token = null) {
    return this.get(API_ENDPOINTS.Colors.GET_COLORS, {}, token);
  }
  async editColor(data, token = null) {
    return this.postColorWithHex(data, token);
  }

  async postColorWithHex(data, token = null) {
    try {
      const ColorResult = await this.post(
        API_ENDPOINTS.Colors.POST_COLOR,
        {
          languageCode: data.languageCode,
          colorCode: data.colorCode,
          colorName: data.colorName,
        },
        token
      );
      if (data.colorHex && ColorResult.success) {
        const ColorHexResult = await this.post(
          API_ENDPOINTS.Colors.POST_COLORHEX,
          {
            code: data.colorCode,
            colorHex: data.colorHex,
          },
          token
        );

        return {
          success: ColorResult.success && ColorHexResult.success,
          ColorResult,
          ColorHexResult,
        };
      }

      return {
        success: ColorResult.success,
        ColorResult,
        ColorHexResult: null,
      };
    } catch (error) {
      console.error("Error in postColorWithHex:", error);
      throw error;
    }
  }

  async getBanners(token = null) {
    return this.get(API_ENDPOINTS.Banner.GET_BANNERS, {}, token);
  }
  async deleteBanner(bannerId, token = null) {
    return this.post(
      `${API_ENDPOINTS.Banner.DELETE_BANNER}?id=${bannerId}`,
      {},
      token
    );
  }
  async postBanner(data, token = null) {
    try {
      const formData = new FormData();
      formData.append("token", token);
      formData.append("BannerImages", data.BannerImages);

      formData.append("SubCategoryImage", data.image);

      const imageResult = await this.uploadImage(
        API_ENDPOINTS.Banner.POST_BANNER,
        formData,
        token
      );

      return imageResult;
    } catch (error) {
      console.error("Error in postSubCategoryWithImage:", error);
      throw error;
    }
  }

  async getBranches(token = null) {
    return this.get(API_ENDPOINTS.Branches.GET_BRANCHES, {}, token);
  }
  async editBranch(data, token = null) {
    return this.postBranchWithLocation(data, token);
  }
  async postBranchWithLocation(data, token = null) {
    try {
      const BranchResult = await this.post(
        API_ENDPOINTS.Branches.POST_BRANCH,
        {
          languageCode: data.languageCode,
          branchCode: data.branchCode,
          name: data.name,
          adress: data.address,
        },
        token
      );
      if (data.locationLink && BranchResult.success) {
        const BranchLink = await this.post(
          API_ENDPOINTS.Branches.POST_BRANCHLOCATION,
          {
            branchCode: data.branchCode,
            locationLink: data.locationLink,
          },
          token
        );
        return {
          success: BranchResult.success && BranchLink.success,
          BranchResult,
          BranchLink,
        };
      }
      return {
        success: BranchResult.success ,
        BranchResult,
        BranchLink:null,
      };
    } catch (error) {
      console.error("Error in postColorWithHex:", error);
      throw error;
    }
  }

  async getItemDetails(itemCode,token=null){
    return this.get(API_ENDPOINTS.IMAGE_DETAILS.GET_ITEMSDETAILS, {
     itemCode
    }, token);
  }
    async getOrderss(token=null,pagination, filters) {
          const pageNo = pagination.pageIndex + 1;
    const pageSize = pagination.pageSize;
    let url = `${API_ENDPOINTS.Orders.GET_ORDERS}?pageNo=${pageNo}&pageSize=${pageSize}`;
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom).toISOString();
      url += `&from=${encodeURIComponent(fromDate)}`;
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      url += `&to=${encodeURIComponent(toDate.toISOString())}`;
    }

    if (filters.orderStatus !== "") {
      url += `&orderStatus=${filters.orderStatus}`;
    }
    return this.get(url,{}, token);
  }
  async postOrderStatus(data,token=null){
    return this.post(API_ENDPOINTS.Orders.POST_ORDERSTATUS, {
      id:data.id,
      satate:data.state
    }, token);
  }
   async getOrderShipping(osid,token=null){
    return this.get(API_ENDPOINTS.Orders.GET_SHIPPING, {
     osid
    }, token);
  }
  async postOrderShipping(data,token=null){
    return this.post(API_ENDPOINTS.Orders.POST_SHIPPING, data, token);
  }

  async getNotificationCodes(token) {
    try {
      const response = await this.get(API_ENDPOINTS.NOTIFICATION.GET_CODES, {}, token);

      // Handle different response structures
      const data = response?.data || response || [];

      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: 'Notification codes loaded successfully'
      };
    } catch (error) {
      console.error('Error fetching notification codes:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        data: []
      };
    }
  }

  async getItemDropdown(token) {
    try {
      const response = await this.get(API_ENDPOINTS.NOTIFICATION.GET_ITEM_DROPDOWN, {}, token);

      const data = response?.data || response || [];

      return {
        success: true,
        data: Array.isArray(data) ? data : [],
        message: 'Items loaded successfully'
      };
    } catch (error) {
      console.error('Error fetching items:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        data: []
      };
    }
  }

  async addNotification(formData, token) {
    try {
      const response = await this.uploadImage(
        API_ENDPOINTS.NOTIFICATION.ADD_NOTIFICATION,
        formData,
        token
      );

      return {
        success: true,
        data: response.data.data || response,
        message: 'Notification created successfully'
      };
    } catch (error) {
      console.error('Error adding notification:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  async sendNotificationToAll(docNo, token) {
    try {
      const response = await this.post(
        `${API_ENDPOINTS.NOTIFICATION.SEND_TO_ALL}?DocNo=${docNo}`,
        {},
        token
      );

      return {
        success: true,
        data: response.data || response,
        message: 'Notification sent to all users successfully'
      };
    } catch (error) {
      console.error('Error sending notification to all:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  async sendNotificationToUser(userMobile, docNo, token) {
    try {
      const response = await this.post(
        API_ENDPOINTS.NOTIFICATION.SEND_TO_USER,
        {
          userMobile: userMobile,
          docNo: docNo
        },
        token
      );

      return {
        success: true,
        data: response.data || response,
        message: `Notification sent to ${userMobile} successfully`
      };
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

async getPolicies(token=null){
return this.get(API_ENDPOINTS.OurPolicy.GET_POLICIES, {}, token);
}

async postPolicies(data,token=null){
      return this.post(API_ENDPOINTS.OurPolicy.POST_POLICIES, data, token);

}

 /* async getUsers(pageNo = 1, pageSize = 20, token = null) {
    return this.get(
      API_ENDPOINTS.USER.GET_USERS,
      { pageNo, pageSize },
      token
    );
  }
 */

  async getUsers(pageNo = 1, pageSize = 20, token = null, mobile = "", signal = null) {
  const params = { pageNo, pageSize };
  
  // Only add searchText if it's not empty
  if (mobile && mobile.trim()) {
    params.mobile = mobile.trim();
  }
  
  return this.request(
    buildUrl(API_ENDPOINTS.USER.GET_USERS, params),
    {
      method: HTTP_METHODS.GET,
      headers: token ? getAuthHeaders(token) : DEFAULT_HEADERS,
      signal, // Pass the abort signal
    }
  );
}
 async getBestSellerImge(token = null) {
    return this.get(API_ENDPOINTS.HomeBanners.GET_BESTSELLERIMAGE, {}, token);
  }
   async getNewArrivalImge(token = null) {
    return this.get(API_ENDPOINTS.HomeBanners.GET_NEWARRIVALIMAGE, {}, token);
  }

 async postArrivalImage(data, token = null) {
  try {
    const formData = new FormData();
    formData.append("token", token);
    formData.append("NewArrivalImage", data.NewArrivalImage);
      
    const imageResult = await this.uploadImage(
      API_ENDPOINTS.HomeBanners.POST_NEWARRIVALIMAGE,
      formData,
      token
    );
     
    return imageResult;
  } catch (error) {
    console.error("Error in postNewArrivalWithImage:", error);
    throw error;
  }
}
async postSellerImage(data, token = null) {
  try {
    const formData = new FormData();
    formData.append("token", token);
    formData.append("BestSellerImage", data.BestSellerImage);
      
    const imageResult = await this.uploadImage(
      API_ENDPOINTS.HomeBanners.POST_BESTSELLERIMAGE,
      formData,
      token
    );
     
    return imageResult;
  } catch (error) {
    console.error("Error in postBestSellerWithImage:", error);
    throw error;
  }
}



async postRefresh(endopint,token=null){
      return this.post(endopint, {}, token);
}

async postOrderForClient (data, token = null) {
      return this.post(API_ENDPOINTS.Orders.POST_ORDERSFORCLIENT, data, token);
}



async getHomeVideo(token = null) {
  try {
    const response = await this.get('/admin/Banner/getVideoUrl', {}, token);
    return {
      success: response.success,
      data: response.data,
      message: response.success ? 'Video loaded successfully' : 'Failed to load video'
    };
  } catch (error) {
    console.error('Error fetching home video:', error);
    return {
      success: false,
      message: this.getErrorMessage(error),
      data: null
    };
  }
}

// Upload video
async uploadHomeVideo(videoFile, token = null) {
  try {
    if (!videoFile) {
      throw new Error('No video file provided');
    }

    // Validate file type
    if (!videoFile.type.startsWith('video/')) {
      throw new Error('Please select a valid video file');
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (videoFile.size > maxSize) {
      throw new Error('Video file size must be less than 50MB');
    }

    const formData = new FormData();
    formData.append('token', token);
    formData.append('Video', videoFile);

    const response = await this.uploadImage(
      '/Banner/addWebVideo',
      formData,
      token,
      120000 // 2 minutes timeout for video uploads
    );

    return {
      success: response.success || true,
      data: response.data,
      message: 'Video uploaded successfully'
    };
  } catch (error) {
    console.error('Error uploading home video:', error);
    return {
      success: false,
      message: this.getErrorMessage(error)
    };
  }
}

// Delete video
async deleteHomeVideo(token = null) {
  try {
    const response = await this.post('/admin/Banner/deleteBannerVideo', {}, token);
    
    return {
      success: response.success || true,
      data: response.data,
      message: 'Video deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting home video:', error);
    return {
      success: false,
      message: this.getErrorMessage(error)
    };
  }
}
async getContactUs(token = null) {
  return this.get(API_ENDPOINTS.ContactUs.GET_CONTACT, {}, token);
}
 
async manageContactUs(data, token = null) {
  return this.post(API_ENDPOINTS.ContactUs.POST_CONTACT, data, token);
}
 

  // Utility method for consistent error handling
  getErrorMessage(error) {
    if (error.message) {
      // Handle specific error types
      if (error.message.includes('timeout')) {
        return 'Request timed out. Please check your connection and try again.';
      }
      if (error.message.includes('401')) {
        return 'Authentication failed. Please log in again.';
      }
      if (error.message.includes('403')) {
        return 'You do not have permission to perform this action.';
      }
      if (error.message.includes('500')) {
        return 'Server error. Please try again later.';
      }
      return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
  }

  
}

// Export singleton instance
export default new ApiService();
