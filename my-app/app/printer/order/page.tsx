'use client';

import React, { useState, useEffect } from 'react';
import { OrderInterface } from '../printer/interface/OrderInterface';
import { FgcodeInterface } from '../printer/interface/FgcodeInterface';
import { Config } from "../../Config";
import Swal from 'sweetalert2';

export default function OrderPage() {
    const [orderData, setOrderData] = useState<OrderInterface>({
        orderDate: '',
        orderTime:'',
        orderDateTime:'',
        lotNumber: '',
        productId: '',
        productName: '',
        productExp: '',
        productionDate: '',
        expiryDate: '',
        quantity: 0,
        notes:'',
        
    });

    const [products, setProducts] = useState<FgcodeInterface[]>([]);
    const [username, setUsername] = useState('')
    // ดึงข้อมูลสินค้าจาก API
    useEffect(() => {
          fetchUserInfo();
          fetchProducts();

          const today = new Date().toISOString().split('T')[0];
          setOrderData(prev => ({ ...prev, orderDate:today }));
    }, []);

        const fetchUserInfo = async () => {
            try {
                const token = localStorage.getItem(Config.tokenKey);
                if (!token) return;
    
                const response = await fetch(`${Config.apiUrl}/printer/user/admin-info`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
    
                if (response.ok) {
                    const data = await response.json();
                    setUsername(data.name);
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
            }
        };

        const fetchProducts = async () => {
            try {
                const response = await fetch(`${Config.apiUrl}/fgcode`, {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    mode: 'cors',
                });
                
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
                // ← เพิ่มบรรทัดนี้เพื่อดู field จริง
        console.log('API field จริง:', JSON.stringify(data[0], null, 2));
        
                setProducts(data);
                
            } catch (err: any) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า:', err);
               
                
                
            
            
            }
        };

    

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
            
            // ← เพิ่ม: ถ้าค่าที่ได้ไม่ใช่ตัวเลข ให้ warning และ return ''
        if (isNaN(numValue) || numValue <= 0) {
            console.warn(`calculateExpiryDate: ไม่สามารถ parse "${shelfLife}" เป็นตัวเลขได้`);
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
        console.log('Product found:', product); // ← ดูว่า field ไหนคืออะไร

            setOrderData(prev => ({
                ...prev,
                productId: code,
                productName: product.exp,
                productExp: product.name,
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

    // ตั้งค่าวันที่สั่งสินค้าเป็นวันที่ปัจจุบันอัตโนมัติ
    useEffect(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // วันที่
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // เวลา
        
        setOrderData(prev => ({
            ...prev, 
            orderDate: today,
            orderTime: currentTime,
            orderDateTime: now.toISOString()
        }));
    }, []);

    // ... keep other functions the same ...

    // ส่งข้อมูลไปยัง dashboard
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        try {
            // ตรวจสอบ required fields
            const requiredFields = ['lotNumber', 'productId', 'productionDate', 'quantity'];
            const missingFields = requiredFields.filter(field => !orderData[field as keyof OrderInterface]);
            
            if (missingFields.length > 0) {
                alert(`กรุณากรอกข้อมูลให้ครบถ้วน: ${missingFields.join(', ')}`);
                return;
            }
    
            const token = localStorage.getItem(Config.tokenKey);
            if (!token) {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่พบ Token',
                    text: 'กรุณาเข้าสู่ระบบอีกครั้ง'
                });
                return;
            }
    
            // เตรียมข้อมูลที่จะส่งไป backend
            const orderPayload = {
                orderDate: orderData.orderDate,               // YYYY-MM-DD
                lotNumber: orderData.lotNumber,
                productId: orderData.productId,
                productName: orderData.productName,
                productExp: orderData.productExp,
                productionDate: orderData.productionDate,     // YYYY-MM-DD
                expiryDate: orderData.expiryDate,             // YYYY-MM-DD
                quantity: orderData.quantity,
                notes: orderData.notes || '-',
                createdBy: username,                          // ชื่อผู้ login
                isVerified: false,
                verifiedBy: null,
                verifiedAt: null
            };
    
            const response = await fetch(`${Config.apiUrl}/printer/order/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(orderPayload)
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                throw new Error(result.message || 'ไม่สามารถบันทึกคำสั่งซื้อได้');
            }
    
            // ✅ บันทึกสำเร็จ
            Swal.fire({
                icon: 'success',
                title: 'บันทึกสำเร็จ',
                text: `บันทึกคำสั่งซื้อลงฐานข้อมูลแล้ว\nเลขที่อ้างอิง: ${result.id}`
            });
    
            // ✅ ล้างฟอร์ม (วันที่/เวลาปัจจุบัน)
            const resetNow = new Date();
            setOrderData({
                orderDate: resetNow.toISOString().split('T')[0],
                orderTime: resetNow.toTimeString().split(' ')[0].substring(0, 5),
                orderDateTime: resetNow.toISOString(),
                lotNumber: '',
                productId: '',
                productName: '',
                productExp: '',
                productionDate: '',
                expiryDate: '',
                quantity: 0,
                notes: '',
            });
    
        } catch (error: any) {
            console.error('Error saving order:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'กรุณาลองใหม่อีกครั้ง'
            });
        }
    };

    // ฟังก์ชันแปลงเป็นรูปแบบไทย
    const formatThaiDateTime = () => {
        if (!orderData.orderDate || !orderData.orderTime) return 'กำลังโหลด...';
        
        try {
            const [year, month, day] = orderData.orderDate.split('-');
            const [hours, minutes] = orderData.orderTime.split(':');
            
            // แปลง ค.ศ. เป็น พ.ศ.
            const thaiYear = parseInt(year) + 543;
            
            return `${day}/${month}/${thaiYear}, ${hours}:${minutes}`;
        } catch (error) {
            return `${orderData.orderDate}, ${orderData.orderTime}`;
        }
    };


      

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8 text-center text-blue-700">
                    📦 ฟอร์มสั่งฉลากสินค้า
                </h1>
                  <form onSubmit={handleSubmit} className="space-y-6">
             
                    {/* วันที่และเวลาสั่ง */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            วันที่และเวลาสั่ง
                        </label>
                        <div className="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-gray-800 font-medium">
                            {formatThaiDateTime()}
                        </div>
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

                            {/* หมายเหตุ */}
                            <div>
                                <label className='block text-sm font-semibold text-gray-700 mb-2'>
                                    หมายเหตุ
                                </label>
                                <textarea
                                value={orderData.notes || ''}
                                onChange={(e) => setOrderData (prev => ({...prev, notes: e.target.value}))}
                                placeholder='กรอกรายละเอียดเพิ่มเติม(หากไม่มีให้ใส่ -)'
                                rows={3}
                                className='w-full px-4 py-3 bg-white border border-gray-300 rounded-b-lg text-gray-800 focus:outline-none focus: ring-blue-500 focus:border-blue-500 transition duration-200 resize-none'/>
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