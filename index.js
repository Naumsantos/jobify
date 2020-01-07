const express = require('express') //importa o modulo express
const app = express() //nova aplicação usando o express

const bodyParser = require('body-parser') //propriedade que entende tudo que estiver no body da pagina

const sqlite = require('sqlite') //importando o banco
const dbConnection = sqlite.open('banco.sqlite', { Promise }) //conexão com o banco de dados

const port = process.env.PORT || 3000

app.set('view engine', 'ejs') //vai ler as outras partes da pagina
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: true }))

//função callback
app.get('/',async (request, response) => { //retorna o conteúdo da pagina 'home'.
    const db = await dbConnection    //espera o banco ser conectado
    const categoriasDb = await db.all('select * from categorias;') //pede para o banco apresentar todos os dados da tabela categorias
    const vagas = await db.all('select * from vagas;') //pede para o banco apresentar todos os dados da tabela vagas
    const categorias = categoriasDb.map(cat => {
        return {
            ...cat, //spread operator (operadr de espalhar)
            vagas: vagas.filter( vaga => vaga.categoria === cat.id) //vai retornar as vagas que forem iguais ao id das categorias
        }
    })
    //retorna para o usuário os dados do BD
    response.render('home', {
        categorias,
        vagas
    })
})

app.get('/vaga/:id', async (request, response) => { //retorna a requisição do usuário após ele clicar na vaga
    const db = await dbConnection
    const vaga = await db.get('select * from vagas where id = '+request.params.id)
    response.render('vaga', { vaga }) 
})

app.get('/admin', (req, res) => {
    res.render('admin/home')
})

app.get('/admin/vagas', async (req, res)=>{
    const db = await dbConnection
    const vagas = await db.all('select * from vagas;')
    res.render('admin/vagas', {vagas})
})

app.get('/admin/vagas/delete/:id', async(req, res)=>{
    const db = await dbConnection
    await db.run('delete from vagas where id = '+req.params.id)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/nova', async(req, res)=>{
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    res.render('admin/nova-vaga', {categorias})
})

app.post('/admin/vagas/nova', async(req, res)=>{
    const {titulo, descricao, categoria} = req.body    
    const db = await dbConnection
    await (await db).run(`insert into vagas(categoria, titulo, descricao) values('${categoria}', '${titulo}','${descricao}')`) //issere o dado na tabela vagas no BD
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/editar/:id', async(req, res)=>{
    const db = await dbConnection
    const categorias = await db.all('select * from categorias')
    const vaga = await db.get('select * from vagas where id ='+req.params.id)
    res.render('admin/editar-vaga', {categorias, vaga})
})

app.post('/admin/vagas/editar/:id', async(req, res)=>{
    const {titulo, descricao, categoria} = req.body    
    const { id } = req.params
    const db = await dbConnection
    await (await db).run(`update vagas set categoria = '${categoria}', titulo = '${titulo}', descricao = '${descricao}' where id = ${id}`) //issere o dado na tabela vagas no BD
    res.redirect('/admin/vagas')
})

//criação do banco de dados
const init = async() => {
    const db = dbConnection
    await (await db).run('create table if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);') //cria a tabela catecogias no BD
    await (await db).run('create table if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);') //cria a tabela cagas no BD
    //const categoria = "Social Team"
    //await (await db).run(`insert into categorias(categoria) values('${categoria}')`) //issere o dado da variável no BD
    
}
init ()

//lista uma porta para o servidor
app.listen(port, (err) => { 
    if(err){
        console.log('Não foi possível iniciar o servidor')
    }else{
        console.log('Servidor rodando...')
    }
})
