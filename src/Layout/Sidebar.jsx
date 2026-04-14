import React from "react";
import {
  HardDrive,
  Palette,
  Bandage,
  Split,
  MessageCircle,
  Archive,
  ListOrdered,
  Bell,
  ReceiptText,
  Users,
  FileVideoCamera,
  Captions,
  RefreshCcw,
  BadgePlus,
  Mail
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import styles from "../styles/sidebar.module.css";
import useAuthStore from "../store/authStore";
import { toast, ToastContainer } from "react-toastify"; // Make sure you have this import
import apiService from "../services/apiService";

import { API_ENDPOINTS, ENV_CONFIG } from "../constants/config";
const Sidebar = () => {
  const location = useLocation();
  const { appOptions, user } = useAuthStore(); // Added user from auth store

 const handleRefresh = async () => {
    const REVALIDATE_SECRET =
      "c9adae222c2de4226e693d559e1a2fc3554fa5847f189753fdc1cb4fd2d33a83"; // Same secret from your Next.js .env

    try {
      // 1. Refresh backend caches first
      const backendOperations = [
        apiService.postRefresh(
          API_ENDPOINTS.RefreshCache.RefreshCacheSizeData,
          user.token
        ),
        apiService.postRefresh(
          API_ENDPOINTS.RefreshCache.RefreshCacheColorsData,
          user.token
        ),
        apiService.postRefresh(
          API_ENDPOINTS.RefreshCache.RefreshCacheCategorisData,
          user.token
        ),
        apiService.postRefresh(
          API_ENDPOINTS.RefreshCache.RefreshCacheSubCategoriesData,
          user.token
        ),
        apiService.postRefresh(
          API_ENDPOINTS.RefreshCache.RefreshCacheBannerData,
          user.token
        ),
        apiService.postRefresh(
          API_ENDPOINTS.RefreshCache.RefreshCacheBestSeller,
          user.token
        ),
      ];

      // Execute all backend cache refreshes
      const backendResults = await Promise.all(backendOperations);


      // Check if all backend operations succeeded
      const allBackendSuccess = backendResults.every(
        (response) => {
          return response && response.data && response.success;
        }
      );

      if (!allBackendSuccess) {
        
        throw new Error("Some backend cache refresh operations failed");
      }

      // 2. Now refresh Next.js frontend cache
    const nextjsResponse = await fetch("https://beneshty.com/api/revalidate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    secret: REVALIDATE_SECRET,
    tags: ["products", "products-bestSeller", "products-recent", "products-deals", "categories", "banners"],
  }),
});

      if (!nextjsResponse.ok) {
        console.warn(
          "Next.js cache revalidation failed:",
          await nextjsResponse.text()
        );
        // Don't throw error here - backend cache refresh was successful
        toast.success(
          "Backend cache refreshed (Frontend cache refresh failed)"
        );
        return;
      }

      const nextjsResult = await nextjsResponse.json();
      console.log("Next.js cache revalidated:", nextjsResult);
 
      toast.success(
        "Cache refreshed successfully"
      );
    } catch (error) {
      toast.error("Cache refresh failed");
    }
  }; 
  const sections = [
    {
      title: "Basic Data",
      items: [
        { icon: Archive, label: "Category", path: "/category" },
        { icon: Palette, label: "Colors", path: "/colors" },
        { icon: HardDrive, label: "Items", path: "/" },
        { icon: Bandage, label: "Banner", path: "/banner" },
        
        ...(appOptions?.dealWithBestSellerImageFlage == 1
          ? [
              {
                icon: Captions,
                label: "Best Seller Image",
                path: "/bestSellerImage",
              },
            ]
          : []),
        ...(appOptions?.dealWithNewArrivalImageFlage == 1
          ? [
              {
                icon: Captions,
                label: "New Arrival Image",
                path: "/newArrivalImage",
              },
            ]
          : []),
        ...(appOptions?.homeVideo == 1
          ? [{ icon: FileVideoCamera, label: "Home Video", path: "/homeVideo" }]
          : []),
      ],
    },
    {
      title: "Orders",
      items: [
        { icon: ListOrdered, label: "Orders", path: "/orders" },
        { icon: BadgePlus, label: "Create Order", path: "/createorder" }
      ],
    },
    {
      title: "Support",
      items: [
        { icon: Split, label: "Branches", path: "/branches" },
        { icon: Users, label: "Users", path: "/users" },
        ...(appOptions?.chatFlage == 1
          ? [{ icon: MessageCircle, label: "Chat", path: "/chat" }]
          : []),
        ...(appOptions?.notification == 1
          ? [{ icon: Bell, label: "Notifications", path: "/notifications" }]
          : []),
        { icon: ReceiptText, label: "Terms & Conditions", path: "/terms" },
        { icon: RefreshCcw, label: "Refresh Cache", action: handleRefresh }, // Changed from path to action
        { icon: Mail, label: "Contact Us", path: "/contactUs" }
      ],
    }
  ];

  return (
    <div className={styles.sidebar}>
      <nav className={styles.sidebarNav}>
        {sections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={styles.section}>
            <p className={styles.sectionTitle}>{section.title}</p>
            {section.items.map((item, itemIndex) => {
              const Icon = item.icon;
              const isActive = item.path && location.pathname == item.path;

              // If item has an action instead of path, render as button
              if (item.action) {
                return (
                  <button
                    key={itemIndex}
                    onClick={item.action}
                    className={`${styles.navItem} ${styles.navButton}`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                );
              }

              // Regular navigation item
              return (
                <Link
                  key={itemIndex}
                  to={item.path}
                  className={`${styles.navItem} ${
                    isActive ? styles.navItemActive : ""
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <ToastContainer/>
    </div>
  );
};

export default Sidebar;