/* import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Pencil } from "lucide-react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddImage from "./AddImage";
import TextField from "@mui/material/TextField";
import useAuthStore from "../store/authStore";
import MenuItem from "@mui/material/MenuItem";
import styles from "../styles/model.module.css";
import JoditEdit from "./JoditEdit";

const Model = ({
  initialFormState = {},
  initialData,
  modalTitle,
  onEdit,
  includeImg = false,
  includeColor = false,
  isEdit = false,
  modalWidth = 500,
  haveJoditEdit = false
}) => {
  const { LangData, defaultLang } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [selectedLang, setSelectedLang] = useState();
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize modal style to prevent recreation on every render
  const modalStyle = useMemo(() => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: modalWidth,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 2,
    maxHeight: "90vh",
    overflowY: "auto",
  }), [modalWidth]);

  // Memoize form fields to prevent recreation on every render
  const formFields = useMemo(() => 
    Object.keys(initialFormState).filter(key => key !== 'colorHex'),
    [initialFormState]
  );

  // Helper function to get language-specific data
  const getLanguageSpecificData = useCallback((data, lang) => {
    if (!data) return {};
    
    if (data.branchDetails) {
      const langData = data.branchDetails.find(
        detail => detail.languageCode == lang
      );
      return {
        branchName: langData?.name || data?.branchName || "",
        branchAddress: langData?.adress || data?.branchAddress || "",
        ...Object.keys(initialFormState).reduce((acc, key) => {
          if (key !== 'branchName' && key !== 'branchAddress') {
            acc[key] = data[key] || initialFormState[key] || "";
          }
          return acc;
        }, {})
      };
    } else {
      return Object.keys(initialFormState).reduce((acc, key) => {
        if (key === 'name') {
          acc[key] = lang === 1 ? 
            (data.name || initialFormState[key] || "") : 
            (data.nameE || initialFormState[key] || "");
        } else if (key === 'color' || key === 'colorHex') {
          const colorValue = data.colorHex || data.color || initialFormState[key] || "#000000";
          acc[key] = colorValue.startsWith("#") ? colorValue : `#${colorValue}`;
        } else {
          acc[key] = data[key] || initialFormState[key] || "";
        }
        return acc;
      }, {});
    }
  }, [initialFormState]);

  // Initialize form data when modal opens or language changes
  useEffect(() => {
    if (open) {
              setSelectedLang(initialData.languageCode || defaultLang)

      if (isEdit && initialData) {
        const langSpecificData = getLanguageSpecificData(initialData, selectedLang);
        setFormData(langSpecificData);
        // Set image preview
        if (initialData?.picLink) {
          setPreviewUrl(initialData.picLink);
          setImageFile(null);
        } else {
          setPreviewUrl(null);
          setImageFile(null);
        }
        
        // Set editor content
        if (initialData.privacyText) {
          setEditorContent(initialData.privacyText);
        } else {
          setEditorContent('');
        }
      } else {
        // Initialize with default values for new items
        const initData = Object.keys(initialFormState).reduce((acc, key) => {
          if (key === 'colorHex' || key === 'color') {
            acc[key] = initialFormState[key] || "#000000";
          } else {
            acc[key] = initialFormState[key] || "";
          }
          return acc;
        }, {});
        setFormData(initData);
        setPreviewUrl(null);
        setImageFile(null);
        setEditorContent('');
      }

    }
  }, [open, initialFormState, isEdit, initialData, selectedLang, getLanguageSpecificData]);

  // Reset selectedLang when modal opens
  useEffect(() => {
    if (open) {
      setSelectedLang(defaultLang);
    }
  }, [open, defaultLang]);

  // Memoized handlers to prevent recreation on every render
  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setImageFile(null);
    setPreviewUrl(null);
    setFormData({});
    setSelectedLang(defaultLang);
    setEditorContent('');
    setIsSubmitting(false);
  }, [defaultLang]);

  const handleImageChange = useCallback((file, preview) => {
    setImageFile(file);
    setPreviewUrl(preview);
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleLanguageChange = useCallback((newLang) => {
    setSelectedLang(newLang);
  }, []);

  const validateForm = useCallback(() => {
    for (const key of Object.keys(initialFormState)) {
      if (key === 'colorHex' || key === 'color') continue; // Color fields might be optional
      if (!formData[key]?.toString().trim()) {
        alert(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    if (includeImg && !isEdit && !imageFile) {
      alert("Image is required");
      return false;
    }

    return true;
  }, [formData, initialFormState, includeImg, isEdit, imageFile]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        language: selectedLang,
      };

      // Add image if provided
      if (imageFile) {
        submitData.image = imageFile;
      }

      // Add editor content if using JoditEdit
      if (haveJoditEdit) {
        submitData.privacyText = editorContent;
      }

      const resetForm = () => {
        setFormData({});
        setImageFile(null);
        setPreviewUrl(null);
        setEditorContent('');
      };

      if (onEdit) {
        await onEdit(
          isEdit ? initialData.code || initialData.branchCode || initialData.privacyCode : null,
          submitData,
          { resetForm },
          handleClose
        );
      }
      
      handleClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, selectedLang, imageFile, editorContent, haveJoditEdit, onEdit, isEdit, initialData, handleClose]);

  const formatFieldLabel = useCallback((key) => {
    return key
      .replace(/([A-Z])/g, ' $1') 
      .replace(/^./, str => str.toUpperCase()); 
  }, []);

  // Memoize color input value to prevent recalculation
  const colorInputValue = useMemo(() => {
    const colorValue = formData?.colorHex || formData?.color;
    if (typeof colorValue === "string") {
      return colorValue.startsWith("#") ? colorValue : `#${colorValue}`;
    }
    return "#000000";
  }, [formData?.colorHex, formData?.color]);

  return (
    <>
      {isEdit && (
        <div onClick={handleOpen} style={{ cursor: "pointer" }}>
          <Pencil size={20} color="#2b8fb1" />
        </div>
      )}

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <form onSubmit={handleSubmit}>
            <h4 className="text-center mb-4">
              {isEdit ? `Edit ${modalTitle}` : `Add ${modalTitle}`}
            </h4>

            <div className={styles.field__body}>
              <TextField
                value={selectedLang}
                onChange={(e) => handleLanguageChange(Number(e.target.value))}
                id="outlined-select-currency"
                select
                label="Select Language"
                className={styles.field}
                fullWidth
              >
                {LangData.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            {formFields.map((key, index) => (
              <div key={key} className={styles.field__body}>
                <TextField
                  id={`field-${index}`}
                  label={formatFieldLabel(key)}
                  variant="outlined"
                  className={styles.field}
                  value={formData[key] || ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  required
                  fullWidth
                />
              </div>
            ))}

            {includeImg && (
              <div className="mb-4">
                <label>
                  Image {!isEdit && <span className="text-danger">*</span>}
                </label>
                <AddImage
                  onImageChange={handleImageChange}
                  initialImage={isEdit ? initialData?.picLink : null}
                />
              </div>
            )}

            {includeColor && (
              <div className={styles.field__body}>
                <TextField
                  type="color"
                  className={styles.field}
                  value={colorInputValue}
                  onChange={(e) => handleInputChange("colorHex", e.target.value)}
                  label="Pick Color"
                  fullWidth
                />
              </div>
            )}

            {haveJoditEdit && (
              <JoditEdit 
                initialContent={editorContent} 
                setInitialContent={setEditorContent}
              />
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{ minWidth: "100px" }}
              >
                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default React.memo(Model); */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Pencil } from "lucide-react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddImage from "./AddImage";
import TextField from "@mui/material/TextField";
import useAuthStore from "../store/authStore";
import MenuItem from "@mui/material/MenuItem";
import styles from "../styles/model.module.css";
import JoditEdit from "./JoditEdit";

const Model = ({
  initialFormState = {},
  initialData,
  modalTitle,
  onEdit,
  includeImg = false,
  includeColor = false,
  isEdit = false,
  modalWidth = 500,
  haveJoditEdit = false
}) => {
  const { LangData, defaultLang } = useAuthStore();

  const [open, setOpen] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [editorContent, setEditorContent] = useState("");
  const [selectedLang, setSelectedLang] = useState(defaultLang);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoize modal style to prevent recreation on every render
  const modalStyle = useMemo(() => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: modalWidth,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 2,
    maxHeight: "90vh",
    overflowY: "auto",
  }), [modalWidth]);

  // Memoize form fields to prevent recreation on every render
  const formFields = useMemo(() => 
    Object.keys(initialFormState).filter(key => key !== 'colorHex'),
    [initialFormState]
  );

  // Helper function to get language-specific data
  const getLanguageSpecificData = useCallback((data, lang) => {
    if (!data) return {};
    
    if (data.branchDetails) {
      const langData = data.branchDetails.find(
        detail => detail.languageCode == lang
      );
      return {
        branchName: langData?.name || data?.branchName || "",
        branchAddress: langData?.adress || data?.branchAddress || "",
        ...Object.keys(initialFormState).reduce((acc, key) => {
          if (key !== 'branchName' && key !== 'branchAddress') {
            acc[key] = data[key] || initialFormState[key] || "";
          }
          return acc;
        }, {})
      };
    } else {
      return Object.keys(initialFormState).reduce((acc, key) => {
        if (key === 'name') {
          acc[key] = lang === 1 ? 
            (data.name || initialFormState[key] || "") : 
            (data.nameE || initialFormState[key] || "");
        } else if (key === 'color' || key === 'colorHex') {
          const colorValue = data.colorHex || data.color || initialFormState[key] || "#000000";
          acc[key] = colorValue.startsWith("#") ? colorValue : `#${colorValue}`;
        } else {
          acc[key] = data[key] || initialFormState[key] || "";
        }
        return acc;
      }, {});
    }
  }, [initialFormState]);

  // Initialize form data when modal opens
  useEffect(() => {
    if (open) {
      // Set initial language
      const initialLang = initialData?.languageCode || defaultLang;
      setSelectedLang(initialLang);

      if (isEdit && initialData) {
        const langSpecificData = getLanguageSpecificData(initialData, initialLang);
        setFormData(langSpecificData);
        
        // Set image preview
        if (initialData?.picLink) {
          setPreviewUrl(initialData.picLink);
          setImageFile(null);
        } else {
          setPreviewUrl(null);
          setImageFile(null);
        }
        
        // Set editor content
        if (initialData.privacyText) {
          setEditorContent(initialData.privacyText);
        } else {
          setEditorContent('');
        }
      } else {
        // Initialize with default values for new items
        const initData = Object.keys(initialFormState).reduce((acc, key) => {
          if (key === 'colorHex' || key === 'color') {
            acc[key] = initialFormState[key] || "#000000";
          } else {
            acc[key] = initialFormState[key] || "";
          }
          return acc;
        }, {});
        setFormData(initData);
        setPreviewUrl(null);
        setImageFile(null);
        setEditorContent('');
      }
    }
  }, [open, initialFormState, isEdit, initialData, defaultLang, getLanguageSpecificData]);

  // Handle language change and update form data accordingly
  useEffect(() => {
    if (open && isEdit && initialData && selectedLang !== undefined) {
      const langSpecificData = getLanguageSpecificData(initialData, selectedLang);
      setFormData(langSpecificData);
    }
  }, [selectedLang, open, isEdit, initialData, getLanguageSpecificData]);

  // Memoized handlers to prevent recreation on every render
  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setImageFile(null);
    setPreviewUrl(null);
    setFormData({});
    setSelectedLang(defaultLang);
    setEditorContent('');
    setIsSubmitting(false);
  }, [defaultLang]);

  const handleImageChange = useCallback((file, preview) => {
    setImageFile(file);
    setPreviewUrl(preview);
  }, []);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleLanguageChange = useCallback((newLang) => {
    setSelectedLang(newLang);
  }, []);

  const validateForm = useCallback(() => {
    for (const key of Object.keys(initialFormState)) {
      if (key === 'colorHex' || key === 'color') continue; // Color fields might be optional
      if (!formData[key]?.toString().trim()) {
        alert(`${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`);
        return false;
      }
    }

    if (includeImg && !isEdit && !imageFile) {
      alert("Image is required");
      return false;
    }

    return true;
  }, [formData, initialFormState, includeImg, isEdit, imageFile]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const submitData = {
        ...formData,
        language: selectedLang,
      };

      // Add image if provided
      if (imageFile) {
        submitData.image = imageFile;
      }

      // Add editor content if using JoditEdit
      if (haveJoditEdit) {
        submitData.privacyText = editorContent;
      }

      const resetForm = () => {
        setFormData({});
        setImageFile(null);
        setPreviewUrl(null);
        setEditorContent('');
      };

      if (onEdit) {
        await onEdit(
          isEdit ? initialData.code || initialData.branchCode || initialData.privacyCode : null,
          submitData,
          { resetForm },
          handleClose
        );
      }
      
      handleClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [validateForm, formData, selectedLang, imageFile, editorContent, haveJoditEdit, onEdit, isEdit, initialData, handleClose]);

  const formatFieldLabel = useCallback((key) => {
    return key
      .replace(/([A-Z])/g, ' $1') 
      .replace(/^./, str => str.toUpperCase()); 
  }, []);

  // Memoize color input value to prevent recalculation
  const colorInputValue = useMemo(() => {
    const colorValue = formData?.colorHex || formData?.color;
    if (typeof colorValue === "string") {
      return colorValue.startsWith("#") ? colorValue : `#${colorValue}`;
    }
    return "#000000";
  }, [formData?.colorHex, formData?.color]);

  return (
    <>
      {isEdit && (
        <div onClick={handleOpen} style={{ cursor: "pointer" }}>
          <Pencil size={20} color="#2b8fb1" />
        </div>
      )}

      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <form onSubmit={handleSubmit}>
            <h4 className="text-center mb-4">
              {isEdit ? `Edit ${modalTitle}` : `Add ${modalTitle}`}
            </h4>

            <div className={styles.field__body}>
              <TextField
                value={selectedLang}
                onChange={(e) => handleLanguageChange(Number(e.target.value))}
                id="outlined-select-currency"
                select
                label="Select Language"
                className={styles.field}
                fullWidth
              >
                {LangData.map((option) => (
                  <MenuItem key={option.code} value={option.code}>
                    {option.name}
                  </MenuItem>
                ))}
              </TextField>
            </div>

            {formFields.map((key, index) => (
              <div key={key} className={styles.field__body}>
                <TextField
                  id={`field-${index}`}
                  label={formatFieldLabel(key)}
                  variant="outlined"
                  className={styles.field}
                  value={formData[key] || ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  required
                  fullWidth
                />
              </div>
            ))}

            {includeImg && (
              <div className="mb-4">
                <label>
                  Image {!isEdit && <span className="text-danger">*</span>}
                </label>
                <AddImage
                  onImageChange={handleImageChange}
                  initialImage={isEdit ? initialData?.picLink : null}
                />
              </div>
            )}

            {includeColor && (
              <div className={styles.field__body}>
                <TextField
                  type="color"
                  className={styles.field}
                  value={colorInputValue}
                  onChange={(e) => handleInputChange("colorHex", e.target.value)}
                  label="Pick Color"
                  fullWidth
                />
              </div>
            )}

            {haveJoditEdit && (
              <JoditEdit 
                initialContent={editorContent} 
                setInitialContent={setEditorContent}
              />
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                sx={{ minWidth: "100px" }}
              >
                {isSubmitting ? "Saving..." : isEdit ? "Update" : "Save"}
              </Button>
            </div>
          </form>
        </Box>
      </Modal>
    </>
  );
};

export default React.memo(Model);