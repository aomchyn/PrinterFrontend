'use client'

import { useState , useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import Swal from "sweetalert2"
import { Config } from "../Config"
import Link from "next/link"

export default function Sidebar(){
     
    const [name, setName] = useState('');
    const router = useRouter();
    const [currentPath, setCurrentPath] = useState('');
    const [role, setRole] = useState('');

    useEffect(() =>{
        fetchData();
        setCurrentPath(localStorage.getItem('curentPath') || '')

    } , []);

    const fetchData = async () => {
        try {
             const token = localStorage.getItem(Config.tokenKey)

             if (!token){
                router.push('/');
                return;
             }
             const response = await axios.get(`${Config.apiUrl}/printer/user/admin-info`, {
                headers: {
                    Authorization : `Bearer ` + token
                }
            })

             if (response.status === 200) {
                setName(response.data.name)
                setRole(response.data.role);
             }
        } catch (error){
            Swal.fire({
                icon:'error',
                title:'error',
                text: 'ไม่สามารถดึงชื่อผู้ใช้งานได้'+ error
            })

        }
    }

    const handleLogout = async () => {
        try {

            const button = await Swal.fire({
                icon:'error',
                title:'ยืนยันลงชื่อออก',
                text:'คุณแน่ใจที่จะลงชื่อออกจากระบบหรือไม่ ?',
                showCancelButton: true,
                showConfirmButton: true
            })

            if(button.isConfirmed){
                // ลบคุกกี้
                document.cookie = `${Config.tokenKey}=; path=/: max-age=0`;
                localStorage.removeItem(Config.tokenKey);
                router.push('/');
            }

        } catch (err){
            Swal.fire({
                icon:'error',
                title:'Error',
                text:'ไม่สามารถลงชื่อออกได้' + err
            })

        }
    }
    
    const navigateAndSetCurrentPath = (path: string) => {
        router.push(path);
        setCurrentPath(path);
        localStorage.setItem('currentPath' , path);
    }

    const isActive = (path: string) => {
        return currentPath == path ? 'sidebar-nav-link-active' : 'sidebar-nav-link';
    }

    return (
     <>
     
     <div className="sidebar">
        <div className="sidebar-container">
            <div className="sidebar-title">
                <h1>
                    <i className="fas fa-tree mr-3"></i>
                    Printer OP
                </h1>
                <div className="text-lg font-normal mt-3 mb-4">
                    <i className="fas fa-user mr-3"></i>
                    {name} ({role})
                </div>
               <div className="flex gap-1 m-3 justify-center"> {role === 'admin' && 
               ( <Link href="/printer/user/edit" className="btn-edit"> <i className="fas fa-edit mr-3"></i> Edit </Link> )}
                    <button className="btn-logout" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Logout
                    </button>
                </div>
            </div>
            <nav>
                <ul className="sidebar-nav-list">
                    {role == 'admin' && (
                        <li className="sidebar-nav-item">
                        <a onClick={() => navigateAndSetCurrentPath('/printer/dashboard')}
                           className={isActive('/printer/dashboard')}>
                            <i className="fas fa-box-open mr-2"></i>
                            <span>Dashboard</span>
                        </a>
                         </li>
                    )}
         
               <ul className="sidebar-nav-list">
                <li className="sidebar-nav-item">
                  <a onClick={() => navigateAndSetCurrentPath('/printer/people')}
                   className={isActive('/printer/people')}>
                    <i className="fas fa-leaf mr-2"></i>
                       <span>People</span>
                   </a>
                </li>
               </ul>

               <ul className="sidebar-nav-list">
                            {role == 'admin' && (
                                 <li className="sidebar-nav-item">
                                <a onClick={() => navigateAndSetCurrentPath('/printer/product')}
                                    className={isActive('/printer/product')}>
                                    <i className="fas fa-user-alt mr-2"></i>
                                   <span>Product</span>
                                </a>
                                 </li>
                            )}

                              

                        </ul>
                        <ul className="sidebar-nav-list">
                            {role == 'admin' && (
                                 <li className="sidebar-nav-item">
                                <a onClick={() => navigateAndSetCurrentPath('/printer/user')}
                                    className={isActive('/printer/user')}>
                                    <i className="fas fa-user-alt mr-2"></i>
                                   <span>Users</span>
                                </a>
                                 </li>
                            )}
                            </ul>

                         
                   
                  </ul>
            </nav>
        </div>
     </div>
     
     
     
     
     </>
    );
    
}
    