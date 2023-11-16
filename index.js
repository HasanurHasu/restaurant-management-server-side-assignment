const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser')
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
    origin: ['http://localhost:5174', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7dcoggr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// middlewares

const logger = async(req, res, next) => {
    console.log('called:', req.host, req.originalUrl);
    next();
}

const verifyToken = async(req, res, next) => {
    const token = req.cookies?.token;
    console.log(token);
    if(!token){
      return  res.status(401).send({message: 'Not Authorized'})
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err){
            return res.status(401).send({message: 'Unauthorized'})
        }
        console.log('code is', decoded);
        req.user = decoded;
        next();
    })
    
}


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        const foodsCollection = client.db('restaurantManagement').collection('foods');
        const cardCollection = client.db('restaurantManagement').collection('cards');
        const userCollection = client.db('restaurantManagement').collection('users');

        app.post('/user', async(req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result)
        })


        app.post('/addToCard', async (req, res) => {
            const card = req.body;
            const result = await cardCollection.insertOne(card);
            res.send(result);
        })

        app.get('/myOrder', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email };
            };
            const cursor = cardCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/updateProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const cursor = foodsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/user/:id', async (req, res) => {
            const email = req.params.id;
            const query = { email: email };
            const cursor = foodsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/addedItems', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { addByEmail: req.query.email };
            };
            const cursor = foodsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/foods', async (req, res) => {
            const cursor = foodsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/topFoods', async (req, res) => {
            const query = {};
            const options = {
                sort: { totalOrder: -1 }
            }
            const cursor = foodsCollection.find(query, options);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/allFoots', async (req, res) => {
            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);

            const result = await foodsCollection.find()
                .skip(page * size)
                .limit(size)
                .toArray();
            res.send(result)
        })

        app.get('/foodsCount', async (req, res) => {
            const count = await foodsCollection.estimatedDocumentCount();
            res.send({ count })
        })


        app.post('/foods', async (req, res) => {
            const food = req.body;
            const result = await foodsCollection.insertOne(food)
            res.send(result)
        })

        app.put('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateProduct = req.body;
            const product = {
                $set: {
                    name: updateProduct.name,
                    category: updateProduct.category,
                    quantity: updateProduct.quantity,
                    price: updateProduct.price,
                    description: updateProduct.description,
                    addByEmail: updateProduct.addByEmail,
                    addByName: updateProduct.addByName,
                    origin: updateProduct.origin,
                    image: updateProduct.image
                }
            };
            const result = await foodsCollection.updateOne(filter, product, options);
            res.send(result);
        })
        app.put('/foodsOrder/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const updateProduct = req.body;
            const product = {
                $set: {
                    totalOrder: updateProduct.totalOrder,
                }
            };
            const result = await foodsCollection.updateOne(filter, product, options);
            res.send(result);
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await cardCollection.deleteOne(query);
            res.send(result)
        })

        app.delete('/foods/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await foodsCollection.deleteOne(query);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Restaurant management server is running')
});

app.listen(port, () => {
    console.log(`Restaurant server is running on port: ${port}`);
})