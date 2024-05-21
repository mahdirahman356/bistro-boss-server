const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rz0kihv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    
    const database = client.db("bistroBoss");
    const menuCollection = database.collection("menu");
    const reviewsCollection = database.collection("reviews");
    const cartCollection = database.collection("cart");
    
    app.get("/menu", async(req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result)

    })

    app.get("/reviews", async(req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result)

    })

    // Cart
    app.post("/carts", async(req, res) => {
       let CartItem = req.body
       let result = await cartCollection.insertOne(CartItem)
       res.send(result)
    })
    app.get("/carts", async(req, res) => {
       let email = req.query.email
       let query = {email: email}
       let result = await cartCollection.find(query).toArray()
       res.send(result)
    })

    app.delete("/carts/:id", async(req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      let result = await cartCollection.deleteOne(query)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    app.get("/", (req, res) => {
        res.send("Bistro Boss Server")
    })
    
    app.listen(port, () => {
        console.log(`Example app listening on port ${port}`)
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);