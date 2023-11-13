const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7dcoggr.mongodb.net/?retryWrites=true&w=majority`;

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
        // Send a ping to confirm a successful connection
        const foodsCollection = client.db('restaurantManagement').collection('foods');
        const cardCollection = client.db('restaurantManagement').collection('cards');

        app.post('/addToCard', async (req, res) => {
            const card = req.body;
            const result = await cardCollection.insertOne(card);
            res.send(result);
        })

        app.get('/updateProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const cursor = foodsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);

        })

        app.get('/addedItems', async (req, res) => {
            let query = {};
            if (req.query?.email) {
                query = { addBy: req.query.email };
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
                    addBy: updateProduct.addBy,
                    origin: updateProduct.origin,
                    image: updateProduct.image
                }
            };
            const result = await foodsCollection.updateOne(filter, product, options);
            res.send(result);
        })

        app.delete('/foods/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
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