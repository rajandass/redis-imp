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
            const data = await getOrSetCache(`photos?albumId=${albumId}`, async()=>{
            const { data } = await axios.get(
                "https://jsonplaceholder.typicode.com/photos",
                { params: { albumId } }
            ) 
            return data
        })

        res.json(data)
    
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Server error" })
    }
    
});

app.get("/photos/:id", async (req, res)=> {

    try {
            const data = await getOrSetCache(`photos:${req.params.id}`, async()=>{

            const { data } = await axios.get(`https://jsonplaceholder.typicode.com/photos/${req.params.id}`) 
            return data
            })

            res.json(data)

        } catch (error) {
            console.error(error)
            res.status(500).json({ error: "Server error" })
        }

})

async function getOrSetCache(key, cb) {
    try {
        // Get data from Redis cache
        const photos = await redisclient.get(key)
        if(photos != null) {
            console.log('cache hit')
            return JSON.parse(photos)
        }
            console.log('cache miss')
            const freshData = await cb()
             // Store in Redis cache
            await redisclient.setEx(key, DEFALUT_EXPIRATION, JSON.stringify(freshData))   
            return freshData
        
         
    } catch (error) {
        console.error(error)
        throw error
    }
}

app.listen(port, () =>{
    console.log(`App listening on port ${port}`)
})