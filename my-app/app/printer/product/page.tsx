'use client'

import { useState, useEffect } from "react"
import { FgcodeInterface } from "@/app/printer/interface/FgcodeInterface"
import { Config } from "../../Config"
import Swal from "sweetalert2"
import Modal from "../components/Modal"
import axios from "axios"

export default function FgcodeManagement(){
    const [fgcodes, setFgcodes] = useState<FgcodeInterface[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingFgcode, setEditingFgcode] = useState<FgcodeInterface | null>(null);
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [exp, setExp] = useState('');
    
    useEffect(() => {
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
                title:'ผิดพลาด',
                text:'ไม่สามารถดึงข้อมูลรหัสสินค้าได้'
            })
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // ✅ ตรวจสอบข้อมูลก่อนส่ง
        if (!id.trim() || !name.trim() || !exp.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง'
            })
            return
        }

        try {
            const url = editingFgcode
                ? `${Config.apiUrl}/fgcode/update-profile`
                : `${Config.apiUrl}/fgcode/create`

            const payload = {
                id: editingFgcode?.id || id,
                name: name,
                exp: exp
            }

            console.log('Sending payload:', payload) // ✅ Debug

            const response = await axios.post(url, payload)

            if (response.status === 200 || response.status === 201) {
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: `${editingFgcode ? 'แก้ไข' : 'สร้าง'}รหัสสินค้าสำเร็จ`,
                    timer: 1500,
                    showConfirmButton: false
                })

                setShowModal(false)
                setEditingFgcode(null)
                setId('')
                setName('')
                setExp('')

                fetchFgcodes()
            }

        } catch (error: any) {
            
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error ||
                                error.message ||
                                `ไม่สามารถ${editingFgcode ? 'แก้ไข' : 'สร้าง'}รหัสสินค้าได้`
            
            Swal.fire({
                icon: "error",
                title: "ผิดพลาด",
                text: errorMessage
            })
        }
    }

    const handleEdit = (fgcode: FgcodeInterface) => {
        setEditingFgcode(fgcode)
        setId(fgcode.id || '')
        setName(fgcode.name || '')
        setExp(fgcode.exp || '')
        setShowModal(true)
    }

    // ✅ เพิ่มฟังก์ชันลบ (ถ้าต้องการ)
    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ',
            text: `คุณต้องการลบรหัสสินค้า ${id} ใช่หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        })

        if (result.isConfirmed) {
            try {
                await axios.delete(`${Config.apiUrl}/fgcode/${id}`)
                
                Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ',
                    timer: 1500,
                    showConfirmButton: false
                })
                
                fetchFgcodes()
            } catch (error: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'ผิดพลาด',
                    text: 'ไม่สามารถลบรหัสสินค้าได้'
                })
            }
        }
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-5">
                จัดการรหัสสินค้า
            </h1>
            <div className="flex justify-between items-center mb-6">
                <button
                    className="button-add"
                    onClick={() => {
                        setEditingFgcode(null)
                        setId('')
                        setName('')
                        setExp('')
                        setShowModal(true)
                    }}>
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
                                จัดการ
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {fgcodes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-4">
                                    ไม่มีข้อมูล
                                </td>
                            </tr>
                        ) : (
                            fgcodes.map(fgcode => (
                                <tr key={fgcode.id}>
                                    <td>{fgcode.id}</td>
                                    <td>{fgcode.name}</td>
                                    <td>{fgcode.exp}</td>
                                    <td className="text-right">
                                        <button 
                                            className="table-action-btn table-edit-btn mr-2"
                                            onClick={() => handleEdit(fgcode)}
                                            title="แก้ไข">
                                            <i className="fas fa-edit"></i>
                                        </button>
                                        <button 
                                            className="table-action-btn table-delete-btn"
                                            onClick={() => handleDelete(fgcode.id)}
                                            title="ลบ">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div> 

            {showModal && (
                <Modal
                    id="fgcode-modal"
                    title={editingFgcode ? 'แก้ไขรหัสสินค้า' : 'เพิ่มรหัสสินค้าใหม่'}
                    onClose={() => {
                        setShowModal(false)
                        setEditingFgcode(null)
                        setId('')
                        setName('')
                        setExp('')
                    }}
                    size="md">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block mb-2 font-medium">
                                รหัสสินค้า <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text"
                                className="form-input"
                                value={id}
                                onChange={e => setId(e.target.value)}
                                placeholder="กรอกรหัสสินค้า"
                                required
                                disabled={!!editingFgcode}
                            />
                            {editingFgcode && (
                                <small className="text-gray-500">
                                    ไม่สามารถแก้ไขรหัสสินค้าได้
                                </small>
                            )}
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2 font-medium">
                                ชื่อสินค้า <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="กรอกชื่อสินค้า"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block mb-2 font-medium">
                                อายุผลิตภัณฑ์ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                value={exp}
                                onChange={e => setExp(e.target.value)}
                                placeholder="เช่น 12 เดือน, 2 ปี"
                                required
                            />
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowModal(false)
                                    setEditingFgcode(null)
                                    setId('')
                                    setName('')
                                    setExp('')
                                }}
                                className="modal-btn modal-btn-cancel">
                                <i className="fas fa-times mr-2"></i> ยกเลิก
                            </button>

                            <button
                                type="submit"
                                className="modal-btn modal-btn-submit">
                                <i className="fas fa-check mr-2"></i>
                                {editingFgcode ? 'บันทึกการแก้ไข' : 'สร้าง'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
}