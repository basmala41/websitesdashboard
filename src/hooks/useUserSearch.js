import { useCallback, useState, useMemo, useEffect } from "react";
import useAuthStore from "../store/authStore";
import { fetchUserByMobile } from "../services/apiOrder";
import { ENV_CONFIG } from "../constants/config";

const useUserSearch = () => {
    const [mobile, setMobile] = useState("");
    const [userData, setUserData] = useState(null);
    const [userError, setUserError] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [voucherData, setVoucherData] = useState(null);

    // Governorates state
    const [governorates, setGovernorates] = useState([]);
    const [isLoadingGovernorates, setIsLoadingGovernorates] = useState(false);

    // Updated customer form data state to match new API structure
    const [customerFormData, setCustomerFormData] = useState({
        name: "",
        anotherMobile: "",
        address: "",
        anotherAddress: "",
        streetName: "",
        buldingNo: "",
        floorNo: "",
        flatNo: "",
        adressAdditionalInfo: "",
        vouchrId: "",
        points: "",
        governCode: "",
        addressId: "", // New field for selected user address
    });

    const { user } = useAuthStore();

    // Fetch governorates on component mount
    const fetchGovernorates = useCallback(async () => {
        setIsLoadingGovernorates(true);
        try {
            const response = await fetch(`${ENV_CONFIG.BASE_URL}/Governorate/getGovernorate`, {
                headers: {
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();

            if (data.success) {
                setGovernorates(data.data);
            }
        } catch (error) {
            console.error("Error fetching governorates:", error);
        } finally {
            setIsLoadingGovernorates(false);
        }
    }, [user.token]);

    // Fetch governorates on hook initialization
    useEffect(() => {
        if (user.token) {
            fetchGovernorates();
        }
    }, [fetchGovernorates, user.token]);

    // Update customer form data
    const updateCustomerFormData = useCallback((updates) => {
        setCustomerFormData(prev => ({
            ...prev,
            ...updates
        }));
    }, []);

    // Clear customer form
    const clearCustomerForm = useCallback(() => {
        setCustomerFormData({
            name: "",
            anotherMobile: "",
            address: "",
            anotherAddress: "",
            streetName: "",
            buldingNo: "",
            floorNo: "",
            flatNo: "",
            adressAdditionalInfo: "",
            vouchrId: "",
            points: "",
            governCode: "",
            addressId: "",
        });
    }, []);

    // Memoize the search function to prevent recreation
    const searchUser = useCallback(async () => {
        if (!mobile.trim()) return;

        setIsSearching(true);
        setUserError("");
        setUserData(null);

        try {
            const response = await fetchUserByMobile(mobile, user.token);

            if (response.success && response.data && response.data.id > 0) {
                setUserData(response);
                setUserError("");

                // Auto-fill form with existing user data based on new API structure
                setCustomerFormData({
                    name: response.data.name || "",
                    anotherMobile: response.data.anotherMobile || "",
                    // Reset address-related fields - user will select from dropdown or enter new
                    address: "",
                    anotherAddress: "",
                    streetName: "",
                    buldingNo: "",
                    floorNo: "",
                    flatNo: "",
                    adressAdditionalInfo: "",
                    vouchrId: "",
                    points: "",
                    governCode: "", // Will be set when user selects an address
                    addressId: "",
                });
            } else {
                setUserData(null);
                setUserError(response.errorMessage || "User not found");
                // Clear form for new user
                clearCustomerForm();
            }
        } catch (error) {
            console.error("Error searching for user:", error);
            setUserError("Error searching for user");
            clearCustomerForm();
        } finally {
            setIsSearching(false);
        }
    }, [mobile, user.token, clearCustomerForm]);

    // Memoize the return object to prevent recreation
    const returnValue = useMemo(() => ({
        mobile,
        setMobile,
        userData,
        setUserData,
        userError,
        setUserError: setUserError,
        searchUser,
        isSearching,
        customerFormData,
        updateCustomerFormData,
        clearCustomerForm,
        governorates,
        isLoadingGovernorates,
        fetchGovernorates,
        voucherData,
    setVoucherData,
    }), [
        mobile,
        userData,
        userError,
        searchUser,
        isSearching,
        customerFormData,
        updateCustomerFormData,
        clearCustomerForm,
        governorates,
        isLoadingGovernorates,
        fetchGovernorates,
        voucherData,
    setVoucherData,
    ]);

    return returnValue;
};

export default useUserSearch;