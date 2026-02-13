'use client'

import { useState , useEffect } from "react"
import { UserInterface } from "@/app/printer/interface/UserInterface"
import { Config } from "../../Config"
import Swal from "sweetalert2"
import Modal from "../components/Modal"
import axios from "axios"

interface User {
    id:number
    email:string
    name:string
}

export default function UserManagement(){
    const [users, setUsers]= useState<UserInterface[]> ([]);
    const [ showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserInterface |  null> (null);
    const [email, setEmail] = useState('');
    const [name , setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('user');
    
    useEffect(()=> {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${Config.apiUrl}/printer/user`)

            if (response.status === 200){
                setUsers(response.data)
            }
        } catch (error){
            Swal.fire({
                icon:'error',
                title:'error',
                text:'Failed to fetch users'
            })
        }
    }

    const isDuplicateName = (name: string, excludeUserId?: number): boolean => {
        return users.some(user => 
            user.name.toLowerCase() === name.toLowerCase() && 
            user.id !== excludeUserId
        );
    };

    const handleSubmit = async (e:React.FormEvent) => {
        e.preventDefault()

        // ✅ ตรวจสอบชื่อซ้ำ (เฉพาะการสร้างใหม่)
    if (!editingUser) {
        if (isDuplicateName(name)) {
            Swal.fire({
                icon: 'error',
                title: 'ชื่อผู้ใช้ซ้ำ',
                text: 'มีชื่อผู้ใช้นี้ในระบบแล้ว กรุณาใช้ชื่ออื่น'
            });
            return;
        }
    }

    if (editingUser) {
        if (isDuplicateName(name, editingUser.id)) {
            Swal.fire({
                icon: 'error',
                title: 'ชื่อผู้ใช้ซ้ำ',
                text: 'มีชื่อผู้ใช้นี้ในระบบแล้ว กรุณาใช้ชื่ออื่น'
            });
            return;
        }
    }
        try {
            const url = editingUser
            ?`${Config.apiUrl}/printer/user/admin-update-profile`
            :`${Config.apiUrl}/printer/user/admin-create`

            const payload = {
                id: editingUser?.id || null,
                email:email,
                name:name,
                password:password || '',
                role:role
            }

            const headers = {
                Authorization : `Bearer ${localStorage.getItem(Config.tokenKey)}`
            }

            const response = await axios.post(url,payload, {headers})

            if (response.status === 200){
                Swal.fire({
                    icon:'success',
                    title:'Success',
                    text:`User ${editingUser ? 'updated' : 'created'} successfully`,
                    timer:1000
                })

                setShowModal(false)
                setEditingUser(null)
                setEmail('')
                setName('')
                setPassword('')
                setRole('user')

                fetchUsers()
            }
        } catch (error){
            Swal.fire({
                icon:'error',
                title:'Error',
                text:`Failed to ${editingUser ? 'update': 'create'} user`
            })
        }
    }

     const  handleDelete = async (user: UserInterface) => {
            const result = await Swal.fire({
                 icon:'warning',
                 title:'Are You Sure ?',
                 text:`Do you want to delete user ${user.name}?`,
                 showCancelButton:true,
                 confirmButtonText:'Delete',
                 cancelButtonText:'Cancel'
              })

              if (result.isConfirmed){
                try {
                    const headers = {
                        'Authorization' : `Bearer ${localStorage.getItem(Config.tokenKey)}`
                    }

                    const url = `${Config.apiUrl}/printer/user/admin-delete/${user.id}`
                    const response = await axios.delete(url,{headers})

                    if (response.status === 200){
                        Swal.fire({
                            icon:'success',
                            title:'Success',
                            text:'User Deleted Successfully',
                            timer: 1000
                        })

                        fetchUsers()
                    }
                } catch(error){
                    Swal.fire({
                        icon:'error',
                        title:'Error',
                        text:'Failed to delete user'
                    })
                }
              }
    }

    const handleEdit = (user:UserInterface) => {
        setEditingUser(user)
        setEmail(user.email)
        setName(user.name)
        setPassword('')
        setShowModal(true)
        setRole(user.role ?? '');
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-5">
                จัดการบัญชีผู้ใช้
            </h1>
            <div className="flex justify-between items-center mb-6">
                <button
                className="button-add"
                onClick = {() => {
                    setEditingUser(null)
                    setEmail('')
                    setName('')
                    setPassword('')
                    setRole('user')
                    setShowModal(true)
                }} >
             <i className="fas fa-plus mr-2"></i> เพิ่มบัญชีผู้ใช้งาน
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Email</th>
                            <th className="w-[120px]">Username</th>
                            <th className="w-[120px]">Role</th>
                            <th className="text-right" style={{width: '200px'}}>
                                &nbsp;
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key = {user.id}>
                                <td>{user.email}</td>
                                <td>{user.name}</td>
                                <td>{user.role}</td>
                                <td className="text-right">
                                    <button
                                    className="table-action-btn table-edit-btn mr-2"
                                    onClick={() => handleEdit(user)} >
                                  <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                    className="table-action-btn table-delete-btn"
                                      onClick={() => handleDelete(user)}>
                                        <i className="fas fa-trash"></i>
                                      </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div> 

            {showModal && (
                <Modal
                id = "user-modal"
                title = {editingUser ? 'Edit user' : 'Add new user' }
                onClose = {() => setShowModal (false)}
                size="md">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2"> Email</label>
                            <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required/>
                        </div>

                        <div className="mb-4">
                            <label className="block mb-4"> Username</label>
                            <input
                            type="text"
                            className="form-input"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required/>
                        </div>
         
                        <div className="mb-4">
                            <label className="block mb-2">
                                Password {editingUser && '(Leave blank to keep current password)'}
                            </label>
                            <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={e => setPassword (e.target.value)}
                            {...(!editingUser && {required : true})}/>
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2"> ระดับสิทธิ์การเข้าถึงข้อมูล</label>
                            <select className="form-input" value={role}
                                onChange={e => setRole(e.target.value)}>
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="modal-btn modal-btn-cancel">
                                <i className="fas fa-times mr-2"></i> ยกเลิก
                            </button>
                            <button
                            type="submit"
                            className="modal-btn modal-btn-submit">
                                <i className="fas fa-check mr-2"></i> บันทึก
                            </button>
                        </div>

                    </form>
                </Modal>
            )}
        </div>
    );
}