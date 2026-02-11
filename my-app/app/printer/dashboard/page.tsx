'use client';

import React, { useState, useEffect } from 'react';
import { OrderInterface } from '../printer/interface/OrderInterface';
import { Config } from '../../Config';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useRouter } from 'next/navigation';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
    const [orders, setOrders] = useState<OrderInterface[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingOrder, setEditingOrder] = useState<OrderInterface | null>(null);
    const [role, setRole] = useState('');
    const [userName, setUserName] = useState('');
    const router = useRouter();

    // ตรวจสอบ token และดึงข้อมูล role
    useEffect(() => {
        fetchUserInfo();
        loadOrders();
        const interval = setInterval(loadOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchUserInfo = async () => {
        try {
            const token = localStorage.getItem(Config.tokenKey);
            
            if (!token) {
                router.push('/');
                return;
            }

            const response = await axios.get(`${Config.apiUrl}/printer/user/admin-info`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200) {
                setRole(response.data.role);
                setUserName(response.data.name);
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
            // ถ้า token หมดอายุหรือไม่ถูกต้อง ให้กลับไปหน้า login
            localStorage.removeItem(Config.tokenKey);
            router.push('/');
        }
    };

    const loadOrders = () => {
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        setOrders(savedOrders);
    };

    // กรองข้อมูลตามเลขลอต
    const filteredOrders = orders.filter(order => {
        const matchesSearch = searchTerm.trim() === '' || 
                             order.lotNumber.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // ลบคำสั่งซื้อ - เฉพาะ Admin
    const deleteOrder = (id: number | undefined) => {
        if (role !== 'admin') {
            Swal.fire({
                icon: 'error',
                title: 'ไม่มีสิทธิ์',
                text: 'เฉพาะ Admin เท่านั้นที่สามารถลบข้อมูลได้'
            });
            return;
        }

        if (!id) return;

        Swal.fire({
            title: 'ยืนยันการลบ?',
            text: 'คุณต้องการลบคำสั่งซื้อนี้หรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก'
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedOrders = orders.filter(order => order.id !== id);
                localStorage.setItem('orders', JSON.stringify(updatedOrders));
                setOrders(updatedOrders);
                
                Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ!',
                    text: 'คำสั่งซื้อถูกลบแล้ว',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
        });
    };

    // แก้ไขคำสั่งซื้อ - เฉพาะ Admin
    const startEdit = (order: OrderInterface) => {
        if (role !== 'admin') {
            Swal.fire({
                icon: 'error',
                title: 'ไม่มีสิทธิ์',
                text: 'เฉพาะ Admin เท่านั้นที่สามารถแก้ไขข้อมูลได้'
            });
            return;
        }
        setEditingOrder({ ...order });
    };

    const saveEdit = () => {
        if (!editingOrder) return;

        const updatedOrders = orders.map(order => 
            order.id === editingOrder.id ? editingOrder : order
        );
        
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        setOrders(updatedOrders);
        setEditingOrder(null);
        
        Swal.fire({
            icon: 'success',
            title: 'บันทึกสำเร็จ',
            timer: 1500,
            showConfirmButton: false
        });
    };

    // ฟังก์ชันแปลงวันที่เป็นรูปแบบ พ.ศ.
    const formatToThaiDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear() + 543;
            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
    };

    // ฟังก์ชันแปลงวันที่เป็นรูปแบบ ค.ศ.
    const formatToChristianDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (error) {
            return dateString;
        }
    };

    // ฟังก์ชันแสดงวันที่ทั้งสองรูปแบบ
    const formatDateDisplay = (dateString: string) => {
        const thaiDate = formatToThaiDate(dateString);
        const christianDate = formatToChristianDate(dateString);
        
        return (
            <div className="flex flex-col">
                <span className="text-gray-800">{thaiDate}</span>
                <span className="text-gray-500 text-xs">({christianDate})</span>
            </div>
        );
    };

    // ฟังก์ชันสำหรับแสดงวันที่และเวลาที่สั่งซื้อ
    const formatOrderDateTime = (order: OrderInterface) => {
        let date: Date;
        
        if (order.orderDateTime) {
            date = new Date(order.orderDateTime);
        } else if (order.orderDate && order.orderTime) {
            date = new Date(order.orderDate + 'T' + order.orderTime);
        } else if (order.orderDate) {
            date = new Date(order.orderDate);
        } else {
            return 'ไม่ระบุ';
        }
        
        if (isNaN(date.getTime())) return 'ไม่ระบุ';
        
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear() + 543;
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${day}/${month}/${year}, ${hours}:${minutes}`;
    };

    // คำนวณข้อมูลสำหรับกราฟ
    const getChartData = () => {
        const userOrders: { [key: string]: number } = {};
        
        orders.forEach(order => {
            const creator = order.createdBy || 'ไม่ระบุ';
            userOrders[creator] = (userOrders[creator] || 0) + 1;
        });

        return Object.entries(userOrders).map(([name, count]) => ({
            name,
            count
        })).sort((a, b) => b.count - a.count);
    };

    const chartData = getChartData();
    
    // สีสำหรับกราฟ Pie
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];


    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-800">
                                📊 Dashboard คำสั่งฉลากสินค้า
                            </h1>
                            {userName && (
                                <p className="text-gray-600 mt-2">
                                    ผู้ใช้งาน: {userName} 
                                    {role === 'admin' && (
                                        <span className="ml-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                                            Admin
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                      {/* สถิติรวม */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 p-6 rounded-xl border-l-4 border-blue-500">
                            <p className="text-sm text-gray-600 mb-1">คำสั่งทั้งหมด</p>
                            <p className="text-4xl font-bold text-blue-600">{orders.length}</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-xl border-l-4 border-green-500">
                            <p className="text-sm text-gray-600 mb-1">จำนวนผู้สั่ง</p>
                            <p className="text-4xl font-bold text-green-600">{chartData.length}</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-xl border-l-4 border-purple-500">
                            <p className="text-sm text-gray-600 mb-1">ผู้สั่งมากที่สุด</p>
                            <p className="text-2xl font-bold text-purple-600">
                                {chartData[0]?.name || '-'}
                            </p>
                            <p className="text-sm text-gray-500">
                                ({chartData[0]?.count || 0} คำสั่ง)
                            </p>
                        </div>
                    </div>

                    {/* กราฟ */}
                    {chartData.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                            {/* กราฟแท่ง */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">
                                    📊 จำนวนคำสั่งของแต่ละคน
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="count" fill="#3b82f6" name="จำนวนคำสั่ง" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* กราฟวงกลม */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">
                                    🥧 สัดส่วนการสั่ง
                                </h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* ช่องค้นหา */}
                    <div className="mb-6">
                        <label className="block text-xl font-semibold text-gray-700 mb-2">
                            🔍 ค้นหาเลขลอตสินค้า
                        </label>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="กรอกเลขลอตที่ต้องการค้นหา..."
                            className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
                        />
                        {searchTerm && (
                            <div className="mt-2 text-sm text-gray-600">
                                พบ {filteredOrders.length} รายการที่ตรงกับ "{searchTerm}"
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="ml-2 text-red-500 hover:text-red-700 font-semibold"
                                >
                                    ✕ ล้างการค้นหา
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* รายการคำสั่งซื้อ */}
                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                            {searchTerm 
                                ? `ไม่พบเลขลอต "${searchTerm}"` 
                                : 'ไม่มีคำสั่ง'}
                        </h2>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
                            >
                                ล้างการค้นหา
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredOrders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow p-6"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">
                                            {order.productName}
                                        </h3>
                                        <p className="text-sm text-gray-700">
                                            รหัส: {order.productId} | ลอต: {order.lotNumber}
                                        </p>
                                    </div>
                                    
                                    {/* ปุ่มจัดการ - แสดงเฉพาะ Admin */}
                                    {role === 'admin' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => startEdit(order)}
                                                className="text-blue-500 hover:text-blue-700 transition"
                                                title="แก้ไข"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => deleteOrder(order.id)}
                                                className="text-red-500 hover:text-red-700 transition"
                                                title="ลบ"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {/* วันที่สั่งซื้อ */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">วันที่สั่ง:</span>
                                        <span className="font-semibold text-gray-800 text-right">
                                            {formatOrderDateTime(order)}
                                        </span>
                                    </div>
                                    
                                    {/* ✅ เพิ่มตรงนี้: ชื่อผู้สั่ง */}
<div className="flex justify-between text-sm">
    <span className="text-gray-600">ผู้สั่ง:</span>
    <span className="font-semibold text-gray-800">
        {order.createdBy || 'ไม่ระบุ'}
    </span>
</div>
                                    {/* วันที่ผลิต */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">วันที่ผลิต:</span>
                                        <div className="font-semibold text-gray-800 text-right">
                                            {formatDateDisplay(order.productionDate)}
                                        </div>
                                    </div>

                                    {/* วันหมดอายุ */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">วันหมดอายุ:</span>
                                        <div className="font-semibold text-red-600 text-right">
                                            {formatDateDisplay(order.expiryDate)}
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">อายุผลิตภัณฑ์:</span>
                                        <span className="font-semibold text-blue-600">{order.productExp}</span>
                                    </div>
                                    
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">จำนวน:</span>
                                        <span className="font-semibold text-green-600">{order.quantity} ชิ้น</span>
                                    </div>
                                    
                                    {/* หมายเหตุ */}
                                    {order.notes && (
                                        <div className="pt-3 border-t border-gray-200">
                                            <span className="text-sm text-gray-600 block mb-1">หมายเหตุ:</span>
                                            <p className="text-sm text-gray-800 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                                                {order.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modal แก้ไขข้อมูล */}
                {editingOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <h2 className="text-2xl font-bold text-black mb-6">✏️ แก้ไขคำสั่งซื้อ</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">เลขลอต</label>
                                    <input
                                        type="text"
                                        value={editingOrder.lotNumber}
                                        onChange={(e) => setEditingOrder({...editingOrder, lotNumber: e.target.value})}
                                        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-black mb-2">จำนวน</label>
                                    <input
                                        type="number"
                                        value={editingOrder.quantity}
                                        onChange={(e) => setEditingOrder({...editingOrder, quantity: parseInt(e.target.value) || 0})}
                                        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">หมายเหตุ</label>
                                    <textarea
                                        value={editingOrder.notes || ''}
                                        onChange={(e) => setEditingOrder({...editingOrder, notes: e.target.value})}
                                        className="w-full text-black px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                        rows={3}
                                        placeholder="กรอกหมายเหตุเพิ่มเติม (ถ้ามี)"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={saveEdit}
                                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition"
                                >
                                    💾 บันทึก
                                </button>
                                <button
                                    onClick={() => setEditingOrder(null)}
                                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-lg font-semibold transition"
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}