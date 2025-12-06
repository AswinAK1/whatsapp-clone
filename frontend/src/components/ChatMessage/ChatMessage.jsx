import React, { useContext, useEffect, useState, useRef } from 'react'
import { contextContainer } from '../../context/ContextProvider'
import axios from 'axios'
import { ChevronUp } from 'lucide-react';
import { toast } from 'react-toastify';

const ChatMessage = ({ searchQuery, isSelectionMode, setIsSelectionMode, selectedMessages, onSelectMessage }) => {

  const {url, selectedIndex, user, setStaredMessage, staredMessage, fetchStaredMessages, chatMessages, setChatMessages} = useContext(contextContainer)
  const [activeDropdown, setActiveDropdown] = useState(null);

  // console.log("Stared message data:",staredMessage);
  useEffect(() => {
    if (selectedIndex?._id && !selectedIndex.isStarred) {
      messages()
    }
  }, [selectedIndex])

  // delete the message
  const deleteMessage = async (messageId) => {
    console.log("Deleting message with ID:", messageId);

    try {
      const token = localStorage.getItem("authToken");
  
      const response = await axios.delete(`${url}/api/messages/delete-message/${messageId}`, {
        withCredentials: true,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },

      });
  
      if (response.data.success) {
        console.log("Remove data :",response.data);
        
        // Remove deleted message from UI
        setChatMessages((prevMessages) => prevMessages.filter((msg) => msg._id !== messageId));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };


  const toggleDropdown = (index) => {
    setActiveDropdown((prev) => (prev === index ? null : index));
  };


  const messages = async() =>{
    try {
      const token = localStorage.getItem("authToken");

      const response = await axios.get( `${url}/api/messages/${selectedIndex._id}`, {
        withCredentials: true,
        headers: {
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });
  
      if (response?.data?.error) {
        setChatMessages([]);
        return;
      } else {
        // Filter messages based on whether it's an AI chat or not
        const filteredMessages = selectedIndex?.fullName === 'AI Bot'
          ? response?.data?.filter((msg) => msg.isAiMessage || msg.senderId === user._id)
          : response?.data?.filter((msg) => !msg.isAiMessage);

        setChatMessages(filteredMessages);
        console.log("filtersd messages:",filteredMessages);
        
        fetchStaredMessages()
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setChatMessages([]);
    }
  };

  const addStaredMessage = async(messageId) =>{
    try {
      const token = localStorage.getItem("authToken");
      const response = await axios.post(`${url}/api/users/stared-message/${messageId}`,{},
      {
        withCredentials:true,
        headers:{
          Authorization: token ? `Bearer ${token}` : undefined,
        }
      }
    )

    if(response.data.success){
      console.log("stared message response",response);
      
      setStaredMessage((prev) => new Set([...prev,messageId]))
      toast.success("Stared message successfully..")

    }
    } catch (error) {
      console.error("Error starring message:", error);
    }
  }

  const unStaredMessage = async(messageId) =>{
    try {
      const token = localStorage.getItem("authToken")
      const response = await axios.post(`${url}/api/users/remove-stared-message/${messageId}`,{},
        {
          withCredentials:true,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          }
        }
      )

      if(response.data.success){
        setStaredMessage((prev) => {
          const updated = new Set(prev);
          updated.delete(messageId)
          toast.success("Unstared message successfully..")
          return updated;
        })
      }
    } catch (error) {
      console.error("Error unstarring message:", error);
    }
  }

  // while the popup will be closed clicking outside of it
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setActiveDropdown(null);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const filteredMessages = chatMessages.filter(msg =>
    msg.messages.toLowerCase().includes(searchQuery.toLowerCase())
  );


  return (
    <div className='w-full flex-1 overflow-y-auto p-4'>
      {filteredMessages.length > 0 ? (
        filteredMessages.map((msg, index) => {
          const isSelected = selectedMessages.includes(msg._id);
          return (
          <div 
            key={msg._id || index} 
            className={`mb-2 flex ${msg.senderId === user._id ? 'justify-end' : 'justify-start'} ${isSelectionMode ? 'cursor-pointer' : ''}`}
            onClick={() => isSelectionMode && onSelectMessage(msg._id)}
          >
            <div className="dropdown dropdown-top">
              <div className={`flex items-center ${msg.senderId === user._id ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-end gap-2 p-1 rounded-lg ${msg.senderId === user._id ? 'flex-row-reverse' : 'flex-row'} ${isSelected ? 'bg-blue-800 bg-opacity-50' : ''}`}>
                  {isSelectionMode && (
                    <input type="checkbox" checked={isSelected} readOnly className="checkbox checkbox-sm" />
                  )}
                  
                  {/* Profile Image */}
                  <img
                    src={
                      msg.senderId === user._id
                        ? user?.profilePic?.includes('http')
                          ? user.profilePic
                          : `${url}/${user?.profilePic}`
                        : selectedIndex?.profilePic?.includes('http')
                        ? selectedIndex.profilePic
                        : `${url}/${selectedIndex?.profilePic}`
                    }
                    alt="Profile"
                    className="w-6 h-6 rounded-full cursor-pointer"
                  />
          
                  {/* Message Bubble */}
                  <div
                    className={`px-3 py-2 rounded-lg max-w-80 text-sm ${
                      msg.senderId === user._id
                        ? 'bg-[#005c4b] text-white rounded-br-none'
                        : 'bg-[#353535] text-white rounded-bl-none'
                    }`}
                  >
                    {msg.messages}
                  </div>
                </div>
                  
                {/* Chevron dropdown */}
                <button onClick={(e) => { e.stopPropagation(); toggleDropdown(index); }}>
                  <ChevronUp
                    size={24}
                    className="ml-2 opacity-0 hover:opacity-100 text-gray-500 mt-1 mr-2"
                  />
                </button>
                  
                {activeDropdown === index && (
                  <ul
                    ref={dropdownRef}
                    tabIndex={0}
                    className="mb-2 menu bg-base-100 rounded-box z-50 w-36 p-2 shadow-sm"
                  >
                    {staredMessage.has(msg._id) ? (
                      <li onClick={() => unStaredMessage(msg._id)}>
                        <a>Unstar</a>
                      </li>
                    ) : (
                      <li onClick={() => addStaredMessage(msg._id)}>
                        <a>Star</a>
                      </li>
                    )}
                    <li onClick={() => deleteMessage(msg._id)}>
                      <a>Delete</a>
                    </li>
                    <li onClick={() => {
                      setIsSelectionMode(true);
                      onSelectMessage(msg._id);
                      setActiveDropdown(null);
                    }}>
                      <a>Select</a>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>)
        })
      ) : (
        <p className="text-gray-500 font-bold text-2xl flex justify-center">
          {searchQuery ? 'No matching messages' : 'No messages yet'}
        </p>
      )}
    </div>
  );
}

export default ChatMessage