const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const pg = require('pg');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// import ReactDom from 'react-dom';
// import * as React from 'react';


const app = express()
app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true}));

const conString = "postgres://postgres:1234@localhost:5432/cqadb";
const client = new pg.Client(conString);

client.connect((err) => {
    if (err) {
      console.log('Database Connection failed');
    } else {
      console.log('Successfully connected to database');
    }
});

// ReactDom.render(<h1>Successfully</h1>,document.getElementById('root'));
app.get('/',(req,res)=>{
    // ReactDom.render(
    // <React.StrictMode>
    // <h1>Successfully</h1>
    // </React.StrictMode>,document.getElementById('root'));
    res.render('home');
});

app.get("/register",(req,res)=>{
    res.render('register');
});

app.get("/login",(req,res)=>{
    res.render('login');
});
app.post('/register', async (req,res)=>{
    var max = 0; 
    var count = 0;   
    try{
        const result = await client.query('select max(id) as m from users');
        max = result.rows[0].m;
    }
    catch(err){
        console.log(err.message);
    }
    try{
        const result = await client.query('select count(id) as c from users where user_name = $1',
        [req.body.username]);
        count = result.rows[0].c;
    }
    catch(err){
        console.log(err.message);
    }
    if(count == 0)
    {
        try{
            const date = new Date().toISOString();
            const result = await client.query('INSERT INTO users(id,display_name,user_name,password,creation_date,last_access_date) VALUES($1,$2,$2,$3,$4,$4)',
            [max+1,req.body.username,req.body.password,date]);
            res.render('login');
        }
        catch(err){
            console.log(err.message);
        }    
    }
    else
    {
        res.send('Usename already exists');
    }
});       
app.post('/login',async (req,res)=>{
    try{
        const result = await client.query('select id,password from users where user_name = $1',
        [req.body.username]);
        // const result2 = await client.query('select body as content from posts where user_id = $1',
        // [result.rows[0].id]);
        if(result.rows[0].password == req.body.password) 
        {

            // ReactDom.render(<h1>Successfully</h1>,document.getElementById('root'));
            res.redirect('/home/'+ String(result.rows[0].id));
            // console.log(result2.rows[0].content);
            // res.render('secrets',{hello : result2.rows[0].content});
            // res.send(result2.rows[0].content);
        }
        else res.send('Invalid Username or Password');
    }
    catch(err){
        console.log(err.message);
    }
});

app.get('/home/:id', async (req,res)=>{
    console.log(req.params.id);
    // res.send('Hello');
    try{
        const result = await client.query('select * from posts where post_type_id = 1 order by view_count desc limit 10');
        res.render('welcome',{questions : result.rows});
    }
    catch(err){
        console.log(err.messgae);
    }
});

app.get('/posts/:pid',async(req,res)=>{
    console.log(req.params.pid);
    try{
        const result = await client.query('select * from posts where id = $1',[req.params.pid]);
        res.render('post',{content : result.rows[0]});
    }
    catch(err){
        console.log(err.messgae);
    }
});

app.get('/tags/:tname',async(req,res)=>{
    try{
        const str = "%<" + req.params.tname + ">%";
        const result = await client.query('select * from posts where tags like $1',[str]);
        console.log(result.rows);
        res.render('tags',{questions : result.rows})
    }
    catch(err){
        console.log(err.messgae);
    }
});

app.get('/logout',(req,res)=>{
    res.render('home');
});

app.listen(3000,()=>{
    console.log('Server running on port 3000');
});
