import React, { useContext, useEffect, useState,useRef } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faVideo, faPhone, faMagnifyingGlass, faFaceSmile, faPaperclip, faMicrophone, faXmark, faEllipsisV, faTrash } from "@fortawesome/free-solid-svg-icons";
import { contextContainer } from '../../context/ContextProvider';
import ChatMessage from '../ChatMessage/ChatMessage';
import axios from 'axios';
import {formatDistanceToNow, parseISO } from 'date-fns'
import EmojiPicker from 'emoji-picker-react'


const UserChat = () => {

  const {user, url, selectedIndex, chatMessages, setChatMessages} = useContext(contextContainer)
  console.log("id of the selectIndex",selectedIndex);
  const [inputMessage, setInputMessage] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [showUserChatDropdown, setShowUserChatDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // convert the selectedIndex last seen format
  const formattedLastSeen = (lastSeen) =>{
    if(!lastSeen){
      return "unavailable"
    }
    const date = parseISO(lastSeen);
    return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
  }
  
  const onChangeHandler = (event) => {
    setInputMessage(event.target.value);
  };
  
  const handleMessage = async () => {
  if (!selectedIndex?._id) {
    console.error("Selected user not found");
    return;
  }

  if (!inputMessage.trim()) return;

  const token = localStorage.getItem("authToken");

  try {
    if (selectedIndex?.fullName === 'AI Bot') {
      // AI flow (no socket, keep as is)
      const response = await axios.post(
        `${url}/api/aiChat/send`,
        { userId: user._id, message: inputMessage },
        {
          withCredentials: true,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      setInputMessage('');
      // here you still manually push, because server likely not using socket for AI
      setChatMessages((prev) => [
        ...prev,
        { senderId: user._id, messages: inputMessage },
        { senderId: selectedIndex._id, messages: response?.data?.aiReply, isAiMessage: true }
      ]);
    } else {
      // normal user-to-user chat
      const response = await axios.post(
        `${url}/api/messages/send/${selectedIndex._id}`,
        { message: inputMessage },
        {
          withCredentials: true,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined,
          },
        }
      );

      console.log("Message sent successfully:", response?.data?.messages);
      setInputMessage('');

      // ❌ DO NOT manually push here – socket will handle it
      // setChatMessages((prev) => [...prev, response.data.messages]);
    }

  } catch (error) {
    console.error("Error sending message:", error?.response?.data || error);
  }
};

  // send message to click the enter button
  const handleKeyDown = (event) =>{
    if(event.key === 'Enter'){
      handleMessage()
    }
  }


  // emojies list added in to the chat section
  const [showEmoji, setShowEmoji] = useState(false)

  const handleEmojiClick = (emojiData, event) => {
    setInputMessage(prev => prev + emojiData.emoji);
    setShowEmoji(false)
  };

  // add file input
    const fileInputRef = useRef(null);
  
    const handleButtonClick = () => {
      fileInputRef.current.click();
    };

    const handleSelectMessage = (messageId) => {
      setSelectedMessages((prev) =>
        prev.includes(messageId)
          ? prev.filter((id) => id !== messageId)
          : [...prev, messageId]
      );
    };

    const handleDeleteSelected = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await axios.post(
          `${url}/api/messages/delete-selected`,
          { messageIds: selectedMessages },
          {
            withCredentials: true,
            headers: {
              Authorization: token ? `Bearer ${token}` : undefined,
            },
          }
        );
  
        if (response.data.success) {
          setChatMessages((prev) =>
            prev.filter((msg) => !selectedMessages.includes(msg._id))
          );
          setIsSelectionMode(false);
          setSelectedMessages([]);
        }
      } catch (error) {
        console.error("Error deleting selected messages:", error);
      }
    };

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowUserChatDropdown(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    useEffect(() => {
      if (!isSelectionMode) {
        setSelectedMessages([]);
      }
    }, [isSelectionMode]);


  return (
    <div className='flex flex-col h-full mt-12 w-5/6'>
      <div className='flex h-14 bg-[#2c2c2c] w-full items-center justify-between px-5 transition-all duration-300'>
        {isSelectionMode ? (
          <>
            <div className='flex items-center gap-4'>
              <FontAwesomeIcon icon={faXmark} style={{ color: "#ffffff" }} className='cursor-pointer h-5 w-5' onClick={() => setIsSelectionMode(false)} />
              <p className='text-white'>{selectedMessages.length} selected</p>
            </div>
            {selectedMessages.length > 0 && (
              <FontAwesomeIcon icon={faTrash} style={{ color: "#ffffff" }} className='cursor-pointer h-5 w-5' onClick={handleDeleteSelected} />
            )}
          </>
        ) : isSearchVisible ? (
          <>
            <div className='w-full flex justify-end items-center'>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='h-7 bg-[#494949] w-80 placeholder:px-3 text-gray-200 border-gray-400 focus:border-green-00 outline-none rounded-md px-3'
                placeholder='Search messages...'
                autoFocus
              />
            </div>
            <FontAwesomeIcon icon={faXmark} style={{ color: "#ffffff" }} className='ml-4 cursor-pointer h-5 w-5' onClick={() => { setIsSearchVisible(false); setSearchQuery(''); }} />
          </>
        ) : (
          <>
            <div className="flex items-center">
              {selectedIndex?.fullName !== "Starred Messages" && (
                <div className="bg-[#494949] h-10 w-10 rounded-full overflow-hidden">
                  <img
                    src={selectedIndex?.profilePic?.includes('http') ? selectedIndex.profilePic : `${url}/${selectedIndex?.profilePic}`}
                    alt="Profile Picture"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="ml-4 flex flex-col">
                <p className='font-semibold text-white mt-2'>{selectedIndex?.fullName}</p>
                {selectedIndex?.fullName !== "Starred Messages" && <p className='font-thin text-xs text-gray-400'>{selectedIndex?.isOnline ? "Online" : formattedLastSeen(selectedIndex?.lastSeen)}</p>}
              </div>
            </div>
            <div className='flex items-center gap-6'>
              {selectedIndex?.fullName !== "Starred Messages" && <div className='flex gap-6 bg-[#494949] h-9 w-20 items-center rounded-md'><FontAwesomeIcon icon={faVideo} style={{ color: "#ffffff" }} className='ml-3' /><FontAwesomeIcon icon={faPhone} style={{ color: "#ffffff" }} /></div>}
              <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#ffffff", cursor: "pointer" }} onClick={() => setIsSearchVisible(true)} />
              <div className='relative' ref={dropdownRef}>
                <FontAwesomeIcon icon={faEllipsisV} style={{ color: "#ffffff", cursor: "pointer" }} onClick={() => setShowUserChatDropdown(prev => !prev)} />
                {showUserChatDropdown && (
                  <ul tabIndex={0} className="absolute right-0 mt-2 menu bg-base-100 rounded-box z-50 w-40 p-2 shadow-sm">
                    <li onClick={() => {
                      setIsSelectionMode(true);
                      setShowUserChatDropdown(false);
                    }}>
                      <a>Select Messages</a>
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      <ChatMessage searchQuery={searchQuery} isSelectionMode={isSelectionMode} setIsSelectionMode={setIsSelectionMode} selectedMessages={selectedMessages} onSelectMessage={handleSelectMessage} />
      {selectedIndex?.fullName === "Starred Messages" ? "" :
      <div className='mt-auto h-28 bg-[#2c2c2c] w-full flex'>
        <div className='mt-3 flex gap-3 ml-4 relative'>
          <FontAwesomeIcon
            icon={faFaceSmile}
            style={{ color: "#ffffff", cursor: "pointer" }}
            className='h-5 w-5 p-2'
            onClick={() => setShowEmoji(val => !val)}
          />
          <FontAwesomeIcon
            ref={fileInputRef}
            type='button'
            icon={faPaperclip}
            style={{ color: "#ffffff", cursor: "pointer" }}
            className='h-5 w-5 p-2'
            onClick={handleButtonClick}
          />

          {showEmoji && (
            <div className='absolute bottom-12 mb-16 left-0 z-50'>
              <EmojiPicker onEmojiClick={handleEmojiClick} theme="dark" />
            </div>
          )}
        </div>

        <div className='w-full ml-4'>
          <input type="text" onChange={onChangeHandler} value={inputMessage} name="message" className='h-7 bg-[#2c2c2c] mt-4 w-4/6 placeholder:px-3 text-gray-400 border-gray-400  focus:border-green-00 outline-none' placeholder='Type a message' onKeyDown={handleKeyDown} />
        </div>
        {/* <button  onClick={handleMessage} className='h-8 w-20 bg-[#494949] mt-3.5 mr-4 text-white rounded-lg hover:bg-[#818181]'>
          send
        </button> */}
        <FontAwesomeIcon icon={faMicrophone} style={{color: "#ffffff",}} className='mt-3 h-5 w-5 p-2 mr-4' />
      </div>
      }
    </div>
  );
};

export default UserChat;
