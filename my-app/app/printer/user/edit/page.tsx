'use client'

import React, { useState , useEffect } from "react"
import axios from "axios"
import { Config } from "@/app/Config"
import Swal from "sweetalert2"
import { useRouter } from "next/navigation"


export default function EditProfile(){
    const [name, setName] = useState('')
    const [email , setEmail] = useState ('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetchUserData()
    }, [])

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem(Config.tokenKey)
            const response = await axios.get(`${Config.apiUrl}/printer/user/admin-info`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.status === 200){
                setName(response.data.name)
                setEmail(response.data.email)
            }
        } catch(err){
            Swal.fire({
                icon:'error',
                title:'Error',
                text:'ไม่สามารถดึงข้อมุลผู้ใช้ได้'
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) =>{

        e.preventDefault() 

        try {

            if (password !== confirmPassword ) {
                Swal.fire({
                    icon : 'error',
                    title : 'error',
                    text : 'รหัสผ่านไม่ตรงกัน'
                })

                return
            }

            const token = localStorage.getItem(Config.tokenKey)
            const url = `${Config.apiUrl}/printer/user/admin-edit-profile` 
            const payload = {
                name,
                email,
                password
            }

            const headers = {
                'Authorization' : `Bearer ${token}`
            }

            const response = await axios.post(url,payload, { headers })

            if (response.status === 200){
                Swal.fire({
                    icon: 'success',
                    title: 'success',
                    text: 'แก้ไขข้อมูลสำเร็จ'
                })
                router.push('/printer/dashboard')
            }

        }catch (err) {
            Swal.fire({
                icon:'error',
                title : 'Error',
                text : 'ไม่สามารถแก้ไขข้อมูลได้'
            })
        
        }
}
return (
    <div>
        <h1 className="login-title">แก้ไขข้อมูลส่วนตัว</h1>
        <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
                <label className="form-label">Username</label>
                <input 
                type="text"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label className="form-label">Email</label>
                <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                />
             </div>
             <div className="form-group">
                <label className="form-label">Password</label>
                <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ป้อนรหัสผ่านใหม่ของคุณ"
                />
             </div>
             <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="ยืนยันรหัสผ่านใหม่อีกครั้ง"
                />
             </div>
             <div className="form-group flex items-center">
                <button type="submit" className="button">
                    <i className="fas fa-save mr-2"></i>
                    บันทึก
                </button>
             </div>
        </form>
    </div>
)




}