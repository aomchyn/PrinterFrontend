'use client'

import { useState } from "react";
import { Config } from "./Config";
import { useRouter } from "next/navigation";
import axios from "axios";
import Swal from "sweetalert2";

export default function Home (){
  const [ name , setName] = useState('');
  const [ password, setPassword] = useState ('');
  const router = useRouter();

  const handleSignin = async () => {
    try {
      const url = `${Config.apiUrl}/printer/user/admin-signin`;
      const payload = {
        name:name,
        password: password
      }

      const response = await axios.post(url,payload);

      if (response.status === 200){
           document.cookie = Config.tokenKey + '=' + response.data.token;
           localStorage.setItem(Config.tokenKey, response.data.token);

           if (response.data.role == 'admin'){
            router.push('/printer/dashboard');
           } else if (response.data.role == 'zt'){
            router.push('/printer/zt');
           }else{
            router.push('/printer/13');
           }
      }

    } catch (error){
      Swal.fire({
        icon: "error",
        title: "error",
        text: "Username or Password Invalid"
      });
    }
  }

  return (
          
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">
          <i className="fas fa-tree"></i> Printer Operater
        </h1>
        <h2 className="login-subtitle">
          ระบบสั่งพิมพ์
        </h2>
        <form className="login-form">
          <div className="form-group">
            <label className="form-label">
              <i className="fas fa-user mr-2"></i> Name
            </label>
            <input 
            type="text"
            className="form-input"
            placeholder="ป้อนชื่อผู้ใช้ของคุณ"
            value={name}
            onChange={(e) => setName (e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              <i className="fas fa-lock mr-2"></i> Password
            </label>
            <input 
            type="password"
            className="form-input"
            placeholder="ป้อนรหัสผ่านของคุณ"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
          type="button"
          className="login-button"
          onClick={handleSignin}>
            <i className="fas fa-sign-in-alt mr-2"></i> Signin
            </button>
        </form>
      </div>
          </div>
  );
}