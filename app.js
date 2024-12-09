require ('dotenv').config();
const express = require('express');
const mogoose = require('mongoose');
const bcrypt = require('bcrypt');  
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());


const userSchema = require('./models/user');

app.get('/', (req, res) => {
    res.send('Hello World');
});

//Rota privada
app.get("/user/:id", checktoken, async (req, res) => {
    const id = req.params.id;

    const user = await userSchema.findById(id,'-password -passwordConfirm');

    if(!user){
        return res.status(404).json({error: 'Usuário não encontrado'});
    }

    res.status(200).json({user});
})


function checktoken(req,res,next){
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    //verificação do token
    if(!token){
        return res.status(401).json({error: 'Não autorizado'});
    }
    //verificação do token valido
    try{
        const secret = process.env.SECRET;
        jwt.verify (token, secret);

        next();
    }catch(err){
        return res.status(401).json({error: 'Não autorizado'});
    }
}

//registro de usuário
app.post('/register', async (req, res) => {
    const {name, email, password, passwordConfirm} = req.body;

    if(!name || !email || !password || !passwordConfirm){
        return res.status(422).json({error: 'Preencha todos os campos'});
    }
    if(password !== passwordConfirm){
        return res.status(422).json({error: 'As senhas não conferem'});
    }
    const userExists = await userSchema.findOne({email: email});

    if(userExists){
        return res.status(422).json({error: 'Usuário já cadastrado'});
    }
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new userSchema({
        name,
        email,
        password: passwordHash, 
        passwordConfirm: passwordHash
    });
    try {
        await user.save();
        res.status(201).json({message: 'Usuário criado com sucesso!'});

    }catch (err) {
        console.log(err);
        res.status(500).json({message: 'Erro ao cadastrar usuário'});
    }
})


//login de usuário
app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    //verificação dos campos    
    if(!email || !password){
        return res.status(422).json({error: 'Preencha todos os campos'});
    }
    //verificação do usuário
    const user = await userSchema.findOne({email: email});
    if(!user){
        return res.status(404).json({error: 'Usuário não encontrado'});
    }


    //verificação da senha
    const checkPassword = await bcrypt.compare(password, user.password);
    if(!checkPassword){
        return res.status(422).json({msg: 'Senha inválida'});
    }

    try{
        const secret = process.env.SECRET;
        const token = jwt.sign(
        {
            id: user._id
        }, secret);

        res.status(200).json({msg: 'Usuário logado com sucesso', token});

    }catch(err){
        console.log(err);
        res.status(500).json({message: 'Erro no servidor, tente novamente mais tarde'});
    }
})

app.use(bodyParser.json());


// Configurar transporte do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Substitua pelo provedor de e-mail
  auth: {
    user: 'juanramalho90@gmail.com', // Seu e-mail
    pass: 'pakm wfuu qjpr lcmd'            // Sua senha
  }
});

// Endpoint para receber os dados do formulário
app.post('/send', async (req, res) => {
  try {
    const { CEP, logradouro, bairro, cidade,numero, uf, descricao, curriculo, email, telefone, nome } = req.body;

    // Configurar conteúdo do e-mail
    const mailOptions = {
      from: 'juanramalho90@gmail.com',
      to: email, // E-mail do destinatário
      subject: 'Novo formulário recebido',
      text: `
        Dados do formulário:
        - Nome: ${nome}
        - Telefone: ${telefone}
        - CEP: ${CEP}
        - Logradouro: ${logradouro}
        - Numero: ${numero}
        - Bairro: ${bairro}
        - Cidade: ${cidade}
        - UF: ${uf}
        - Descrição: ${descricao}
      `,
      // Caso tenha o campo curriculo como base64
      attachments: curriculo
        ? [{ filename: 'curriculo.pdf', content: Buffer.from(curriculo, 'base64') }]
        : []
    };

    // Enviar e-mail
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Formulário enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error);
    res.status(500).json({ error: 'Erro ao enviar o formulário.' });
  }
});


const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

mogoose.connect(`mongodb+srv://${dbUser}:${dbPass}@cluster0.278lm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(()=>{
    app.listen(3001);
    console.log('connected ao banco de dados');
}).catch((err) => console.log(err));
