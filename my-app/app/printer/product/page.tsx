'use client'

import { useState , useEffect } from "react"
import { FgcodeInterface } from "@/app/printer/interface/FgcodeInterface"
import { Config } from "../../Config"
import Swal from "sweetalert2"
import Modal from "../components/Modal"
import axios from "axios"

interface Fgcode {
    id:string
    name:string
    exp:string
}

export default function UserManagement(){
    const [fgcodes, setFgcodes]= useState<FgcodeInterface[]> ([]);
    const [ showModal, setShowModal] = useState(false);
    const [editingFgcode, setEditingFgcode] = useState<FgcodeInterface |  null> (null);
    const [id, setId] = useState('');
    const [name , setName] = useState('');
    const [exp, setExp] = useState('');
    
    useEffect(()=> {
        fetchFgcodes()
    }, [])

    const fetchFgcodes = async () => {
        try {
            const response = await axios.get(`${Config.apiUrl}/fgcode`)

            if (response.status === 200){
                setFgcodes(response.data)
            }
        } catch (error){
            Swal.fire({
                icon:'error',
                title:'error',
                text:'Failed to fetch users'
            })
        }
    }

    const handleSubmit = async(e: React.FormEvent) => {
         e.preventDefault()

         try{
            const url = editingFgcode
            ?`${Config.apiUrl}/fgcode`
            :`${Config.apiUrl}/fgcode`

            const payload = {
                id:editingFgcode?.id || null,
                name:name,
                exp:exp
            }

            const response = await axios.post(url,payload)

            if (response.status === 200){
                Swal.fire({
                    icon:'success',
                    title:'Success',
                    text:`Fgcode ${editingFgcode ? 'update' : 'create'} successfully`
                })

                setShowModal(false)
                setEditingFgcode(null)
                setId('')
                setName('')
                setExp('')

                fetchFgcodes()
            }

         }catch(error){
            Swal.fire({
                icon:"error",
                title:"Error",
                text:`Failed to ${editingFgcode ? 'update' : 'create'} fgcode`
            })
         }
         
   
         }
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-5">
                Fgcode Management
            </h1>
            <div className="flex justify-between items-center mb-6">
                <button
                className="button-add"
                onClick = {() => {
                    setEditingFgcode(null)
                    setId('')
                    setName('')
                    setExp('')
                    setShowModal(true)
                }} >
             <i className="fas fa-plus mr-2"></i> เพิ่มรายการสินค้า
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="table">
                    <thead>
                        <tr>
                            <th>รหัสสินค้า</th>
                            <th className="w-[120px]">รายการสินค้า</th>
                            <th className="w-[120px]">อายุผลิตภัณฑ์</th>
                            <th className="text-right" style={{width: '200px'}}>
                                &nbsp;
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {fgcodes.map(fgcodes => (
                            <tr key={fgcodes.id}>
                                <td>{fgcodes.id}</td>
                                <td>{fgcodes.name}</td>
                                <td>{fgcodes.exp}</td>
                                <td className="text-right">
                                    <button className="table-action-btn table-edit-btn mr-2">
                                    <i className="fas fa-edit"></i>
                                    </button>
                                </td>
                            </tr>
                            
                        ))}
                    </tbody>
             </table>
                </div> 

                {showModal && (
                    <Modal
                    id="user-modal"
                    title={editingFgcode ? 'Edit fgcode' : 'Add new Product'}
                    onClose={() => setShowModal (false)}
                    size="md">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block mb-2"> Id</label>
                                <input 
                                type="text"
                                className="form-input"
                                value={id}
                                onChange={e => setId(e.target.value)}
                                required/>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-4">Name</label>
                                <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required/>
                            </div>

                            <div className="mb-4">
                                <label className="block mb-2">อายุผลิตภัณฑ์</label>
                                <input
                                type="text"
                                className="form-input"
                                value={exp}
                                onChange={e=> setExp(e.target.value)}
                                required/>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="modal-btn modal-btn-cancel">
                                    <i className="fas fa-times mr-2"></i> Cancel
                                </button>

                                <button
                                type="submit"
                                className="modal-btn modal-btn-submit">
                                    <i className="fas fa-check mr-2"></i>Save
                                </button>
                            </div>
                        </form>
                    </Modal>
                )

                }


        </div>
    );
}