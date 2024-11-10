const mongoose=require('mongoose');
const productSchema=mongoose.Schema({
    buyerName:{type:Number},
    title:{type:String},
    qty:{type:Number,min:1,max:10},
    price:{type:Number}
})
module.exports=mongoose.model('orders',productSchema)