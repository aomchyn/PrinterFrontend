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
        e.preventDefault();
    
        if (!id.trim() || !name.trim() || !exp.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'ข้อมูลไม่ครบ',
                text: 'กรุณากรอกข้อมูลให้ครบทุกช่อง'
            });
            return;
        }
    
        try {
            let response;
    
            if (editingFgcode) {
                // ✅ แก้ไข: ใช้ PUT /fgcode/{id} ส่งแค่ name, exp
                response = await axios.put(
                    `${Config.apiUrl}/fgcode/${editingFgcode.id}`,
                    { name, exp },  // ไม่ต้องส่ง id ใน body
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            } else {
                // ✅ เพิ่มใหม่: ใช้ POST /fgcode/create ส่ง id, name, exp
                response = await axios.post(
                    `${Config.apiUrl}/fgcode/create`,
                    { id, name, exp },
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                );
            }
    
            if (response.status === 200 || response.status === 201) {
                Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ',
                    text: `${editingFgcode ? 'แก้ไข' : 'สร้าง'}รหัสสินค้าสำเร็จ`,
                    timer: 1500,
                    showConfirmButton: false
                });
    
                // ปิด Modal และรีเซ็ตฟอร์ม
                setShowModal(false);
                setEditingFgcode(null);
                setId('');
                setName('');
                setExp('');
    
                // โหลดข้อมูลใหม่
                fetchFgcodes();
            }
    
        } catch (error: any) {
            // ✅ ดึง error message จาก response ของ backend
            const errorMessage = error.response?.data?.message ||
                                 error.response?.data?.error ||
                                 error.message ||
                                 `ไม่สามารถ${editingFgcode ? 'แก้ไข' : 'สร้าง'}รหัสสินค้าได้`;
    
            Swal.fire({
                icon: 'error',
                title: 'ผิดพลาด',
                text: errorMessage
            });
        }
    };

    const handleEdit = (fgcode: FgcodeInterface) => {
        setEditingFgcode(fgcode);
        setId(fgcode.id || '');
        setName(fgcode.name || '');
        setExp(fgcode.exp || '');
        setShowModal(true);
    };
    

    // ฟังก์ชันลบ (ถ้าต้องการ)
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
                    onClick={() => {
                        setEditingFgcode(null)
                        setId('')
                        setName('')
                        setExp('')
                        setShowModal(true)
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-5 rounded-lg transition duration-200 flex items-center shadow-md"
                     >
                     <i className="fas fa-plus mr-2"></i> เพิ่มรายการสินค้า
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">รหัสสินค้า</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">รายการสินค้า</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">อายุผลิตภัณฑ์</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                จัดการ
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {fgcodes.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">

                                <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 12H4M12 4v16" />
                            </svg>
                            <span>ไม่มีข้อมูลสินค้า กรุณาเพิ่มรายการ</span>
                        </div>
                                    ไม่มีข้อมูล
                                </td>
                            </tr>
                        ) : (
                            fgcodes.map((fgcode, index) => (
                                <tr 
                                    key={fgcode.id}
                                    className={`
                                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} 
                                        hover:bg-blue-50/30 transition-colors duration-150
                                    `}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {fgcode.id}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {fgcode.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">
                                            {fgcode.exp}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(fgcode)}
                                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded-full hover:bg-indigo-50 transition mr-1"
                                            title="แก้ไข"
                                        >
                                            <i className="fas fa-edit w-4 h-4"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(fgcode.id)}
                                            className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition"
                                            title="ลบ"
                                        >
                                            <i className="fas fa-trash w-4 h-4"></i>
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