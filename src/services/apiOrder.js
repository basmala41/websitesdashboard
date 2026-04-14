import apiService from "./apiService";

export const fetchUserByMobile = async (mobile, token) => {
    try {
        const response = await apiService.get(
            `/ManageUsers/getUserByMobile`,
            {
                mobile,
            },
            token
        );
        return response;
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error;
    }
};

export const fetchItems = async (token) => {
    try {
        const response = await apiService.getItemDropdown(token);
        return response;
    } catch (error) {
        console.error("Error fetching items:", error);
        throw error;
    }
};

export const fetchProductDetails = async (itemCode, token) => {
    try {
        const response = await apiService.get(
            "/admin/AdminProduct",
            { itemCode },
            token
        );
        return response;
    } catch (error) {
        console.error("Error fetching product details:", error);
        throw error;
    }
};