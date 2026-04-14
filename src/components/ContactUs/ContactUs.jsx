import React, { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import useAuthStore from "../../store/authStore";
import apiService from "../../services/apiService";
import {
  Phone,
  Mail,
  Facebook,
  Instagram,
  Send,
  MessageCircle,
  Building2,
  Save,
  Loader2,
} from "lucide-react";
import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";

// ─── Fetcher ────────────────────────────────────────────────────────────────
const fetcher = async (token) => {
  try {
    return await apiService.getContactUs(token);
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

// ─── Field config (drives rendering, icons, validation) ─────────────────────
const FIELDS = [
  {
    key: "callTelNo",
    label: "Call Phone Number",
    placeholder: "e.g. 01553730627",
    icon: Phone,
    type: "tel",
    required: true,
  },
  {
    key: "whatsTelNo",
    label: "WhatsApp Number",
    placeholder: "e.g. 01061227792",
    icon: MessageCircle,
    type: "tel",
    required: true,
  },
  {
    key: "sendEmail",
    label: "Email Address",
    placeholder: "e.g. support@example.com",
    icon: Mail,
    type: "email",
    required: false,
  },
  {
    key: "socialFaceBook",
    label: "Facebook URL",
    placeholder: "https://www.facebook.com/...",
    icon: Facebook,
    type: "url",
    required: false,
  },
  {
    key: "socialInsta",
    label: "Instagram URL",
    placeholder: "https://www.instagram.com/...",
    icon: Instagram,
    type: "url",
    required: false,
  },
  {
    key: "socialTelegram",
    label: "Telegram",
    placeholder: "e.g. @username or link",
    icon: Send,
    type: "text",
    required: false,
  },
  {
    key: "companyName",
    label: "Company Name",
    placeholder: "e.g. Shein Stuff",
    icon: Building2,
    type: "text",
    required: false,
  },
];

const EMPTY_FORM = FIELDS.reduce((acc, f) => ({ ...acc, [f.key]: "" }), {});

// ─── ContactUs ───────────────────────────────────────────────────────────────
const ContactUs = () => {
  const { user } = useAuthStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const shouldFetch = !!user?.token;

  const { data, error, isLoading, mutate } = useSWR(
    shouldFetch ? `contact-us-${user.token}` : null,
    () => fetcher(user.token),
    {
      revalidateOnFocus: false,
      onSuccess: (res) => {
        if (res?.data) {
          setForm({ ...EMPTY_FORM, ...res.data });
          setIsDirty(false);
        }
      },
      onError: (err) => console.error("SWR Error:", err),
    }
  );

  // ─── Handlers ───────────────────────────────────────────────────────────
  const handleChange = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setSuccessMsg("");
    setErrorMsg("");
  }, []);

  const handleSubmit = useCallback(async () => {
    // Basic required field check
    const missing = FIELDS.filter((f) => f.required && !form[f.key]?.trim());
    if (missing.length) {
      setErrorMsg(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await apiService.manageContactUs(form, user.token);
      if (result?.success) {
        setSuccessMsg("Contact information saved successfully.");
        setIsDirty(false);
        mutate();
      } else {
        setErrorMsg(result?.message || "Failed to save. Please try again.");
      }
    } catch (err) {
      console.error("Save error:", err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [form, user.token, mutate]);

  const handleRetry = useCallback(() => mutate(), [mutate]);

  // ─── Derived ────────────────────────────────────────────────────────────
  const Alerts = useMemo(
    () => (
      <Stack sx={{ width: "100%", marginBottom: "12px" }} spacing={1}>
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
        {successMsg && <Alert severity="success">{successMsg}</Alert>}
      </Stack>
    ),
    [errorMsg, successMsg]
  );

  // ─── Early returns ───────────────────────────────────────────────────────
  if (!shouldFetch) return <div>No authentication token available</div>;

  if (error)
    return (
      <div style={{ padding: "20px" }}>
        <div>❌ Error loading contact info: {error.message}</div>
        <button onClick={handleRetry} style={{ marginTop: "8px" }}>
          Retry
        </button>
      </div>
    );

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: "24px", }}>
      <h2 style={{ marginBottom: "20px", fontFamily: "Alexandria, sans-serif" }}>
        Contact Us
      </h2>

      {Alerts}

      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "#888",
            fontFamily: "Alexandria, sans-serif",
          }}
        >
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
          Loading...
        </div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
            padding: "28px",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            {FIELDS.map(({ key, label, placeholder, icon: Icon, type }) => (
              <div key={key} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label
                  htmlFor={key}
                  style={{
                    fontFamily: "Alexandria, sans-serif",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#444",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Icon size={15} color="#666" />
                  {label}
                </label>
                <input
                  id={key}
                  type={type}
                  value={form[key]}
                  placeholder={placeholder}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{
                    fontFamily: "Alexandria, sans-serif",
                    fontSize: "14px",
                    padding: "10px 12px",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    outline: "none",
                    transition: "border-color 0.2s",
                    width: "100%",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#1976d2")}
                  onBlur={(e) => (e.target.style.borderColor = "#ddd")}
                />
              </div>
            ))}
          </div>

          {/* Submit */}
          <div style={{ marginTop: "28px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !isDirty}
              style={{
                fontFamily: "Alexandria, sans-serif",
                fontSize: "15px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 24px",
                background: isSaving || !isDirty ? "#ccc" : "#1976d2",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: isSaving || !isDirty ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default React.memo(ContactUs);