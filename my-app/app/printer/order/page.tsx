'use client'

export default function page(){
    return(
          <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-5">
                จัดการคำสั่งซื้อสินค้า
            </h1>

            
            <div className="flex justify-between items-center mb-6">
                <button
                    className="button-add"
                    onClick={() => {
                    
                    }}>
                    <i className="fas fa-plus mr-2"></i> สั่งซื้อสินค้าใหม่
                </button>
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="table">
                    <thead>
                        <tr>
                            <th>วันที่สั่งซื้อ</th>
                            <th>รหัสสินค้า</th>
                            <th>ชื่อสินค้า</th>
                            <th>วันที่ผลิต</th>
                            <th>วันหมดอายุ</th>
                            <th>จำนวน</th>
                            <th className="text-right" style={{width: '200px'}}>จัดการ</th>
                        </tr>
                    </thead>
                    </table>
                    </div>
                    </div>
    )
}