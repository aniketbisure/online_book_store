//1.import mongoclient
const {MongoClient}=require('mongodb')
//2. create connection url
const url='mongodb://localhost:27017/';
//3. create instance of MnogoClient
const client = new MongoClient(url);

async function main()
{
    await client.connect();
    console.log("connected successfully to database server")
    const db=client.db("MERN")
    return db.createCollection("books");
}
module.exports=main;