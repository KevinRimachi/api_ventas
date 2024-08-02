import app from "./app";

const PORT = process.env.PORT || process.env.PORT

app.listen(PORT, ()=>{
  console.log(`Se esta ejecutando en el puerto ${PORT}`)
})