'use client';

import React, { useState, useEffect } from 'react';
import { OrderInterface } from '../printer/interface/OrderInterface';
import { FgcodeInterface } from '../printer/interface/FgcodeInterface';
import { Config } from "../../Config";
import Swal from 'sweetalert2';

export default function OrderPage() {
    const [orderData, setOrderData] = useState<OrderInterface>({
        orderDate: '',
        lotNumber: '',
        productId: '',
        productName: '',
        productExp: '',
        productionDate: '',
        expiryDate: '',
        quantity: 0,
    });

    const [products, setProducts] = useState<FgcodeInterface[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>('');

    // ดึงข้อมูลสินค้าจาก API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                console.log(`กำลังดึงข้อมูลจาก: ${Config.apiUrl}/fgcode`);
                
                const response = await fetch(`${Config.apiUrl}/fgcode`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                });
                
                console.log('สถานะการตอบกลับ:', response.status);
                
                if (!response.ok) {
                    let errorMsg = `HTTP error! status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || errorMsg;
                    } catch {
                        // ถ้าอ่าน JSON ไม่ได้ ใช้ข้อความ default
                    }
                    throw new Error(errorMsg);
                }
                
                const data = await response.json();
                console.log('ข้อมูลสินค้าที่ได้รับ:', data);
                setProducts(data);
                setError('');
            } catch (err: any) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:', err);
                setError(`ไม่สามารถดึงข้อมูลสินค้าได้: ${err.message}`);
                
                
            
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // ตั้งค่าวันที่สั่งสินค้าเป็นวันที่ปัจจุบันอัตโนมัติ
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setOrderData(prev => ({ ...prev, orderDate: today }));
    }, []);

    // คำนวณวันหมดอายุจากวันที่ผลิตและอายุผลิตภัณฑ์ - แก้ไขให้รองรับรูปแบบต่างๆ
    const calculateExpiryDate = (manufactureDate: string, shelfLife: string): string => {
        if (!manufactureDate || !shelfLife) {
            console.warn('ข้อมูลไม่ครบสำหรับคำนวณวันหมดอายุ');
            return '';
        }

        if (typeof shelfLife !== 'string') {
            console.error('shelfLife ไม่ใช่ string:', shelfLife);
            return '';
        }

        try {
            const mfgDate = new Date(manufactureDate);
            
            if (isNaN(mfgDate.getTime())) {
                console.error('วันที่ผลิตไม่ถูกต้อง:', manufactureDate);
                return '';
            }

            const trimmedShelfLife = shelfLife.trim();
            let numValue: number;
            let unit: string;

            const spaceIndex = trimmedShelfLife.indexOf(' ');
            
            if (spaceIndex === -1) {
                numValue = parseInt(trimmedShelfLife);
                unit = 'months';
                console.log(`ใช้หน่วย default (เดือน) สำหรับ shelfLife: "${shelfLife}"`);
            } else {
                const valueStr = trimmedShelfLife.substring(0, spaceIndex);
                unit = trimmedShelfLife.substring(spaceIndex + 1).toLowerCase();
                numValue = parseInt(valueStr);
            }
            
            if (isNaN(numValue)) {
                console.error('ค่าใน shelfLife ไม่ใช่ตัวเลข:', trimmedShelfLife);
                return '';
            }

            const newDate = new Date(mfgDate);
            
            if (unit.includes('day') || unit.includes('วัน')) {
                newDate.setDate(newDate.getDate() + numValue);
                console.log(`เพิ่ม ${numValue} วัน`);
            } else if (unit.includes('month') || unit.includes('mon') || unit.includes('เดือน') || unit === 'months' || unit === 'month') {
                newDate.setMonth(newDate.getMonth() + numValue);
                console.log(`เพิ่ม ${numValue} เดือน`);
            } else if (unit.includes('year') || unit.includes('yr') || unit.includes('ปี')) {
                newDate.setFullYear(newDate.getFullYear() + numValue);
                console.log(`เพิ่ม ${numValue} ปี`);
            } else {
                console.warn(`หน่วยเวลาไม่รู้จัก: "${unit}" ใช้ months เป็นค่าเริ่มต้น`);
                newDate.setMonth(newDate.getMonth() + numValue);
            }

            const result = newDate.toISOString().split('T')[0];
            console.log(`คำนวณวันหมดอายุ: ${manufactureDate} + ${shelfLife} (${numValue} ${unit}) = ${result}`);
            return result;
        } catch (err) {
            console.error('เกิดข้อผิดพลาดในการคำนวณวันหมดอายุ:', err);
            return '';
        }
    };

    // จัดการเมื่อเปลี่ยนรหัสสินค้า
    const handleProductCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const code = e.target.value;
        console.log(`ผู้ใช้กรอกรหัสสินค้า: ${code}`);
        
        setOrderData(prev => ({ ...prev, productId: code }));

        const product = products.find(p => p.id === code);
        
        if (product) {
            console.log(`พบสินค้า: ${product.name} (อายุ: ${product.exp})`);
            setOrderData(prev => ({
                ...prev,
                productId: code,
                productName: product.name,
                productExp: product.exp,
                expiryDate: calculateExpiryDate(prev.productionDate, product.exp),
            }));
        } else {
            console.log(`ไม่พบสินค้ารหัส: ${code}`);
            setOrderData(prev => ({
                ...prev,
                productName: '',
                productExp: '',
                expiryDate: '',
            }));
        }
    };

    // จัดการเมื่อเปลี่ยนวันที่ผลิต
    const handleProductionDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const mfgDate = e.target.value;
        console.log(`ผู้ใช้เลือกวันที่ผลิต: ${mfgDate}`);
        
        setOrderData(prev => ({
            ...prev,
            productionDate: mfgDate,
            expiryDate: calculateExpiryDate(mfgDate, prev.productExp),
        }));
    };

    // ส่งข้อมูลไปยัง dashboard
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const requiredFields = ['lotNumber', 'productId', 'productionDate', 'quantity'];
            const missingFields = requiredFields.filter(field => !orderData[field as keyof OrderInterface]);
            
            if (missingFields.length > 0) {
                alert(`กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(', ')}`);
                return;
            }

            const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
            const newOrder = { 
                ...orderData, 
                id: Date.now(),
                createdAt: new Date().toISOString()
            };
            
            localStorage.setItem('orders', JSON.stringify([...existingOrders, newOrder]));

            Swal.fire({
                icon:"success",
                title:"Success",
                text:"บันทึกคำสั่งเรียบร้อย"
            })
            
            setOrderData({
                orderDate: new Date().toISOString().split('T')[0],
                lotNumber: '',
                productId: '',
                productName: '',
                productExp: '',
                productionDate: '',
                expiryDate: '',
                quantity: 0,
            });

        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการบันทึก:', error);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center text-blue-700">
                    📦 ฟอร์มสั่งฉลากสินค้า
                </h1>

                

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* วันที่สั่งฉลากสินค้า */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    วันที่สั่งฉลากสินค้า
                                </label>
                                <input
                                    type="date"
                                    value={orderData.orderDate}
                                    readOnly
                                    className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            {/* เลขลอตสินค้า */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    เลขลอตสินค้า
                                </label>
                                <input
                                    type="text"
                                    value={orderData.lotNumber}
                                    onChange={(e) => setOrderData(prev => ({ ...prev, lotNumber: e.target.value }))}
                                    placeholder='ป้อนเลขลอต'
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                />
                            </div>

                            {/* รหัสสินค้า */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    รหัสสินค้า
                                </label>
                                <input
                                    type="text"
                                    list="product-list"
                                    value={orderData.productId}
                                    onChange={handleProductCodeChange}
                                    placeholder="ป้อนรหัสสินค้า"
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                />
                                <datalist id="product-list">
                                    {products.map(product => (
                                        <option key={product.id} value={product.id}>
                                            {product.name}
                                        </option>
                                    ))}
                                </datalist>
                                
                            </div>

                            {/* ชื่อสินค้า (แสดงอัตโนมัติ) */}
                            {orderData.productName && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        ชื่อสินค้า
                                    </label>
                                    <input
                                        type="text"
                                        value={orderData.productName}
                                        readOnly
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg text-gray-800"
                                    />
                                </div>
                            )}

                            {/* อายุผลิตภัณฑ์ (แสดงอัตโนมัติ) */}
                            {orderData.productExp && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        อายุผลิตภัณฑ์
                                    </label>
                                    <input
                                        type="text"
                                        value={orderData.productExp}
                                        readOnly
                                        className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-lg text-gray-800 font-medium"
                                    />
                                </div>
                            )}

                            {/* วันที่ผลิต */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    วันที่ผลิต
                                </label>
                                <input
                                    type="date"
                                    value={orderData.productionDate}
                                    onChange={handleProductionDateChange}
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                />
                            </div>

                            {/* วันหมดอายุ (คำนวณอัตโนมัติ) */}
                            {orderData.expiryDate && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        วันหมดอายุ (คำนวณอัตโนมัติ)
                                    </label>
                                    <input
                                        type="date"
                                        value={orderData.expiryDate}
                                        readOnly
                                        className="w-full px-4 py-3 bg-green-100 border border-green-300 rounded-lg text-gray-800 font-medium"
                                    />
                                </div>
                            )}

                            {/* จำนวน */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    จำนวน
                                </label>
                                <input
                                    type="number"
                                    value={orderData.quantity || ''}
                                    onChange={(e) => setOrderData(prev => ({ 
                                        ...prev, 
                                        quantity: Math.max(1, parseInt(e.target.value) || 1) 
                                    }))}
                                    placeholder="กรอกจำนวนที่ต้องการสั่ง"
                                    min="1"
                                    required
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
                                />
                            </div>

                            {/* ปุ่มส่งข้อมูล */}
                            <div className="space-y-4">
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-800 transform transition duration-200 hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    disabled={!orderData.lotNumber || !orderData.productId || !orderData.productionDate || !orderData.quantity}
                                >
                                    <div className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        ✓ บันทึกคำสั่งซื้อ
                                    </div>
                                </button>
                            </div>
                        </form>

                       
                
            </div>
        </div>
    );
}