export interface OrderInterface{
    id:number;
    orderDate:string;
    orderTime?:string;
    orderDateTime?:string
    lotNumber:string;
    productId:string;
    productName:string;
    productExp:string;
    productionDate:string;
    expiryDate:string;
    quantity:number;
    notes?:string;
    createdBy?:string;
    createdAt?:string;
    verifiedBy?:string;
    vertfiedAt?:string;
    isVerified?:boolean;

}