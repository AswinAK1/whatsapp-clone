import axios from 'axios'
import { createContext,useEffect, useState } from 'react'
import { io } from 'socket.io-client'      // ⬅️ add this
import { toast } from 'react-toastify'

export const contextContainer = createContext(null)

const ContextProvider = (props) =>{
  const url = "http://localhost:4000"
  // all user data in the chat section
  const [allUsers, setAllUsers] = useState([])
  const [selectedIndex, setSelectedIndex] = useState({})
  const [staredMessage, setStaredMessage] = useState(new Set())
  const [starredMessagesData, setStarredMessagesData] = useState([])
  const [chatMessages, setChatMessages] = useState([]);

  const [socket, setSocket] = useState(null);   // ⬅️ NEW
  console.log('socket state data',socket)

  const [user,setUser] = useState(()=>{
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  })

  const setUserDetails = (userData) => {
    setUser(userData);
    localStorage.setItem("user",JSON.stringify(userData));
  }

  useEffect(() => {
    if(user){
      localStorage.setItem("user",JSON.stringify(user))
    }
  }, [user])

  // ✅ INIT SOCKET WHEN USER LOGS IN
  useEffect(() => {
    if (!user?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(url, {
      query: { userId: user._id },   // server: socket.handshake.query.userId
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user?._id]);  // re-init if user changes

  // fetchStaredMessages...
  const fetchStaredMessages = async() => {
    try {
      if(!user){
        console.error("User not found")
        return;
      }
      const token = localStorage.getItem("authToken")

      const response = await axios.get(`${url}/api/users/get-stared-message/${user._id}`,{
        withCredentials: true,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
      if (response.data.success) {
        const starredIds = new Set(response.data.staredMessages);
        setStaredMessage(starredIds);
        setStarredMessagesData(response.data.staredMessages)
      } else {
        console.error("Failed to fetch starred messages:", response.data.message);
      }

    } catch (error) {
      console.error("Error fetching starred messages:", error);
    }
  }


  const contextValue = {
    url,
    user,
    setUserDetails,
    allUsers,
    setAllUsers,
    selectedIndex,
    setSelectedIndex,
    staredMessage,
    setStaredMessage,
    fetchStaredMessages,
    chatMessages,
    setChatMessages,
    socket,
  }

  return(
    <contextContainer.Provider value={contextValue}>
      {props.children}
    </contextContainer.Provider>
  )
}

export default ContextProvider
