import React, { useState, useEffect, useCallback } from "react";
import apiService from "../../services/apiService";
import styles from "../../styles/editItems.module.css";

const ItemDetails = ({
  itemLangDetails,
  languages,
  itemId,
  token,
  onUpdate,
}) => {
  const [formData, setFormData] = useState({
    languageCode: 1,
    itemName: "",
    itemDesc: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const selectedItem = itemLangDetails?.find(
      (item) => item.languageCode === formData.languageCode
    );

    setFormData((prev) => ({
      ...prev,
      itemName: selectedItem?.itemName || "",
      itemDesc: selectedItem?.itemDesc || "",
    }));
  }, [formData.languageCode, itemLangDetails]);

  const handleLanguageChange = useCallback((e) => {
    setFormData((prev) => ({
      ...prev,
      languageCode: parseInt(e.target.value),
    }));
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        const response = await apiService.post(
          "/admin/ItemDetails/addItemDetails",
          {
            itemCode: itemId,
            languageCode: formData.languageCode,
            itemName: formData.itemName,
            itemDesc: formData.itemDesc,
          },
          token
        );

        // ✅ Fixed: Call onUpdate only after successful response
        if (response.success) {
          onUpdate();
        } 
      } catch (error) {
        console.error("Error updating item details:", error);
      } finally {
        setLoading(false);
      }
    },
    [formData, itemId, token, onUpdate]
  );

  return (
    <div className={styles.detailsSection}>
      <h3>Base Information</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <select
          value={formData.languageCode}
          onChange={handleLanguageChange}
          className={styles.select}
        >
          <option>Choose Language</option>
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>

        <div className={styles.inputGroup}>
          <label>Title</label>
          <input
            type="text"
            value={formData.itemName}
            onChange={(e) => handleInputChange("itemName", e.target.value)}
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup}>
          <label>Description</label>
          <textarea
            value={formData.itemDesc}
            onChange={(e) => handleInputChange("itemDesc", e.target.value)}
            className={styles.textarea}
            rows={4}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>
    </div>
  );
};
export default React.memo(ItemDetails);