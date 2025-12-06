  import React, { useContext, useEffect } from 'react'
  import { useState } from 'react';
  import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
  import { faPlus, faFilter } from '@fortawesome/free-solid-svg-icons';
  import UserList from '../userList/UserList';
  import { contextContainer } from '../../context/ContextProvider';
  import axios from 'axios';

  const Chat = () => {

    useEffect(() => {
      userDetails();
    }, []);


    
    const {url,user,setAllUsers,allUsers} = useContext(contextContainer)
    
    const [searchTerm, setSearchTerm] = useState("");

    // filter user in the search chat
    const filteredUser = allUsers?.filter((user)=>user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))


    const userDetails = async () => {
      const token = localStorage.getItem("authToken");
      try {
        const response = await axios.get(`${url}/api/users`, {
          withCredentials: true,
          headers: {
            Authorization: token ? `Bearer ${token}` : undefined
          }
        });
        
        console.log("All users in the main page", response.data);
        setAllUsers(response?.data?.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    return (
      <div className="flex-1 h-dvh bg-[#2c2c2c] p-4 ml-14  ">
        <div className='mt-12 ml-2 flex '>
        <p className="text-white text-2xl font-semibold ">Chats</p>
          <div className='flex gap-7 ml-44 mt-3'>
            <FontAwesomeIcon icon={faPlus} style={{ color: "#ffffff" }} />
            <FontAwesomeIcon icon={faFilter} style={{ color: "#ffffff" }} />
          </div>
        </div>
        <div className='mt-3 mb-4'>
          <input type="text" className='bg-[#383838] w-72 ml-6 rounded-md px-2 py-1 text-xs  border-gray-400 focus:border-b-2 focus:border-green-00 outline-none text-white ' placeholder='Search or start a new chat' value={searchTerm} onChange={(e)=> setSearchTerm(e.target.value)} />
        </div>
        <div className='overflow-y-auto max-h-[75vh] pr-2'>
        <UserList users={filteredUser}/>
        </div>
      </div>
    );
  }

  export default Chat