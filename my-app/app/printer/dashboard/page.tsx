'use client';

import React, { useState, useEffect } from 'react';
import { OrderInterface } from '../printer/interface/OrderInterface';

export default function DashboardPage() {
    const [orders, setOrders] = useState<OrderInterface[]>([]);
    const [filter, setFilter] = useState<'all' | 'today' | 'thisWeek'>('all');

    // โหลดข้อมูลจาก localStorage
    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadOrders = () => {
        const savedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
        setOrders(savedOrders);
    };

    // กรองข้อมูลตามเงื่อนไข
    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        
        const orderDate = new Date(order.orderDate);
        const today = new Date();
        
        if (filter === 'today') {
            return orderDate.toDateString() === today.toDateString();
        }
        
        if (filter === 'thisWeek') {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
        }
        
        return true;
    });

    // ลบคำสั่งซื้อ
    const deleteOrder = (id: number | undefined) => {
        if (!id || !confirm('คุณต้องการลบคำสั่งซื้อนี้หรือไม่?')) return;
        
        const updatedOrders = orders.filter(order => order.id !== id);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        setOrders(updatedOrders);
    };

    // ล้างข้อมูลทั้งหมด
    const clearAllOrders = () => {
        if (!confirm('คุณต้องการลบคำสั่งซื้อทั้งหมดหรือไม่?')) return;
        
        localStorage.removeItem('orders');
        setOrders([]);
    };

    // ตรวจสอบวันหมดอายุ
    const checkExpiryStatus = (expiryDate: string) => {
        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
            return { status: 'หมดอายุแล้ว', color: 'text-red-600 bg-red-50', days: daysUntilExpiry };
        } else if (daysUntilExpiry <= 30) {
            return { status: 'ใกล้หมดอายุ', color: 'text-orange-600 bg-orange-50', days: daysUntilExpiry };
        } else {
            return { status: 'ปกติ', color: 'text-green-600 bg-green-50', days: daysUntilExpiry };
        }
    };

    // ฟังก์ชันแปลงวันที่เป็นรูปแบบ พ.ศ.
    const formatToThaiDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear() + 543; // แปลง ค.ศ. เป็น พ.ศ.
            
            return `${day}/${month}/${year}`;
        } catch (error) {
            console.error('Error formatting Thai date:', error);
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
            console.error('Error formatting Christian date:', error);
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

    // ฟังก์ชันสำหรับแสดงวันที่สั่งซื้อ (แบบเดิม)
    const formatOrderDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('th-TH');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-4xl font-bold text-gray-800">
                            📊 Dashboard คำสั่งฉลากสินค้า
                        </h1>
                    </div>

                    {/* สรุปข้อมูล */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <p className="text-sm text-gray-600">คำสั่งทั้งหมด</p>
                            <p className="text-3xl font-bold text-blue-600">{orders.length}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                            <p className="text-sm text-gray-600">คำสั่งวันนี้</p>
                            <p className="text-3xl font-bold text-green-600">
                                {orders.filter(o => new Date(o.orderDate).toDateString() === new Date().toDateString()).length}
                            </p>
                        </div>
                    </div>
               </div>

                {/* รายการคำสั่งซื้อ */}
                {filteredOrders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-6xl mb-4">📦</div>
                        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                            ไม่มีคำสั่ง
                        </h2>
                        
                      
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {filteredOrders.map((order) => {
                            const expiryStatus = checkExpiryStatus(order.expiryDate);
                            return (
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
                                        <button
                                            onClick={() => deleteOrder(order.id)}
                                            className="text-red-500 hover:text-red-700 transition"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {/* วันที่สั่งซื้อ */}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">วันที่สั่ง:</span>
                                            <span className="font-semibold text-gray-800 text-right">
                                                {formatOrderDate(order.orderDate)}
                                            </span>
                                        </div>

                                        {/* วันที่ผลิต - แสดงทั้ง พ.ศ. และ ค.ศ. */}
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">วันที่ผลิต:</span>
                                            <div className="font-semibold text-gray-800 text-right">
                                                {formatDateDisplay(order.productionDate)}
                                            </div>
                                        </div>

                                        {/* วันหมดอายุ - แสดงทั้ง พ.ศ. และ ค.ศ. */}
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
                                    </div>
                                    </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}