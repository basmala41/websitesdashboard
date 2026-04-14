  import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Grid,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Typography,
  Tabs,
  Tab,
  Button,
  Alert,
  LinearProgress,
  Snackbar,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Send,
  AttachFile,
  Person,
  Archive,
  Message,
  Refresh,
} from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import useSWR, { mutate } from "swr";

// Firebase imports
import { db, storage } from "../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  getDocs,
  where,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Store import
import useAuthStore from "../../store/authStore";
import { ENV_CONFIG } from "../../constants/config";
// API fetcher function
// Updated fetcher function
const fetcher = async (url, token) => {

  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });



    const responseText = await response.text();

    // Check if response is HTML
    if (responseText.trim().toLowerCase().startsWith('<!doctype html>') || 
        responseText.trim().toLowerCase().startsWith('<html')) {
      throw new Error("Server error: Received HTML instead of expected data");
    }

    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(responseText);
      if (!response.ok) {
        
        throw new Error(`HTTP error! status: ${response.status} - ${jsonResponse?.message || response.statusText}`);
      }
      return jsonResponse;
    } catch (jsonError) {
      // If parsing as JSON fails, handle as text/HTML
      if (!response.ok) {
        
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}. Response: ${responseText.substring(0, 100)}...`
        );
      }
      // If response is OK but not JSON, return as text
      return responseText;
    }
  } catch (error) {
    console.error("🚨 Fetch error:", error);
    throw error;
  }
};

// POST request helper
const postData = async (url, data, token) => {

  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();

    try {
      const jsonResponse = JSON.parse(responseText);
      if (!response.ok) {
       
        throw new Error(`HTTP error! status: ${response.status} - ${jsonResponse?.message || response.statusText}`);
      }
      return jsonResponse;
    } catch (jsonError) {
      if (!response.ok) {
        
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}. Response: ${responseText.substring(0, 100)}...`
        );
      }
      return responseText;
    }
  } catch (error) {
    console.error("🚨 POST error:", error);
    throw error;
  }
};

const Chat = () => {
  // Zustand store
  const { user } = useAuthStore();
useEffect(() => {
   
  }, [user]);
  // State management
   const [activeTab, setActiveTab] = useState(0);
  const [messages, setMessages] = useState([]);
  const [messageUser, setMessageUser] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [receiverUser, setReceiverUser] = useState();
  const [archivedId, setArchivedId] = useState();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });


 const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Memoized values
  const currentUser = user?.firebaseToken || user?.uid;
  const authToken = user?.token;

  const imageUrlPrefix = "https://firebasestorage.googleapis.com";
  // Debug computed values
  useEffect(() => {
   
  }, [currentUser, authToken]);
  // SWR hooks for data fetching
 const {
    data: archivedChatsData,
    error: archivedChatsError,
    mutate: mutateArchivedChats,
    isLoading: isLoadingArchivedChats
  } = useSWR(
    activeTab === 1 && authToken
      ? [`https://beneshtyapi.geniussystemapi.com/api/ChatArchive/getChatArchives`, authToken]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );
 const {
    data: archivedUserData,
    error: archivedUserError,
    mutate: mutateArchivedUser,
    isLoading: isLoadingArchivedUser
  } = useSWR(
    archivedId && authToken
      ? [`https://beneshtyapi.geniussystemapi.com/api/ChatArchive/getChat?id=${archivedId}`, authToken]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  // Extract data from SWR responses
  const archivedChats = archivedChatsData?.data || [];
  const archivedUser = archivedUserData?.data || [];



useEffect(() => {
    
  }, [archivedChats, archivedUser, archivedChatsData, archivedUserData]);
  // Utility functions
  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

 const formatTimestamp = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp.seconds * 1000);
      const now = new Date();
      const options = { hour: "2-digit", minute: "2-digit" };
      const timeString = date.toLocaleTimeString([], options);
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return timeString;
      if (diffInDays === 1) return `Yesterday ${timeString}`;
      return `${date.toLocaleDateString()} ${timeString}`;
    } catch (error) {
      return "Invalid time";
    }
  }, []);

 const formatArchivedTime = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp);
      const options = { hour: "numeric", minute: "numeric", hour12: true };
      return date.toLocaleString("en-US", options);
    } catch (error) {
      return "Invalid time";
    }
  }, []);

  const formatMessage = useCallback((message) => {
    if (typeof message === "string" && message.startsWith?.(imageUrlPrefix)) {
      return (
        <Box
          component="img"
          src={message}
          alt="Shared image"
          sx={{
            maxWidth: "200px",
            maxHeight: "200px",
            borderRadius: 1,
            cursor: "pointer",
          }}
          onClick={() => window.open(message, "_blank")}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    }
    return <Typography variant="body2">{message || "No message content"}</Typography>;
  }, [imageUrlPrefix]);

  const convertTimestampToISOString = useCallback((timestamp) => {
    try {
      const date = new Date(
        timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000)
      );
      return date.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }, []);


  // Filtered messages based on search
 const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter((customer) => {
      const customerKey = Object.keys(customer)[0];
      return customerKey.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [messages, searchQuery]);


 const filteredArchivedChats = useMemo(() => {
    if (!searchQuery) return archivedChats;
    return archivedChats.filter((chat) =>
      chat.customerData?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [archivedChats, searchQuery]);

  // Firebase listeners and data fetching
 useEffect(() => {
    if (!currentUser) {
      console.log("⚠️ No current user, skipping Firebase listener");
      return;
    }


    const q = query(collection(db, "messages"), orderBy("date"));
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        try {
          
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));


          const filteredMessages = messagesData.filter(
            (msg) => msg.agentId === currentUser || msg.agentId === ""
          );


          const groupedMessages = filteredMessages.reduce((acc, message) => {
            const { customerPhone, customerName } = message;
            const conversationKey = `${customerPhone}_${customerName}`;

            if (!acc[conversationKey]) {
              acc[conversationKey] = [];
            }
            acc[conversationKey].push(message);
            return acc;
          }, {});


          const messagesArray = Object.entries(groupedMessages).map(
            ([key, messages]) => ({
              [key]: messages,
            })
          );

          // Sort by latest message
          messagesArray.sort((a, b) => {
            const aMessages = Object.values(a)[0];
            const bMessages = Object.values(b)[0];
            const aLatest = aMessages[aMessages.length - 1]?.date?.seconds || 0;
            const bLatest = bMessages[bMessages.length - 1]?.date?.seconds || 0;
            return bLatest - aLatest;
          });

          setMessages(messagesArray);
        } catch (error) {
          showSnackbar("Error loading messages", "error");
        }
      },
      (error) => {
        showSnackbar("Error connecting to Firebase", "error");
      }
    );

    return unsubscribe;
  }, [currentUser, showSnackbar]);



  // Update selected conversation messages
useEffect(() => {
    if (selectedUser && messages.length > 0) {
      const selectedMessages = messages.find(
        (customer) => Object.keys(customer)[0] === selectedUser
      );
      if (selectedMessages) {
        const conversationMessages = selectedMessages[selectedUser];
        setMessageUser(conversationMessages);
      }
    } else if (messages.length === 0) {
      setMessageUser([]);
    }
  }, [messages, selectedUser]);



  // Scroll to bottom when messages change
 useEffect(() => {
    scrollToBottom();
  }, [messageUser, archivedUser, scrollToBottom]);


  // Handle SWR errors
useEffect(() => {
    if (archivedChatsError) {
      showSnackbar(
        `Error loading archived chats: ${archivedChatsError.message}`,
        "error"
      );
    }
  }, [archivedChatsError, showSnackbar]);

  useEffect(() => {
    if (archivedUserError) {
      showSnackbar(
        `Error loading archived chat: ${archivedUserError.message}`,
        "error"
      );
    }
  }, [archivedUserError, showSnackbar]);

  // API connectivity test
 useEffect(() => {
    const testAPI = async () => {
      if (!authToken) {
        console.log("⚠️ No auth token, skipping API test");
        return;
      }

      try {
        const testResponse = await fetch(`${ENV_CONFIG.BASE_URL}/health`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        
        if (!testResponse.ok) {
          showSnackbar("API connection issue detected", "warning");
        } 
      } catch (error) {
        showSnackbar("Cannot connect to API server", "error");
      }
    };

    testAPI();
  }, [authToken, showSnackbar]);

  // Event handlers
   const handleUserClick = useCallback((customerKey, messages) => {
    setSelectedUser(customerKey);
    setMessageUser(messages);
    setCustomerPhone(messages[0]?.customerPhone || "");
    setCustomerName(messages[0]?.customerName || "");
    setReceiverUser(messages[0]?.customerId || "");
  }, []);

  const handleArchivedUserClick = useCallback((message) => {
    setSelectedUser(message.customerData);
    setArchivedId(message.id);
  }, []);

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    setSelectedUser(null);
    setMessageUser([]);
    setArchivedId(null);
    setSearchQuery("");
  }, []);

 const deleteDocumentsByCustomerId = useCallback(async (customerId) => {
    try {
      const q = query(
        collection(db, "messages"),
        where("customerId", "==", customerId)
      );
      const querySnapshot = await getDocs(q);

      const deletionPromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletionPromises);

      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const handleArchiveClick = useCallback(
    async (messages) => {
      try {
        
        const processedMessages = messages.map((item) => ({
          ...item,
          date: convertTimestampToISOString(item.date),
        }));
console.log(processedMessages);
        const response = await postData(
          `${ENV_CONFIG.BASE_URL}/ChatArchive`,
          processedMessages,
          authToken
        );

        if (response.data) {
          await deleteDocumentsByCustomerId(receiverUser);
          showSnackbar("Chat archived successfully", "success");
          setMessageUser([]);
          setSelectedUser(null);
          mutateArchivedChats();
        }
      } catch (error) {
        showSnackbar(`Error archiving chat: ${error.message}`, "error");
      }
    },
    [
      authToken,
      convertTimestampToISOString,
      deleteDocumentsByCustomerId,
      receiverUser,
      showSnackbar,
      mutateArchivedChats,
    ]
  );

  const handleFileSelect = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (file) {
        
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          showSnackbar("File size must be less than 5MB", "error");
          return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          showSnackbar("Please select an image file", "error");
          return;
        }

        setImageUpload(file);
      }
    },
    [showSnackbar]
  );


 const uploadImage = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setIsUploading(true);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setIsUploading(false);
          setUploadProgress(0);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setIsUploading(false);
            setUploadProgress(0);
            resolve(downloadURL);
          } catch (error) {
            setIsUploading(false);
            setUploadProgress(0);
            reject(error);
          }
        }
      );
    });
  }, []);


  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();

      if (!newMessage.trim() && !imageUpload) {
        return;
      }
      
      if (!receiverUser || !currentUser) {
        showSnackbar("Please select a conversation", "error");
        return;
      }

      try {
        let messageContent = newMessage;

        if (imageUpload) {
          messageContent = await uploadImage(imageUpload);
        }

        const newMessageData = {
          message: messageContent,
          customerId: receiverUser,
          agentId: currentUser,
          date: new Date(),
          flag: 2,
          adminId: "",
          customerName,
          customerPhone,
        };


        const messagesRef = collection(db, "messages");

        // Update existing messages with empty agentId
        const querySnapshot = await getDocs(
          query(messagesRef, where("agentId", "==", ""))
        );

        if (!querySnapshot.empty) {
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { agentId: currentUser });
          });
          await batch.commit();
        }

        // Add new message
        await addDoc(messagesRef, newMessageData);

        // Reset form
        setNewMessage("");
        setImageUpload(null);

        showSnackbar("Message sent successfully", "success");
      } catch (error) {
        showSnackbar(`Error sending message: ${error.message}`, "error");
      }
    },
    [
      newMessage,
      imageUpload,
      receiverUser,
      currentUser,
      customerName,
      customerPhone,
      uploadImage,
      showSnackbar,
    ]
  );

  const handleRefreshArchivedChats = useCallback(() => {
    mutateArchivedChats();
  }, [mutateArchivedChats]);

  // Render chat list item
  const renderChatListItem = useCallback(
    (customer, index, isArchived = false) => {
      const customerKey = isArchived
        ? customer.customerData
        : Object.keys(customer)[0];
      const messages = isArchived ? [] : customer[customerKey];
      const lastMessage = isArchived
        ? customer.lastMessage
        : messages.length > 0
        ? messages[messages.length - 1].message
        : "No messages";

      const isSelected =
        selectedUser === (isArchived ? customer.id : customerKey);

      const renderLastMessage = () => {
        if (typeof lastMessage === "string") {
          if (lastMessage.startsWith(imageUrlPrefix)) {
            return (
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <Typography variant="caption" color="text.secondary">
                  📷 Image
                </Typography>
              </Box>
            );
          }
          return (
            <Typography variant="caption" color="text.secondary" noWrap>
              {lastMessage.length > 30
                ? `${lastMessage.substring(0, 30)}...`
                : lastMessage}
            </Typography>
          );
        }
        return <Chip label="Image" size="small" variant="outlined" />;
      };

      return (
        <ListItem
          key={isArchived ? customer.id : index}
          button
          selected={isSelected}
          onClick={() =>
            isArchived
              ? handleArchivedUserClick(customer)
              : handleUserClick(customerKey, messages)
          }
          sx={{
            mb: 1,
            borderRadius: 2,
            border: isSelected ? 2 : 1,
            borderColor: isSelected ? "primary.main" : "divider",
            bgcolor: isSelected ? "action.selected" : "background.paper",
            "&:hover": {
              bgcolor: "action.hover",
            },
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: isArchived ? "grey.500" : "primary.main" }}>
              <Person />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="subtitle2" noWrap>
                {customerKey}
              </Typography>
            }
            secondary={
              <Box
                component="div"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                {renderLastMessage()}
                {isArchived && (
                  <Archive sx={{ fontSize: 14, color: "text.secondary" }} />
                )}
              </Box>
            }
          />
        </ListItem>
      );
    },
    [selectedUser, handleArchivedUserClick, handleUserClick, imageUrlPrefix]
  );

  // Render message bubble
  const renderMessage = useCallback(
    (msg, index) => {
      const isAgent = msg.flag === 2;
      const timestamp =
        activeTab === 0
          ? formatTimestamp(msg.date)
          : formatArchivedTime(msg.date);

      return (
        <Box
          key={msg.id || index}
          sx={{
            display: "flex",
            justifyContent: isAgent ? "flex-end" : "flex-start",
            mb: 2,
            alignItems: "flex-end",
          }}
        >
          {!isAgent && (
            <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>
              <Person />
            </Avatar>
          )}

          <Paper
            elevation={1}
            sx={{
              p: 2,
              maxWidth: "70%",
              bgcolor: isAgent ? "primary.main" : "background.paper",
              color: isAgent ? "primary.contrastText" : "text.primary",
              borderRadius: 2,
              borderBottomRightRadius: isAgent ? 0 : 2,
              borderBottomLeftRadius: isAgent ? 2 : 0,
            }}
          >
            {formatMessage(msg.message)}
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                opacity: 0.7,
                textAlign: isAgent ? "right" : "left",
              }}
            >
              {timestamp}
            </Typography>
          </Paper>

          {isAgent && (
            <Avatar sx={{ ml: 1, bgcolor: "secondary.main" }}>
              <Person />
            </Avatar>
          )}
        </Box>
      );
    },
    [activeTab, formatTimestamp, formatArchivedTime, formatMessage]
  );

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please log in to access the chat.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column",width:'100%' ,fontFamily:'Alexandria, sans-serif '}}>
      <div style={{ display: "flex", flexGrow: 1, height: "100%" }}>
        <div style={{ width: "300px", display: "flex", flexDirection: "column", borderRight: "1px solid #ddd" }}>
          <Paper
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab label="Recent" icon={<Message />} iconPosition="start" />
                <Tab label="Archived" icon={<Archive />} iconPosition="start" />
              </Tabs>
            </Box>

            {activeTab === 1 && (
              <Box sx={{ p: 1, borderBottom: 1, borderColor: "divider" }}>
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleRefreshArchivedChats}
                  variant="outlined"
                  fullWidth
                >
                  Refresh
                </Button>
              </Box>
            )}

            <Box sx={{ flexGrow: 1, overflow: "auto", p: 1 }}>
              {activeTab === 1 && !archivedChatsData && !archivedChatsError && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              <List>
                {activeTab === 0
                  ? filteredMessages.map((customer, index) =>
                      renderChatListItem(customer, index, false)
                    )
                  : filteredArchivedChats.map((customer, index) =>
                      renderChatListItem(customer, index, true)
                    )}
                {((activeTab === 0 && filteredMessages.length === 0) ||
                  (activeTab === 1 &&
                    filteredArchivedChats.length === 0 &&
                    archivedChatsData)) && (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="text.secondary">
                      {activeTab === 0
                        ? "No recent conversations"
                        : "No archived conversations"}
                    </Typography>
                  </Box>
                )}
              </List>
            </Box>
          </Paper>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {messageUser.length > 0 || archivedUser.length > 0 ? (
            <Paper
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: activeTab === 0 ? "primary.main" : "grey.500",
                    }}
                  >
                    <Person />
                  </Avatar>
                  <Typography variant="h6">{selectedUser}</Typography>
                </Box>

                {activeTab === 0 && messageUser.length > 0 && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleArchiveClick(messageUser)}
                    startIcon={<Archive />}
                  >
                    Archive Chat
                  </Button>
                )}
              </Box>

              <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
                {activeTab === 1 &&
                  archivedId &&
                  !archivedUserData &&
                  !archivedUserError && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  )}

                {(activeTab === 0 ? messageUser : archivedUser).map(
                  renderMessage
                )}
                <div ref={messagesEndRef} />
              </Box>

              {activeTab === 0 && messageUser.length > 0 && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                  {isUploading && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Uploading... {Math.round(uploadProgress)}%
                      </Typography>
                    </Box>
                  )}

                  {imageUpload && (
                    <Box sx={{ mb: 2 }}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1, display: "inline-block" }}
                      >
                        <Typography variant="caption">
                          Selected: {imageUpload.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setImageUpload(null)}
                          sx={{ ml: 1 }}
                        >
                          ×
                        </IconButton>
                      </Paper>
                    </Box>
                  )}

                  <Box
                    component="form"
                    onSubmit={handleSendMessage}
                    sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isUploading}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      style={{ display: "none" }}
                    />

                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      title="Attach image"
                    >
                      <AttachFile />
                    </IconButton>

                    <IconButton
                      type="submit"
                      color="primary"
                      disabled={
                        (!newMessage.trim() && !imageUpload) || isUploading
                      }
                      title="Send message"
                    >
                      <Send />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </Paper>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.paper",
                width: '100%'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ToastContainer />
    </Box>
  );
};

export default Chat;
  /*
 import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  Box,
  Grid,
  Paper,
  TextField,
  IconButton,
  Avatar,
  Typography,
  Tabs,
  Tab,
  Button,
  Alert,
  LinearProgress,
  Snackbar,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  CircularProgress,
} from "@mui/material";
import {
  Search,
  Send,
  AttachFile,
  Person,
  Archive,
  Message,
  Refresh,
} from "@mui/icons-material";
import { toast, ToastContainer } from "react-toastify";
import useSWR, { mutate } from "swr";

// Firebase imports
import { db, storage } from "../../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  deleteDoc,
  getDocs,
  where,
  writeBatch,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

// Store import
import useAuthStore from "../../store/authStore";
import { ENV_CONFIG } from "../../constants/config";

// API fetcher function
const fetcher = async (url, token) => {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const responseText = await response.text();

    // Check if response is HTML
    if (responseText.trim().toLowerCase().startsWith('<!doctype html>') || 
        responseText.trim().toLowerCase().startsWith('<html')) {
      throw new Error("Server error: Received HTML instead of expected data");
    }

    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(responseText);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${jsonResponse?.message || response.statusText}`);
      }
      return jsonResponse;
    } catch (jsonError) {
      // If parsing as JSON fails, handle as text/HTML
      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}. Response: ${responseText.substring(0, 100)}...`
        );
      }
      // If response is OK but not JSON, return as text
      return responseText;
    }
  } catch (error) {
    console.error("🚨 Fetch error:", error);
    throw error;
  }
};

// POST request helper
const postData = async (url, data, token) => {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseText = await response.text();

    try {
      const jsonResponse = JSON.parse(responseText);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${jsonResponse?.message || response.statusText}`);
      }
      return jsonResponse;
    } catch (jsonError) {
      if (!response.ok) {
        throw new Error(
          `Server returned ${response.status}: ${response.statusText}. Response: ${responseText.substring(0, 100)}...`
        );
      }
      return responseText;
    }
  } catch (error) {
    console.error("🚨 POST error:", error);
    throw error;
  }
};

const Chat = () => {
  // Zustand store
  const { user ,appOptions} = useAuthStore();
console.log(appOptions)
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [messages, setMessages] = useState([]);
  const [messageUser, setMessageUser] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [imageUpload, setImageUpload] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [receiverUser, setReceiverUser] = useState();
  const [archivedId, setArchivedId] = useState();
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Typing indicator states
  const [typingUsers, setTypingUsers] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
console.log(isTyping,'fgfg')
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Memoized values
  const currentUser = user?.firebaseToken || user?.uid;
  const authToken = user?.token;
  const imageUrlPrefix = "https://firebasestorage.googleapis.com";

  // SWR hooks for data fetching
  const {
    data: archivedChatsData,
    error: archivedChatsError,
    mutate: mutateArchivedChats,
    isLoading: isLoadingArchivedChats
  } = useSWR(
    activeTab === 1 && authToken
      ? [`https://beneshtyapi.geniussystemapi.com/api/ChatArchive/getChatArchives`, authToken]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  const {
    data: archivedUserData,
    error: archivedUserError,
    mutate: mutateArchivedUser,
    isLoading: isLoadingArchivedUser
  } = useSWR(
    archivedId && authToken
      ? [`https://beneshtyapi.geniussystemapi.com/api/ChatArchive/getChat?id=${archivedId}`, authToken]
      : null,
    ([url, token]) => fetcher(url, token),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000
    }
  );

  // Extract data from SWR responses
  const archivedChats = archivedChatsData?.data || [];
  const archivedUser = archivedUserData?.data || [];

  // Typing indicator functions
  const updateTypingStatus = useCallback(async (conversationId, isTyping, userType = 'agent') => {
    if (!currentUser || !conversationId) return;

    try {
      const typingRef = doc(db, "typing", `${conversationId}_${currentUser}`);
      
      if (isTyping) {
        await setDoc(typingRef, {
          conversationId,
          userId: currentUser,
          userType: userType, // 'agent' or 'customer'
          timestamp: serverTimestamp(),
          isTyping: true,
        });
      } else {
        await deleteDoc(typingRef);
      }
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  }, [currentUser]);

  const handleTyping = useCallback(() => {
    if (!receiverUser || !customerPhone || !customerName) return;

    const conversationId = `${customerPhone}_${customerName}`;
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set typing to true if not already
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(conversationId, true, 'agent');
    }

    // Set timeout to stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(conversationId, false, 'agent');
    }, 2000);
  }, [receiverUser, customerPhone, customerName, isTyping, updateTypingStatus]);

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping && customerPhone && customerName) {
      setIsTyping(false);
      const conversationId = `${customerPhone}_${customerName}`;
      updateTypingStatus(conversationId, false, 'agent');
    }
  }, [isTyping, customerPhone, customerName, updateTypingStatus]);

  // Listen for typing indicators from customers
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      collection(db, "typing"),
      (snapshot) => {
        const typingData = {};
        const now = Date.now();
        
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const docTimestamp = data.timestamp?.toDate?.()?.getTime() || 0;
          
          // Only consider recent typing indicators (within last 5 seconds)
          // and only from customers (not agents)
          if (data.isTyping && 
              data.userType === 'customer' && 
              data.userId !== currentUser && 
              (now - docTimestamp) < 5000) {
            
            const conversationId = data.conversationId;
            if (!typingData[conversationId]) {
              typingData[conversationId] = [];
            }
            typingData[conversationId].push({
              userId: data.userId,
              userType: data.userType,
              timestamp: docTimestamp
            });
          }
        });
        
        setTypingUsers(typingData);
      },
      (error) => {
        console.error("Error listening to typing indicators:", error);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  // Clean up old typing indicators
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const updated = {};
        Object.entries(prev).forEach(([conversationId, users]) => {
          const activeUsers = users.filter(user => (now - user.timestamp) < 5000);
          if (activeUsers.length > 0) {
            updated[conversationId] = activeUsers;
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Clean up typing status on unmount or conversation change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      stopTyping();
    };
  }, [stopTyping]);

  // Utility functions
  const showSnackbar = useCallback((message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const formatTimestamp = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp.seconds * 1000);
      const now = new Date();
      const options = { hour: "2-digit", minute: "2-digit" };
      const timeString = date.toLocaleTimeString([], options);
      const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) return timeString;
      if (diffInDays === 1) return `Yesterday ${timeString}`;
      return `${date.toLocaleDateString()} ${timeString}`;
    } catch (error) {
      return "Invalid time";
    }
  }, []);

  const formatArchivedTime = useCallback((timestamp) => {
    try {
      const date = new Date(timestamp);
      const options = { hour: "numeric", minute: "numeric", hour12: true };
      return date.toLocaleString("en-US", options);
    } catch (error) {
      return "Invalid time";
    }
  }, []);

  const formatMessage = useCallback((message) => {
    if (typeof message === "string" && message.startsWith?.(imageUrlPrefix)) {
      return (
        <Box
          component="img"
          src={message}
          alt="Shared image"
          sx={{
            maxWidth: "200px",
            maxHeight: "200px",
            borderRadius: 1,
            cursor: "pointer",
          }}
          onClick={() => window.open(message, "_blank")}
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      );
    }
    return <Typography variant="body2">{message || "No message content"}</Typography>;
  }, [imageUrlPrefix]);

  const convertTimestampToISOString = useCallback((timestamp) => {
    try {
      const date = new Date(
        timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000)
      );
      return date.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }, []);

  // Filtered messages based on search
  const filteredMessages = useMemo(() => {
    if (!searchQuery) return messages;
    return messages.filter((customer) => {
      const customerKey = Object.keys(customer)[0];
      return customerKey.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [messages, searchQuery]);

  const filteredArchivedChats = useMemo(() => {
    if (!searchQuery) return archivedChats;
    return archivedChats.filter((chat) =>
      chat.customerData?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [archivedChats, searchQuery]);

  // Firebase listeners and data fetching
  useEffect(() => {
    if (!currentUser) {
      console.log("⚠️ No current user, skipping Firebase listener");
      return;
    }

    const q = query(collection(db, "messages"), orderBy("date"));
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        try {
          const messagesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          const filteredMessages = messagesData.filter(
            (msg) => msg.agentId === currentUser || msg.agentId === ""
          );

          const groupedMessages = filteredMessages.reduce((acc, message) => {
            const { customerPhone, customerName } = message;
            const conversationKey = `${customerPhone}_${customerName}`;

            if (!acc[conversationKey]) {
              acc[conversationKey] = [];
            }
            acc[conversationKey].push(message);
            return acc;
          }, {});

          const messagesArray = Object.entries(groupedMessages).map(
            ([key, messages]) => ({
              [key]: messages,
            })
          );

          // Sort by latest message
          messagesArray.sort((a, b) => {
            const aMessages = Object.values(a)[0];
            const bMessages = Object.values(b)[0];
            const aLatest = aMessages[aMessages.length - 1]?.date?.seconds || 0;
            const bLatest = bMessages[bMessages.length - 1]?.date?.seconds || 0;
            return bLatest - aLatest;
          });

          setMessages(messagesArray);
        } catch (error) {
          showSnackbar("Error loading messages", "error");
        }
      },
      (error) => {
        showSnackbar("Error connecting to Firebase", "error");
      }
    );

    return unsubscribe;
  }, [currentUser, showSnackbar]);

  // Update selected conversation messages
  useEffect(() => {
    if (selectedUser && messages.length > 0) {
      const selectedMessages = messages.find(
        (customer) => Object.keys(customer)[0] === selectedUser
      );
      if (selectedMessages) {
        const conversationMessages = selectedMessages[selectedUser];
        setMessageUser(conversationMessages);
      }
    } else if (messages.length === 0) {
      setMessageUser([]);
    }
  }, [messages, selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messageUser, archivedUser, scrollToBottom]);

  // Handle SWR errors
  useEffect(() => {
    if (archivedChatsError) {
      showSnackbar(
        `Error loading archived chats: ${archivedChatsError.message}`,
        "error"
      );
    }
  }, [archivedChatsError, showSnackbar]);

  useEffect(() => {
    if (archivedUserError) {
      showSnackbar(
        `Error loading archived chat: ${archivedUserError.message}`,
        "error"
      );
    }
  }, [archivedUserError, showSnackbar]);

  // API connectivity test
  useEffect(() => {
    const testAPI = async () => {
      if (!authToken) {
        console.log("⚠️ No auth token, skipping API test");
        return;
      }

      try {
        const testResponse = await fetch(`${ENV_CONFIG.baseURL}/health`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        if (!testResponse.ok) {
          showSnackbar("API connection issue detected", "warning");
        } 
      } catch (error) {
        showSnackbar("Cannot connect to API server", "error");
      }
    };

    testAPI();
  }, [authToken, showSnackbar]);

  // Event handlers
  const handleUserClick = useCallback((customerKey, messages) => {
    // Stop typing for previous conversation
    stopTyping();
    
    setSelectedUser(customerKey);
    setMessageUser(messages);
    setCustomerPhone(messages[0]?.customerPhone || "");
    setCustomerName(messages[0]?.customerName || "");
    setReceiverUser(messages[0]?.customerId || "");
  }, [stopTyping]);

  const handleArchivedUserClick = useCallback((message) => {
    stopTyping();
    setSelectedUser(message.customerData);
    setArchivedId(message.id);
  }, [stopTyping]);

  const handleTabChange = useCallback((event, newValue) => {
    stopTyping();
    setActiveTab(newValue);
    setSelectedUser(null);
    setMessageUser([]);
    setArchivedId(null);
    setSearchQuery("");
  }, [stopTyping]);

  const deleteDocumentsByCustomerId = useCallback(async (customerId) => {
    try {
      const q = query(
        collection(db, "messages"),
        where("customerId", "==", customerId)
      );
      const querySnapshot = await getDocs(q);

      const deletionPromises = querySnapshot.docs.map((doc) =>
        deleteDoc(doc.ref)
      );
      await Promise.all(deletionPromises);

      return true;
    } catch (error) {
      throw error;
    }
  }, []);

  const handleArchiveClick = useCallback(
    async (messages) => {
      try {
        const processedMessages = messages.map((item) => ({
          ...item,
          date: convertTimestampToISOString(item.date),
        }));

        const response = await postData(
          `${ENV_CONFIG.baseURL}/ChatArchive`,
          processedMessages,
          authToken
        );

        if (response.data) {
          await deleteDocumentsByCustomerId(receiverUser);
          showSnackbar("Chat archived successfully", "success");
          setMessageUser([]);
          setSelectedUser(null);
          mutateArchivedChats();
        }
      } catch (error) {
        showSnackbar(`Error archiving chat: ${error.message}`, "error");
      }
    },
    [
      authToken,
      convertTimestampToISOString,
      deleteDocumentsByCustomerId,
      receiverUser,
      showSnackbar,
      mutateArchivedChats,
    ]
  );

  const handleFileSelect = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (file) {
        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          showSnackbar("File size must be less than 5MB", "error");
          return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
          showSnackbar("Please select an image file", "error");
          return;
        }

        setImageUpload(file);
      }
    },
    [showSnackbar]
  );

  const uploadImage = useCallback(async (file) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `images/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setIsUploading(true);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          setIsUploading(false);
          setUploadProgress(0);
          reject(error);
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setIsUploading(false);
            setUploadProgress(0);
            resolve(downloadURL);
          } catch (error) {
            setIsUploading(false);
            setUploadProgress(0);
            reject(error);
          }
        }
      );
    });
  }, []);

  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();

      if (!newMessage.trim() && !imageUpload) {
        return;
      }
      
      if (!receiverUser || !currentUser) {
        showSnackbar("Please select a conversation", "error");
        return;
      }

      try {
        // Stop typing before sending message
        stopTyping();

        let messageContent = newMessage;

        if (imageUpload) {
          messageContent = await uploadImage(imageUpload);
        }

        const newMessageData = {
          message: messageContent,
          customerId: receiverUser,
          agentId: currentUser,
          date: new Date(),
          flag: 2,
          adminId: "",
          customerName,
          customerPhone,
        };

        const messagesRef = collection(db, "messages");

        // Update existing messages with empty agentId
        const querySnapshot = await getDocs(
          query(messagesRef, where("agentId", "==", ""))
        );

        if (!querySnapshot.empty) {
          const batch = writeBatch(db);
          querySnapshot.forEach((doc) => {
            batch.update(doc.ref, { agentId: currentUser });
          });
          await batch.commit();
        }

        // Add new message
        await addDoc(messagesRef, newMessageData);

        // Reset form
        setNewMessage("");
        setImageUpload(null);

        showSnackbar("Message sent successfully", "success");
      } catch (error) {
        showSnackbar(`Error sending message: ${error.message}`, "error");
      }
    },
    [
      newMessage,
      imageUpload,
      receiverUser,
      currentUser,
      customerName,
      customerPhone,
      uploadImage,
      showSnackbar,
      stopTyping,
    ]
  );

  const handleRefreshArchivedChats = useCallback(() => {
    mutateArchivedChats();
  }, [mutateArchivedChats]);

  // Handle input change with typing indicator
  const handleInputChange = useCallback((e) => {
    setNewMessage(e.target.value);
    handleTyping();
  }, [handleTyping]);

  // Render typing indicator
  const renderTypingIndicator = useCallback(() => {
    if (activeTab !== 0) return null;
    
    const conversationId = `${customerPhone}_${customerName}`;
    const typingInConversation = typingUsers[conversationId];
    
    if (!typingInConversation || typingInConversation.length === 0) {
      return null;
    }

    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          mb: 2,
          alignItems: "flex-end",
        }}
      >
        <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>
          <Person />
        </Avatar>
        <Paper
          elevation={1}
          sx={{
            p: 2,
            maxWidth: "70%",
            bgcolor: "background.paper",
            color: "text.primary",
            borderRadius: 2,
            borderBottomLeftRadius: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
              Customer is typing...
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    animation: "typing 1.4s infinite",
                    animationDelay: `${i * 0.2}s`,
                    "@keyframes typing": {
                      "0%, 60%, 100%": {
                        transform: "translateY(0)",
                        opacity: 0.5,
                      },
                      "30%": {
                        transform: "translateY(-10px)",
                        opacity: 1,
                      },
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }, [activeTab, customerPhone, customerName, typingUsers]);

  // Render chat list item
  const renderChatListItem = useCallback(
    (customer, index, isArchived = false) => {
      const customerKey = isArchived
        ? customer.customerData
        : Object.keys(customer)[0];
      const messages = isArchived ? [] : customer[customerKey];
      const lastMessage = isArchived
        ? customer.lastMessage
        : messages.length > 0
        ? messages[messages.length - 1].message
        : "No messages";

      const isSelected =
        selectedUser === (isArchived ? customer.id : customerKey);

      // Check if someone is typing in this conversation
      const isTypingInConversation = !isArchived && 
        typingUsers[customerKey] && 
        typingUsers[customerKey].length > 0;

      const renderLastMessage = () => {
        if (isTypingInConversation) {
          return (
            <Box
              component="span"
              sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
            >
              <Typography variant="caption" color="primary.main" sx={{ fontStyle: "italic" }}>
                Customer is typing...
              </Typography>
            </Box>
          );
        }

        if (typeof lastMessage === "string") {
          if (lastMessage.startsWith(imageUrlPrefix)) {
            return (
              <Box
                component="span"
                sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
              >
                <Typography variant="caption" color="text.secondary">
                  📷 Image
                </Typography>
              </Box>
            );
          }
          return (
            <Typography variant="caption" color="text.secondary" noWrap>
              {lastMessage.length > 30
                ? `${lastMessage.substring(0, 30)}...`
                : lastMessage}
            </Typography>
          );
        }
        return <Chip label="Image" size="small" variant="outlined" />;
      };

      return (
        <ListItem
          key={isArchived ? customer.id : index}
          button
          selected={isSelected}
          onClick={() =>
            isArchived
              ? handleArchivedUserClick(customer)
              : handleUserClick(customerKey, messages)
          }
          sx={{
            mb: 1,
            borderRadius: 2,
            border: isSelected ? 2 : 1,
            borderColor: isSelected ? "primary.main" : "divider",
            bgcolor: isSelected ? "action.selected" : "background.paper",
            "&:hover": {
              bgcolor: "action.hover",
            },
            ...(isTypingInConversation && {
              boxShadow: '0 0 10px rgba(25, 118, 210, 0.3)',
              borderColor: "primary.main",
            })
          }}
        >
          <ListItemAvatar>
            <Avatar sx={{ 
              bgcolor: isArchived ? "grey.500" : "primary.main",
              ...(isTypingInConversation && {
                animation: "pulse 2s infinite",
                "@keyframes pulse": {
                  "0%": {
                    boxShadow: "0 0 0 0 rgba(25, 118, 210, 0.7)",
                  },
                  "70%": {
                    boxShadow: "0 0 0 10px rgba(25, 118, 210, 0)",
                  },
                  "100%": {
                    boxShadow: "0 0 0 0 rgba(25, 118, 210, 0)",
                  },
                }
              })
            }}>
              <Person />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={
              <Typography variant="subtitle2" noWrap>
                {customerKey}
              </Typography>
            }
            secondary={
              <Box
                component="div"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                {renderLastMessage()}
                {isArchived && (
                  <Archive sx={{ fontSize: 14, color: "text.secondary" }} />
                )}
              </Box>
            }
          />
        </ListItem>
      );
    },
    [selectedUser, handleArchivedUserClick, handleUserClick, imageUrlPrefix, typingUsers]
  );

  // Render message bubble
  const renderMessage = useCallback(
    (msg, index) => {
      const isAgent = msg.flag === 2;
      const timestamp =
        activeTab === 0
          ? formatTimestamp(msg.date)
          : formatArchivedTime(msg.date);

      return (
        <Box
          key={msg.id || index}
          sx={{
            display: "flex",
            justifyContent: isAgent ? "flex-end" : "flex-start",
            mb: 2,
            alignItems: "flex-end",
          }}
        >
          {!isAgent && (
            <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>
              <Person />
            </Avatar>
          )}

          <Paper
            elevation={1}
            sx={{
              p: 2,
              maxWidth: "70%",
              bgcolor: isAgent ? "primary.main" : "background.paper",
              color: isAgent ? "primary.contrastText" : "text.primary",
              borderRadius: 2,
              borderBottomRightRadius: isAgent ? 0 : 2,
              borderBottomLeftRadius: isAgent ? 2 : 0,
            }}
          >
            {formatMessage(msg.message)}
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                opacity: 0.7,
                textAlign: isAgent ? "right" : "left",
              }}
            >
              {timestamp}
            </Typography>
          </Paper>

          {isAgent && (
            <Avatar sx={{ ml: 1, bgcolor: "secondary.main" }}>
              <Person />
            </Avatar>
          )}
        </Box>
      );
    },
    [activeTab, formatTimestamp, formatArchivedTime, formatMessage]
  );

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please log in to access the chat.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", width: '100%' }}>
      <div style={{ display: "flex", flexGrow: 1, height: "100%" }}>
        <div style={{ width: "300px", display: "flex", flexDirection: "column", borderRight: "1px solid #ddd" }}>
          <Paper
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="fullWidth"
              >
                <Tab label="Recent" icon={<Message />} iconPosition="start" />
                <Tab label="Archived" icon={<Archive />} iconPosition="start" />
              </Tabs>
            </Box>

            {activeTab === 1 && (
              <Box sx={{ p: 1, borderBottom: 1, borderColor: "divider" }}>
                <Button
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleRefreshArchivedChats}
                  variant="outlined"
                  fullWidth
                >
                  Refresh
                </Button>
              </Box>
            )}

            <Box sx={{ flexGrow: 1, overflow: "auto", p: 1 }}>
              {activeTab === 1 && !archivedChatsData && !archivedChatsError && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              )}

              <List>
                {activeTab === 0
                  ? filteredMessages.map((customer, index) =>
                      renderChatListItem(customer, index, false)
                    )
                  : filteredArchivedChats.map((customer, index) =>
                      renderChatListItem(customer, index, true)
                    )}
                {((activeTab === 0 && filteredMessages.length === 0) ||
                  (activeTab === 1 &&
                    filteredArchivedChats.length === 0 &&
                    archivedChatsData)) && (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Typography color="text.secondary">
                      {activeTab === 0
                        ? "No recent conversations"
                        : "No archived conversations"}
                    </Typography>
                  </Box>
                )}
              </List>
            </Box>
          </Paper>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {messageUser.length > 0 || archivedUser.length > 0 ? (
            <Paper
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: activeTab === 0 ? "primary.main" : "grey.500",
                    }}
                  >
                    <Person />
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedUser}</Typography>
                    {activeTab === 0 && typingUsers[`${customerPhone}_${customerName}`] && 
                     typingUsers[`${customerPhone}_${customerName}`].length > 0 && (
                      <Typography variant="caption" color="primary.main" sx={{ fontStyle: "italic" }}>
                        Customer is typing...
                      </Typography>
                    )}
                  </Box>
                </Box>

                {activeTab === 0 && messageUser.length > 0 && (
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => handleArchiveClick(messageUser)}
                    startIcon={<Archive />}
                  >
                    Archive Chat
                  </Button>
                )}
              </Box>

              <Box sx={{ flexGrow: 1, overflow: "auto", p: 2 }}>
                {activeTab === 1 &&
                  archivedId &&
                  !archivedUserData &&
                  !archivedUserError && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 4 }}
                    >
                      <CircularProgress />
                    </Box>
                  )}

                {(activeTab === 0 ? messageUser : archivedUser).map(
                  renderMessage
                )}
                
                {renderTypingIndicator()}
                
                <div ref={messagesEndRef} />
              </Box>

              {activeTab === 0 && messageUser.length > 0 && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
                  {isUploading && (
                    <Box sx={{ mb: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                      />
                      <Typography variant="caption" color="text.secondary">
                        Uploading... {Math.round(uploadProgress)}%
                      </Typography>
                    </Box>
                  )}

                  {imageUpload && (
                    <Box sx={{ mb: 2 }}>
                      <Paper
                        variant="outlined"
                        sx={{ p: 1, display: "inline-block" }}
                      >
                        <Typography variant="caption">
                          Selected: {imageUpload.name}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setImageUpload(null)}
                          sx={{ ml: 1 }}
                        >
                          ×
                        </IconButton>
                      </Paper>
                    </Box>
                  )}

                  <Box
                    component="form"
                    onSubmit={handleSendMessage}
                    sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}
                  >
                    <TextField
                      fullWidth
                      multiline
                      maxRows={4}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={handleInputChange}
                      disabled={isUploading}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      style={{ display: "none" }}
                    />

                    <IconButton
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      title="Attach image"
                    >
                      <AttachFile />
                    </IconButton>

                    <IconButton
                      type="submit"
                      color="primary"
                      disabled={
                        (!newMessage.trim() && !imageUpload) || isUploading
                      }
                      title="Send message"
                    >
                      <Send />
                    </IconButton>
                  </Box>
                </Box>
              )}
            </Paper>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "background.paper",
                width: '100%'
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Select a conversation to start chatting
              </Typography>
            </Box>
          )}
        </div>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ToastContainer />
    </Box>
  );
};

export default Chat;*/