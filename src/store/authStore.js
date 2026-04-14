import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '../services/apiService';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            appOptions: null,
            LangData: null,
            defaultLang: null,
            isLoading: false,

            login: async (userCode, password) => {
                set({ isLoading: true });

                try {
                    // Step 1: Login
                    const result = await apiService.login(userCode, password);

                    if (!result.success) {
                        set({ isLoading: false });
                        return { success: false, message: result.message || 'Login failed' };
                    }

                    const token = result.data.token;
                    
                    // Step 2: Fetch app options and language data in parallel
                    try {
                        const [resultOptions, resultLanguage] = await Promise.all([
                            apiService.getAppOptions(token),
                            apiService.getAppLanguage(token)
                        ]);

                        // Process language data
                        let langData = null;
                        let defaultLang = null;
                        
                        if (resultLanguage.success && resultLanguage.data) {
                            langData = resultLanguage.data;
                            // Find the language with defaultFlage = 1
                            const defaultLanguage = resultLanguage.data.find(lang => lang.defaultFlage === 1);
                            if (defaultLanguage) {
                                defaultLang = defaultLanguage.code;
                            }
                        }

                        // Set auth state
                        set({
                            user: result.data,
                            token: token,
                            isAuthenticated: true,
                            appOptions: resultOptions.success ? resultOptions.data : null,
                            LangData: langData,
                            defaultLang: defaultLang,
                            isLoading: false
                        });

                        return {
                            success: true,
                            appOptionsLoaded: resultOptions.success,
                            languageLoaded: resultLanguage.success,
                            appOptionsMessage: !resultOptions.success ? 'Failed to load app options' : null,
                            languageMessage: !resultLanguage.success ? 'Failed to load language data' : null
                        };

                    } catch (optionsError) {
                        console.error('App options/language fetch error:', optionsError);

                        // Still set auth state even if appOptions/language failed
                        set({
                            user: result.data,
                            token: token,
                            isAuthenticated: true,
                            appOptions: null,
                            LangData: null,
                            defaultLang: null,
                            isLoading: false
                        });

                        return {
                            success: true,
                            appOptionsLoaded: false,
                            languageLoaded: false,
                            appOptionsMessage: 'Failed to load app options due to network error',
                            languageMessage: 'Failed to load language data due to network error'
                        };
                    }

                } catch (error) {
                    console.error('Login error:', error);
                    set({ isLoading: false });
                    return { success: false, message: error.message || 'Network error during login' };
                }
            },

            fetchUsername: async (userCode) => {
                try {
                    const result = await apiService.fetchUsername(userCode);

                    if (result.success) {
                        return { success: true, username: result.data };
                    } else {
                        return { success: false, message: result.message || 'Failed to fetch username' };
                    }
                } catch (error) {
                    console.error('Fetch username error:', error);
                    return { success: false, message: error.message || 'Network error' };
                }
            },

            retryAppOptions: async () => {
                const { token } = get();
                if (!token) return { success: false, message: 'No auth token available' };

                try {
                    const [resultOptions, resultLanguage] = await Promise.all([
                        apiService.getAppOptions(token),
                        apiService.getAppLanguage(token)
                    ]);

                    // Process language data
                    let langData = null;
                    let defaultLang = null;
                    
                    if (resultLanguage.success && resultLanguage.data) {
                        langData = resultLanguage.data;
                        const defaultLanguage = resultLanguage.data.find(lang => lang.defaultFlage === 1);
                        if (defaultLanguage) {
                            defaultLang = defaultLanguage.code;
                        }
                    }

                    set({ 
                        appOptions: resultOptions.success ? resultOptions.data : null,
                        LangData: langData,
                        defaultLang: defaultLang
                    });
                    
                    return { 
                        success: true,
                        appOptionsLoaded: resultOptions.success,
                        languageLoaded: resultLanguage.success
                    };
                } catch (error) {
                    console.error('Retry app options/language error:', error);
                    return { success: false, message: error.message || 'Network error' };
                }
            },

            retryLanguageOnly: async () => {
                const { token } = get();
                if (!token) return { success: false, message: 'No auth token available' };

                try {
                    const result = await apiService.getAppLanguage(token);

                    let langData = null;
                    let defaultLang = null;
                    
                    if (result.success && result.data) {
                        langData = result.data;
                        const defaultLanguage = result.data.find(lang => lang.defaultFlage === 1);
                        if (defaultLanguage) {
                            defaultLang = defaultLanguage.code;
                        }
                    }

                    set({ 
                        LangData: langData,
                        defaultLang: defaultLang
                    });
                    
                    return { 
                        success: result.success,
                        message: result.success ? null : result.message || 'Failed to fetch language data'
                    };
                } catch (error) {
                    console.error('Retry language error:', error);
                    return { success: false, message: error.message || 'Network error' };
                }
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    appOptions: null,
                    LangData: null,
                    defaultLang: null,
                    isLoading: false
                });
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                appOptions: state.appOptions,
                LangData: state.LangData,
                defaultLang: state.defaultLang
            })
        }
    )
);

export default useAuthStore;