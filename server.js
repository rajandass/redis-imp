const express = require("express")
const axios = require("axios")
const cors = require("cors")
const Redis = require('redis')

const redisclient = Redis.createClient({ url:'redis://localhost:6379/'})
;(async () => {
    await redisclient.connect()
})().catch(console.error)

const DEFALUT_EXPIRATION = 3600



const app = express()
const port = 3000
app.use(express.urlencoded({extended: true}))
app.use(cors())




app.get("/photos", async (req,res) => {
   
    const albumId =req.query.albumId

    try {
        // Get data from Redis cache
        const photos = await redisclient.get('photos')
        if(photos != null) {
            console.log('cache hit')
            return res.json(JSON.parse(photos))
        }
            console.log('cache miss')
            const { data } = await axios.get(
                "https://jsonplaceholder.typicode.com/photos",
                { params: { albumId } }
            ) 
             // Store in Redis cache
            await redisclient.setEx('photos', DEFALUT_EXPIRATION, JSON.stringify(data))
            
            res.json(data)
        
         
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Server error" })
    }
    
});

app.get("/photos/:id", async (req, res)=> {
    const { data } = await axios.get( `https://jsonplaceholder.typicode.com/photos/${req.params.id}`)
    res.json(data)

})

app.listen(port, () =>{
    console.log(`App listening on port ${port}`)
})