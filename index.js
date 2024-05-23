const express = require('express');
const cors = require('cors');
require('dotenv').config()
var jwt = require('jsonwebtoken');
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
    // await client.connect();
    
    const database = client.db("bistroBoss");
    const menuCollection = database.collection("menu");
    const reviewsCollection = database.collection("reviews");
    const cartCollection = database.collection("cart");
    const userCollection = database.collection("users");

    // jwt 
    app.post("/jwt", (req, res) => {
      const user = req.body
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send({token})
    })

    // middleware
    const verifyToken = (req, res, next) => {
      // const token = req.headers.authorisation.split(' ')[1]
      if(!req.headers.authorisation){
        return res.status(401).send({message : "unauthorise access"})
      }
      const token = req.headers.authorisation.split(' ')[1]
      console.log("from verify token", token)
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
          return res.status(401).send({message : "unauthorise access"})
        }
        req.decoded = decoded
        next()
      })
      
    }

    const verifyAdmin = async(req, res, next) => {
      const email = req.decoded.email
      const query = {email: email}
      const user = await userCollection.findOne(query)
      const isAdmin = user?.role === "Admin"
      if(!isAdmin){
        return res.status(403).send({message : "forbidden access"})
      }
      next()
    }
    
    // menu related
    app.get("/menu", async(req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result)

    })
    
    // reviews related
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

    // user related
    app.get("/users", verifyToken, verifyAdmin, async(req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result)

    })

    app.post("/users", async(req, res) => {
      const user = req.body
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
        return res.send({message: "user already exist"})
      }
      const result = await userCollection.insertOne(user);
      res.send(result)
    })

    app.patch("/users/admin/:id", verifyToken, verifyAdmin, async(req, res) => {
      let id = req.params.id
      let filter = {_id: new ObjectId(id)}
      let updateDoc = {
        $set: {
           role: "Admin"
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc)
      res.send(result)
    })

    app.get("/users/admin/:email", verifyToken, verifyAdmin, async(req, res) => {
        const email = req.params.email
        console.log(req.decoded.email)
        if(email !== req.decoded.email){
          return res.status(403).send({message : "forbidden access"})
        }
        const query = {email: email}
        const user = await userCollection.findOne(query)
        let admin = false
        if(user){
          admin = user?.role === "Admin"
        }
        res.send({admin})
    })

    app.delete("/users/:id", verifyToken, verifyAdmin, async(req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      let result = await userCollection.deleteOne(query)
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